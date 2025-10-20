from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
from pydantic import BaseModel, Field, validator
from core.database import get_db
from datetime import date, timedelta
import logging
import uuid

router = APIRouter(tags=["invoices"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class InvoiceCreate(BaseModel):
    consultation_rec_id: str = Field(..., description="Consultation record UUID")
    tax_percentage: Optional[float] = Field(0, ge=0, le=100, description="Tax percentage")
    due_days: Optional[int] = Field(30, ge=0, le=365, description="Days until due")
    
    @validator('consultation_rec_id')
    def validate_consultation_uuid(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError(f"Invalid consultation record ID format: {v}")
    
    class Config:
        json_schema_extra = {
            "example": {
                "consultation_rec_id": "consultation-uuid-here",
                "tax_percentage": 5.0,
                "due_days": 30
            }
        }

class InvoiceUpdate(BaseModel):
    tax_amount: Optional[float] = Field(None, ge=0, description="Tax amount")
    due_date: Optional[date] = Field(None, description="Due date")
    
    class Config:
        json_schema_extra = {
            "example": {
                "tax_amount": 250.00,
                "due_date": "2024-11-15"
            }
        }

class InvoiceResponse(BaseModel):
    success: bool
    message: str
    invoice_id: Optional[str] = None


# ============================================
# CREATE INVOICE
# ============================================

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=InvoiceResponse)
def create_invoice(invoice_data: InvoiceCreate):
    """
    Create an invoice for a consultation
    
    - Validates consultation record exists
    - Calculates subtotal from treatments and consultation fee
    - Applies tax
    - Sets due date
    """
    try:
        logger.info(f"Creating invoice for consultation: {invoice_data.consultation_rec_id}")
        
        with get_db() as (cursor, connection):
            # Check if consultation exists
            cursor.execute(
                "SELECT * FROM consultation_record WHERE consultation_rec_id = %s",
                (invoice_data.consultation_rec_id,)
            )
            consultation = cursor.fetchone()
            
            if not consultation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Consultation record with ID {invoice_data.consultation_rec_id} not found"
                )
            
            # Check if invoice already exists for this consultation
            cursor.execute(
                "SELECT * FROM invoice WHERE consultation_rec_id = %s",
                (invoice_data.consultation_rec_id,)
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Invoice already exists for this consultation"
                )
            
            # Get appointment details for doctor fee
            cursor.execute(
                """SELECT 
                    a.appointment_id,
                    ts.doctor_id,
                    d.consultation_fee
                FROM consultation_record cr
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                WHERE cr.consultation_rec_id = %s""",
                (invoice_data.consultation_rec_id,)
            )
            appointment_data = cursor.fetchone()
            consultation_fee = float(appointment_data['consultation_fee']) if appointment_data else 0
            
            # Calculate subtotal from treatments
            cursor.execute(
                """SELECT SUM(tc.base_price) as treatment_total
                FROM treatment t
                JOIN treatment_catalogue tc ON t.treatment_service_code = tc.treatment_service_code
                WHERE t.consultation_rec_id = %s""",
                (invoice_data.consultation_rec_id,)
            )
            result = cursor.fetchone()
            treatment_total = float(result['treatment_total']) if result and result['treatment_total'] else 0
            
            # Calculate totals
            sub_total = consultation_fee + treatment_total
            tax_amount = (sub_total * invoice_data.tax_percentage / 100) if invoice_data.tax_percentage else 0
            due_date = date.today() + timedelta(days=invoice_data.due_days)
            
            # Generate invoice ID
            invoice_id = str(uuid.uuid4())
            
            # Insert invoice
            cursor.execute(
                """INSERT INTO invoice (
                    invoice_id, consultation_rec_id, sub_total, tax_amount, due_date
                ) VALUES (%s, %s, %s, %s, %s)""",
                (
                    invoice_id,
                    invoice_data.consultation_rec_id,
                    sub_total,
                    tax_amount,
                    due_date
                )
            )
            connection.commit()
            
            logger.info(f"✅ Invoice created successfully: {invoice_id}")
            
            return InvoiceResponse(
                success=True,
                message=f"Invoice created successfully. Total: {sub_total + tax_amount:.2f}",
                invoice_id=invoice_id
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating invoice: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


# ============================================
# GET ALL INVOICES
# ============================================

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_invoices(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    overdue_only: bool = Query(False, description="Show only overdue invoices")
):
    """Get all invoices with pagination"""
    try:
        with get_db() as (cursor, connection):
            # Build WHERE clause
            where_clause = "1=1"
            if overdue_only:
                where_clause = "i.due_date < CURDATE()"
            
            # Get total count
            count_query = f"""
                SELECT COUNT(*) as total
                FROM invoice i
                WHERE {where_clause}
            """
            cursor.execute(count_query)
            total = cursor.fetchone()['total']
            
            # Get invoices
            query = f"""
                SELECT 
                    i.*,
                    (i.sub_total + i.tax_amount) as total_amount,
                    a.patient_id,
                    u.full_name as patient_name,
                    u.email as patient_email,
                    ts.doctor_id,
                    u_doc.full_name as doctor_name
                FROM invoice i
                JOIN consultation_record cr ON i.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u ON p.patient_id = u.user_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u_doc ON d.doctor_id = u_doc.user_id
                WHERE {where_clause}
                ORDER BY i.created_at DESC
                LIMIT %s OFFSET %s
            """
            
            cursor.execute(query, (limit, skip))
            invoices = cursor.fetchall()
            
            return {
                "total": total,
                "returned": len(invoices),
                "invoices": invoices or []
            }
    except Exception as e:
        logger.error(f"Error fetching invoices: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET INVOICE BY ID
# ============================================

@router.get("/{invoice_id}", status_code=status.HTTP_200_OK)
def get_invoice_by_id(invoice_id: str):
    """Get detailed invoice information"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(invoice_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid invoice ID format: {invoice_id}"
            )
        
        with get_db() as (cursor, connection):
            # Get invoice with patient and doctor details
            query = """
                SELECT 
                    i.*,
                    (i.sub_total + i.tax_amount) as total_amount,
                    cr.symptoms,
                    cr.diagnoses,
                    a.patient_id,
                    u.full_name as patient_name,
                    u.email as patient_email,
                    u.NIC as patient_nic,
                    c.contact_num1 as patient_contact,
                    addr.address_line1,
                    addr.city,
                    addr.province,
                    ts.doctor_id,
                    u_doc.full_name as doctor_name,
                    d.medical_licence_no,
                    d.consultation_fee,
                    b.branch_name
                FROM invoice i
                JOIN consultation_record cr ON i.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u ON p.patient_id = u.user_id
                JOIN contact c ON u.contact_id = c.contact_id
                JOIN address addr ON u.address_id = addr.address_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u_doc ON d.doctor_id = u_doc.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE i.invoice_id = %s
            """
            
            cursor.execute(query, (invoice_id,))
            invoice = cursor.fetchone()
            
            if not invoice:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Invoice with ID {invoice_id} not found"
                )
            
            # Get treatments
            cursor.execute(
                """SELECT 
                    t.treatment_id,
                    tc.treatment_name,
                    tc.base_price,
                    t.notes
                FROM treatment t
                JOIN treatment_catalogue tc ON t.treatment_service_code = tc.treatment_service_code
                WHERE t.consultation_rec_id = %s""",
                (invoice['consultation_rec_id'],)
            )
            treatments = cursor.fetchall()
            
            # Get payments for this invoice
            cursor.execute(
                """SELECT SUM(amount_paid) as total_paid
                FROM payment
                WHERE patient_id = %s AND status = 'Completed'""",
                (invoice['patient_id'],)
            )
            payment_result = cursor.fetchone()
            total_paid = float(payment_result['total_paid']) if payment_result and payment_result['total_paid'] else 0
            
            return {
                "invoice": invoice,
                "treatments": treatments or [],
                "payment_summary": {
                    "total_paid": total_paid,
                    "balance": float(invoice['total_amount']) - total_paid,
                    "is_overdue": invoice['due_date'] < date.today() if invoice['due_date'] else False
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching invoice {invoice_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET INVOICE BY CONSULTATION
# ============================================

@router.get("/consultation/{consultation_rec_id}", status_code=status.HTTP_200_OK)
def get_invoice_by_consultation(consultation_rec_id: str):
    """Get invoice for a specific consultation"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(consultation_rec_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid consultation record ID format: {consultation_rec_id}"
            )
        
        with get_db() as (cursor, connection):
            cursor.execute(
                """SELECT 
                    i.*,
                    (i.sub_total + i.tax_amount) as total_amount
                FROM invoice i
                WHERE i.consultation_rec_id = %s""",
                (consultation_rec_id,)
            )
            invoice = cursor.fetchone()
            
            if not invoice:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Invoice not found for consultation {consultation_rec_id}"
                )
            
            return {"invoice": invoice}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching invoice for consultation {consultation_rec_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# UPDATE INVOICE
# ============================================

@router.patch("/{invoice_id}", status_code=status.HTTP_200_OK)
def update_invoice(invoice_id: str, update_data: InvoiceUpdate):
    """Update invoice details"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(invoice_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid invoice ID format: {invoice_id}"
            )
        
        with get_db() as (cursor, connection):
            # Check if invoice exists
            cursor.execute(
                "SELECT * FROM invoice WHERE invoice_id = %s",
                (invoice_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Invoice with ID {invoice_id} not found"
                )
            
            # Build update query
            updates = []
            params = []
            
            if update_data.tax_amount is not None:
                updates.append("tax_amount = %s")
                params.append(update_data.tax_amount)
            
            if update_data.due_date is not None:
                updates.append("due_date = %s")
                params.append(update_data.due_date)
            
            if not updates:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            params.append(invoice_id)
            
            update_query = f"""
                UPDATE invoice 
                SET {', '.join(updates)}
                WHERE invoice_id = %s
            """
            
            cursor.execute(update_query, params)
            connection.commit()
            
            # Fetch updated invoice
            cursor.execute(
                "SELECT *, (sub_total + tax_amount) as total_amount FROM invoice WHERE invoice_id = %s",
                (invoice_id,)
            )
            updated_invoice = cursor.fetchone()
            
            logger.info(f"Invoice {invoice_id} updated successfully")
            
            return {
                "success": True,
                "message": "Invoice updated successfully",
                "invoice": updated_invoice
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating invoice {invoice_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# DELETE INVOICE
# ============================================

@router.delete("/{invoice_id}", status_code=status.HTTP_200_OK)
def delete_invoice(invoice_id: str):
    """Delete an invoice (use with caution)"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(invoice_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid invoice ID format: {invoice_id}"
            )
        
        with get_db() as (cursor, connection):
            # Check if invoice exists
            cursor.execute(
                "SELECT * FROM invoice WHERE invoice_id = %s",
                (invoice_id,)
            )
            invoice = cursor.fetchone()
            
            if not invoice:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Invoice with ID {invoice_id} not found"
                )
            
            # Check for associated claims
            cursor.execute(
                "SELECT COUNT(*) as count FROM claim WHERE invoice_id = %s",
                (invoice_id,)
            )
            if cursor.fetchone()['count'] > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete invoice with associated insurance claims"
                )
            
            # Delete invoice
            cursor.execute(
                "DELETE FROM invoice WHERE invoice_id = %s",
                (invoice_id,)
            )
            connection.commit()
            
            logger.info(f"✅ Invoice {invoice_id} deleted successfully")
            
            return {
                "success": True,
                "message": "Invoice deleted successfully",
                "invoice_id": invoice_id
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting invoice {invoice_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# INVOICE STATISTICS
# ============================================

@router.get("/statistics/summary", status_code=status.HTTP_200_OK)
def get_invoice_statistics():
    """Get invoice summary statistics"""
    try:
        with get_db() as (cursor, connection):
            # Total revenue
            cursor.execute(
                "SELECT SUM(sub_total + tax_amount) as total_revenue FROM invoice"
            )
            total_revenue = cursor.fetchone()['total_revenue'] or 0
            
            # Overdue invoices
            cursor.execute(
                """SELECT COUNT(*) as count, SUM(sub_total + tax_amount) as amount
                FROM invoice
                WHERE due_date < CURDATE()"""
            )
            overdue = cursor.fetchone()
            
            # Current month statistics
            cursor.execute(
                """SELECT 
                    COUNT(*) as count,
                    SUM(sub_total + tax_amount) as amount
                FROM invoice
                WHERE MONTH(created_at) = MONTH(CURDATE()) 
                AND YEAR(created_at) = YEAR(CURDATE())"""
            )
            current_month = cursor.fetchone()
            
            return {
                "total_revenue": float(total_revenue),
                "total_invoices": cursor.execute("SELECT COUNT(*) as c FROM invoice") or cursor.fetchone()['c'],
                "overdue_invoices": {
                    "count": overdue['count'],
                    "amount": float(overdue['amount']) if overdue['amount'] else 0
                },
                "current_month": {
                    "count": current_month['count'],
                    "amount": float(current_month['amount']) if current_month['amount'] else 0
                }
            }
            
    except Exception as e:
        logger.error(f"Error fetching invoice statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# DOCTOR FINANCIAL STATISTICS
# ============================================

@router.get("/doctor/{doctor_id}/financial-stats", status_code=status.HTTP_200_OK)
def get_doctor_financial_statistics(doctor_id: str):
    """
    Get comprehensive financial statistics for a doctor
    
    Returns:
    - Total revenue generated by doctor
    - Number of consultations
    - Average consultation fee
    - Monthly revenue trends
    - Treatments prescribed (count and value)
    - Payment status breakdown
    """
    try:
        # Validate UUID format
        try:
            uuid.UUID(doctor_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid doctor ID format: {doctor_id}"
            )
        
        with get_db() as (cursor, connection):
            # Verify doctor exists
            cursor.execute(
                "SELECT * FROM doctor WHERE doctor_id = %s",
                (doctor_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            # Total revenue from consultations (consultation fees)
            cursor.execute(
                """SELECT 
                    COUNT(DISTINCT cr.consultation_rec_id) as total_consultations,
                    SUM(d.consultation_fee) as total_consultation_revenue,
                    AVG(d.consultation_fee) as avg_consultation_fee
                FROM consultation_record cr
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                WHERE d.doctor_id = %s""",
                (doctor_id,)
            )
            consultation_stats = cursor.fetchone()
            
            # Treatment revenue
            cursor.execute(
                """SELECT 
                    COUNT(DISTINCT t.treatment_id) as total_treatments,
                    SUM(tc.base_price) as treatment_revenue
                FROM treatment t
                JOIN treatment_catalogue tc ON t.treatment_service_code = tc.treatment_service_code
                JOIN consultation_record cr ON t.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                WHERE d.doctor_id = %s""",
                (doctor_id,)
            )
            treatment_stats = cursor.fetchone()
            
            # Total revenue from invoices
            cursor.execute(
                """SELECT 
                    SUM(i.sub_total + i.tax_amount) as total_invoice_amount,
                    COUNT(DISTINCT i.invoice_id) as total_invoices
                FROM invoice i
                JOIN consultation_record cr ON i.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                WHERE d.doctor_id = %s""",
                (doctor_id,)
            )
            invoice_stats = cursor.fetchone()
            

            
            # Calculate totals
            total_consultation_revenue = float(consultation_stats['total_consultation_revenue'] or 0)
            treatment_revenue = float(treatment_stats['treatment_revenue'] or 0)
            total_revenue = total_consultation_revenue + treatment_revenue
            
            logger.info(f"Financial statistics retrieved for doctor {doctor_id}")
            
            return {
                "doctor_id": doctor_id,
                "financial_summary": {
                    "total_revenue": total_revenue,
                    "consultation_revenue": total_consultation_revenue,
                    "treatment_revenue": treatment_revenue,
                    "currency": "LKR"
                },
                "consultation_metrics": {
                    "total_consultations": consultation_stats['total_consultations'] or 0,
                    "average_fee": float(consultation_stats['avg_consultation_fee'] or 0)
                },
                "treatment_metrics": {
                    "total_treatments": treatment_stats['total_treatments'] or 0,
                    "treatment_revenue": treatment_revenue
                },
                "invoice_metrics": {
                    "total_invoices": invoice_stats['total_invoices'] or 0,
                    "total_invoice_amount": float(invoice_stats['total_invoice_amount'] or 0)
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching doctor financial statistics for {doctor_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

