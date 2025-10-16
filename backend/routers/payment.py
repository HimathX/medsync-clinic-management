from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from core.database import get_db
from datetime import date, datetime
import logging
import uuid

router = APIRouter(tags=["payments"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class PaymentCreate(BaseModel):
    patient_id: str = Field(..., description="Patient UUID")
    amount_paid: float = Field(..., gt=0, description="Amount paid")
    payment_method: str = Field(..., pattern="^(Cash|Credit Card|Debit Card|Online|Insurance|Other)$")
    payment_date: Optional[date] = Field(None, description="Payment date (defaults to today)")
    notes: Optional[str] = Field(None, description="Additional notes")
    
    @validator('patient_id')
    def validate_patient_uuid(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError(f"Invalid patient ID format: {v}")
    
    class Config:
        json_schema_extra = {
            "example": {
                "patient_id": "patient-uuid-here",
                "amount_paid": 5000.00,
                "payment_method": "Credit Card",
                "payment_date": "2024-10-16",
                "notes": "Full payment for consultation and treatment"
            }
        }

class PaymentUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(Completed|Pending|Failed|Refunded)$")
    notes: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "Completed",
                "notes": "Payment confirmed"
            }
        }

class PaymentResponse(BaseModel):
    success: bool
    message: str
    payment_id: Optional[str] = None


# ============================================
# CREATE PAYMENT
# ============================================

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=PaymentResponse)
def create_payment(payment_data: PaymentCreate):
    """
    Record a new payment
    
    - Validates patient exists
    - Creates payment record with Pending status
    - Can be updated to Completed after verification
    """
    try:
        logger.info(f"Recording payment for patient: {payment_data.patient_id}")
        
        with get_db() as (cursor, connection):
            # Validate patient exists
            cursor.execute(
                "SELECT * FROM patient WHERE patient_id = %s",
                (payment_data.patient_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {payment_data.patient_id} not found"
                )
            
            # Generate payment ID
            payment_id = str(uuid.uuid4())
            payment_date = payment_data.payment_date or date.today()
            
            # Insert payment
            cursor.execute(
                """INSERT INTO payment (
                    payment_id, patient_id, amount_paid, payment_method, 
                    status, payment_date, notes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (
                    payment_id,
                    payment_data.patient_id,
                    payment_data.amount_paid,
                    payment_data.payment_method,
                    'Pending',  # Default status
                    payment_date,
                    payment_data.notes
                )
            )
            connection.commit()
            
            logger.info(f"✅ Payment recorded successfully: {payment_id}")
            
            return PaymentResponse(
                success=True,
                message="Payment recorded successfully",
                payment_id=payment_id
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording payment: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


# ============================================
# GET ALL PAYMENTS
# ============================================

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_payments(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    status_filter: Optional[str] = Query(None, pattern="^(Completed|Pending|Failed|Refunded)$"),
    payment_method: Optional[str] = Query(None, pattern="^(Cash|Credit Card|Debit Card|Online|Insurance|Other)$"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
):
    """Get all payments with optional filters"""
    try:
        with get_db() as (cursor, connection):
            # Build WHERE clause
            where_conditions = []
            params = []
            
            if status_filter:
                where_conditions.append("p.status = %s")
                params.append(status_filter)
            
            if payment_method:
                where_conditions.append("p.payment_method = %s")
                params.append(payment_method)
            
            if date_from:
                where_conditions.append("p.payment_date >= %s")
                params.append(date_from)
            
            if date_to:
                where_conditions.append("p.payment_date <= %s")
                params.append(date_to)
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            # Get total count
            count_query = f"""
                SELECT COUNT(*) as total
                FROM payment p
                WHERE {where_clause}
            """
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']
            
            # Get payments
            query = f"""
                SELECT 
                    p.*,
                    u.full_name as patient_name,
                    u.email as patient_email
                FROM payment p
                JOIN patient pt ON p.patient_id = pt.patient_id
                JOIN user u ON pt.patient_id = u.user_id
                WHERE {where_clause}
                ORDER BY p.payment_date DESC, p.created_at DESC
                LIMIT %s OFFSET %s
            """
            params.extend([limit, skip])
            
            cursor.execute(query, params)
            payments = cursor.fetchall()
            
            return {
                "total": total,
                "returned": len(payments),
                "payments": payments or []
            }
    except Exception as e:
        logger.error(f"Error fetching payments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET PAYMENT BY ID
# ============================================

@router.get("/{payment_id}", status_code=status.HTTP_200_OK)
def get_payment_by_id(payment_id: str):
    """Get payment details by ID"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(payment_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid payment ID format: {payment_id}"
            )
        
        with get_db() as (cursor, connection):
            query = """
                SELECT 
                    p.*,
                    u.full_name as patient_name,
                    u.email as patient_email,
                    u.NIC as patient_nic,
                    c.contact_num1 as patient_contact
                FROM payment p
                JOIN patient pt ON p.patient_id = pt.patient_id
                JOIN user u ON pt.patient_id = u.user_id
                JOIN contact c ON u.contact_id = c.contact_id
                WHERE p.payment_id = %s
            """
            
            cursor.execute(query, (payment_id,))
            payment = cursor.fetchone()
            
            if not payment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Payment with ID {payment_id} not found"
                )
            
            return {"payment": payment}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payment {payment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET PAYMENTS BY PATIENT
# ============================================

@router.get("/patient/{patient_id}", status_code=status.HTTP_200_OK)
def get_payments_by_patient(patient_id: str):
    """Get all payments for a specific patient"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(patient_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid patient ID format: {patient_id}"
            )
        
        with get_db() as (cursor, connection):
            # Check if patient exists
            cursor.execute(
                "SELECT * FROM patient WHERE patient_id = %s",
                (patient_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            # Get payments
            query = """
                SELECT 
                    p.*
                FROM payment p
                WHERE p.patient_id = %s
                ORDER BY p.payment_date DESC, p.created_at DESC
            """
            
            cursor.execute(query, (patient_id,))
            payments = cursor.fetchall()
            
            # Calculate totals
            total_paid = sum(float(p['amount_paid']) for p in payments if p['status'] == 'Completed')
            
            return {
                "patient_id": patient_id,
                "total_payments": len(payments),
                "total_amount_paid": total_paid,
                "payments": payments or []
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payments for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# UPDATE PAYMENT
# ============================================

@router.patch("/{payment_id}", status_code=status.HTTP_200_OK)
def update_payment(payment_id: str, update_data: PaymentUpdate):
    """Update payment status and notes"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(payment_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid payment ID format: {payment_id}"
            )
        
        with get_db() as (cursor, connection):
            # Check if payment exists
            cursor.execute(
                "SELECT * FROM payment WHERE payment_id = %s",
                (payment_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Payment with ID {payment_id} not found"
                )
            
            # Build update query
            updates = []
            params = []
            
            if update_data.status:
                updates.append("status = %s")
                params.append(update_data.status)
            
            if update_data.notes is not None:
                updates.append("notes = %s")
                params.append(update_data.notes)
            
            if not updates:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            params.append(payment_id)
            
            update_query = f"""
                UPDATE payment 
                SET {', '.join(updates)}
                WHERE payment_id = %s
            """
            
            cursor.execute(update_query, params)
            connection.commit()
            
            # Fetch updated payment
            cursor.execute(
                "SELECT * FROM payment WHERE payment_id = %s",
                (payment_id,)
            )
            updated_payment = cursor.fetchone()
            
            logger.info(f"Payment {payment_id} updated successfully")
            
            return {
                "success": True,
                "message": "Payment updated successfully",
                "payment": updated_payment
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating payment {payment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# DELETE PAYMENT
# ============================================

@router.delete("/{payment_id}", status_code=status.HTTP_200_OK)
def delete_payment(payment_id: str):
    """Delete a payment record (use with caution)"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(payment_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid payment ID format: {payment_id}"
            )
        
        with get_db() as (cursor, connection):
            # Check if payment exists
            cursor.execute(
                "SELECT * FROM payment WHERE payment_id = %s",
                (payment_id,)
            )
            payment = cursor.fetchone()
            
            if not payment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Payment with ID {payment_id} not found"
                )
            
            # Prevent deletion of completed payments
            if payment['status'] == 'Completed':
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete completed payments. Consider marking as Refunded instead."
                )
            
            # Delete payment
            cursor.execute(
                "DELETE FROM payment WHERE payment_id = %s",
                (payment_id,)
            )
            connection.commit()
            
            logger.info(f"✅ Payment {payment_id} deleted successfully")
            
            return {
                "success": True,
                "message": "Payment deleted successfully",
                "payment_id": payment_id
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting payment {payment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# PAYMENT STATISTICS
# ============================================

@router.get("/statistics/summary", status_code=status.HTTP_200_OK)
def get_payment_statistics(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
):
    """Get payment statistics and summary"""
    try:
        with get_db() as (cursor, connection):
            # Build date filter
            date_filter = ""
            params = []
            
            if date_from and date_to:
                date_filter = "WHERE payment_date BETWEEN %s AND %s"
                params = [date_from, date_to]
            elif date_from:
                date_filter = "WHERE payment_date >= %s"
                params = [date_from]
            elif date_to:
                date_filter = "WHERE payment_date <= %s"
                params = [date_to]
            
            # Total revenue by status
            query = f"""
                SELECT 
                    status,
                    COUNT(*) as count,
                    SUM(amount_paid) as total_amount
                FROM payment
                {date_filter}
                GROUP BY status
            """
            cursor.execute(query, params)
            by_status = cursor.fetchall()
            
            # By payment method
            query = f"""
                SELECT 
                    payment_method,
                    COUNT(*) as count,
                    SUM(amount_paid) as total_amount
                FROM payment
                {date_filter}
                GROUP BY payment_method
                ORDER BY total_amount DESC
            """
            cursor.execute(query, params)
            by_method = cursor.fetchall()
            
            # Daily statistics
            query = f"""
                SELECT 
                    payment_date,
                    COUNT(*) as payment_count,
                    SUM(amount_paid) as daily_total
                FROM payment
                {date_filter}
                GROUP BY payment_date
                ORDER BY payment_date DESC
                LIMIT 30
            """
            cursor.execute(query, params)
            daily_stats = cursor.fetchall()
            
            return {
                "by_status": by_status or [],
                "by_payment_method": by_method or [],
                "daily_statistics": daily_stats or [],
                "date_range": {
                    "from": str(date_from) if date_from else None,
                    "to": str(date_to) if date_to else None
                }
            }
            
    except Exception as e:
        logger.error(f"Error fetching payment statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
