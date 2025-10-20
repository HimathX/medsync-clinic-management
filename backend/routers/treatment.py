from fastapi import APIRouter, HTTPException, status, Query, Depends, Request
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from core.database import get_db
from core.auth import get_current_user
from core.audit_logger import audit
import logging
import uuid

router = APIRouter(tags=["treatments"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class TreatmentCreate(BaseModel):
    consultation_rec_id: str = Field(..., description="Consultation record UUID")
    treatment_service_code: str = Field(..., description="Treatment service code UUID")
    notes: Optional[str] = Field(None, description="Treatment notes")
    
    @validator('consultation_rec_id', 'treatment_service_code')
    def validate_uuid(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError(f"Invalid UUID format: {v}")
    
    class Config:
        json_schema_extra = {
            "example": {
                "consultation_rec_id": "consultation-uuid-here",
                "treatment_service_code": "treatment-service-uuid-here",
                "notes": "Patient to fast for 8 hours prior to test"
            }
        }

class TreatmentUpdate(BaseModel):
    notes: Optional[str] = Field(None, description="Updated treatment notes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "notes": "Updated treatment instructions"
            }
        }

class TreatmentResponse(BaseModel):
    success: bool
    message: str
    treatment_id: Optional[str] = None

class BulkTreatmentCreate(BaseModel):
    consultation_rec_id: str = Field(..., description="Consultation record UUID")
    treatments: List[dict] = Field(..., min_items=1, max_items=20, description="List of treatments")
    
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
                "treatments": [
                    {
                        "treatment_service_code": "treatment-uuid-1",
                        "notes": "First treatment notes"
                    },
                    {
                        "treatment_service_code": "treatment-uuid-2",
                        "notes": "Second treatment notes"
                    }
                ]
            }
        }

class BulkTreatmentResult(BaseModel):
    treatment_service_code: str
    success: bool
    treatment_id: Optional[str] = None
    error_message: Optional[str] = None

class BulkTreatmentResponse(BaseModel):
    total_attempted: int
    successful: int
    failed: int
    results: List[BulkTreatmentResult]


# ============================================
# ADD TREATMENT (USING STORED PROCEDURE)
# ============================================

# Add role checker
def require_roles(allowed_roles: list[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get('role')
        user_type = current_user.get('user_type')
        
        if user_type == 'employee' and user_role == 'admin':
            return current_user
        
        if user_type == 'employee' and user_role in allowed_roles:
            return current_user
        
        # Log failed access
        audit.log_failed_access(
            user_id=current_user.get('user_id'),
            action_type='CREATE_TREATMENT',
            table_name='treatment',
            record_id=None,
            reason=f"Insufficient permissions. User role: {user_role}",
            session_id=current_user.get('session_id')
        )
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required roles: {', '.join(allowed_roles)}"
        )
    return role_checker

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=TreatmentResponse)
def add_treatment(
    treatment_data: TreatmentCreate,
    request: Request,
    current_user: dict = Depends(require_roles(['admin', 'doctor']))
):
    """
    Add a treatment to a consultation record using AddTreatment stored procedure
    
    - Validates consultation record exists
    - Validates treatment service code exists
    - Creates treatment record
    """
    try:
        logger.info(f"Adding treatment to consultation: {treatment_data.consultation_rec_id}")
        
        with get_db() as (cursor, connection):
            # Set session variables for OUT parameters
            cursor.execute("SET @p_treatment_id = NULL")
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure
            call_sql = """
                CALL AddTreatment(
                    %s, %s, %s,
                    @p_treatment_id, @p_error_message, @p_success
                )
            """
            
            cursor.execute(call_sql, (
                treatment_data.consultation_rec_id,
                treatment_data.treatment_service_code,
                treatment_data.notes
            ))
            
            # Get OUT parameters
            cursor.execute("""
                SELECT 
                    @p_treatment_id as treatment_id,
                    @p_error_message as error_message,
                    @p_success as success
            """)
            result = cursor.fetchone()
            
            if not result:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="No response from stored procedure"
                )
            
            treatment_id = result['treatment_id']
            error_message = result['error_message']
            success = result['success']
            
            if success == 1 or success is True:
                logger.info(f"✅ Treatment added successfully: {treatment_id}")
                
                # Log access
                audit.log_access(
                    user_id=current_user['user_id'],
                    action_type='INSERT',
                    table_name='treatment',
                    record_id=treatment_id,
                    new_values={'consultation_rec_id': treatment_data.consultation_rec_id},
                    ip_address=request.client.host,
                    session_id=current_user.get('session_id')
                )
                
                return TreatmentResponse(
                    success=True,
                    message=error_message or "Treatment added successfully",
                    treatment_id=treatment_id
                )
            else:
                logger.warning(f"❌ Failed to add treatment: {error_message}")
                
                # Map specific error messages to appropriate status codes
                if "not found" in error_message.lower():
                    status_code = status.HTTP_404_NOT_FOUND
                else:
                    status_code = status.HTTP_400_BAD_REQUEST
                
                raise HTTPException(
                    status_code=status_code,
                    detail=error_message or "Failed to add treatment"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error adding treatment: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


# ============================================
# ADD MULTIPLE TREATMENTS (BULK)
# ============================================

@router.post("/bulk", status_code=status.HTTP_201_CREATED, response_model=BulkTreatmentResponse)
def add_treatments_bulk(bulk_data: BulkTreatmentCreate):
    """
    Add multiple treatments to a consultation record
    
    - Processes each treatment individually using stored procedure
    - Returns success/failure for each item
    - Continues processing even if some fail
    """
    try:
        logger.info(f"Adding {len(bulk_data.treatments)} treatments in bulk")
        
        results = []
        successful = 0
        failed = 0
        
        with get_db() as (cursor, connection):
            for treatment_item in bulk_data.treatments:
                treatment_service_code = treatment_item.get('treatment_service_code')
                notes = treatment_item.get('notes')
                
                if not treatment_service_code:
                    results.append(BulkTreatmentResult(
                        treatment_service_code="N/A",
                        success=False,
                        error_message="Treatment service code is required"
                    ))
                    failed += 1
                    continue
                
                try:
                    # Set session variables
                    cursor.execute("SET @p_treatment_id = NULL")
                    cursor.execute("SET @p_error_message = NULL")
                    cursor.execute("SET @p_success = NULL")
                    
                    # Call stored procedure
                    cursor.execute("""
                        CALL AddTreatment(
                            %s, %s, %s,
                            @p_treatment_id, @p_error_message, @p_success
                        )
                    """, (
                        bulk_data.consultation_rec_id,
                        treatment_service_code,
                        notes
                    ))
                    
                    # Get OUT parameters
                    cursor.execute("""
                        SELECT 
                            @p_treatment_id as treatment_id,
                            @p_error_message as error_message,
                            @p_success as success
                    """)
                    result = cursor.fetchone()
                    
                    if result and (result['success'] == 1 or result['success'] is True):
                        results.append(BulkTreatmentResult(
                            treatment_service_code=treatment_service_code,
                            success=True,
                            treatment_id=result['treatment_id']
                        ))
                        successful += 1
                        logger.info(f"✅ Added treatment: {treatment_service_code}")
                    else:
                        results.append(BulkTreatmentResult(
                            treatment_service_code=treatment_service_code,
                            success=False,
                            error_message=result['error_message'] if result else "Unknown error"
                        ))
                        failed += 1
                        
                except Exception as e:
                    results.append(BulkTreatmentResult(
                        treatment_service_code=treatment_service_code,
                        success=False,
                        error_message=str(e)
                    ))
                    failed += 1
                    logger.error(f"❌ Failed: {treatment_service_code} - {str(e)}")
        
        logger.info(f"Bulk add complete - Success: {successful}, Failed: {failed}")
        
        return BulkTreatmentResponse(
            total_attempted=len(bulk_data.treatments),
            successful=successful,
            failed=failed,
            results=results
        )
                
    except Exception as e:
        logger.error(f"Unexpected error in bulk add: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


# ============================================
# GET ALL TREATMENTS
# ============================================

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_treatments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(get_current_user)  # ✅ All authenticated users
):
    """Get all treatments (Authenticated users)"""
    try:
        with get_db() as (cursor, connection):
            # Get total count
            cursor.execute("SELECT COUNT(*) as total FROM treatment")
            total = cursor.fetchone()['total']
            
            # Get treatments with related information
            query = """
                SELECT 
                    t.*,
                    tc.treatment_name,
                    tc.base_price,
                    tc.duration,
                    cr.appointment_id,
                    a.patient_id
                FROM treatment t
                JOIN treatment_catalogue tc ON t.treatment_service_code = tc.treatment_service_code
                JOIN consultation_record cr ON t.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                ORDER BY t.created_at DESC
                LIMIT %s OFFSET %s
            """
            
            cursor.execute(query, (limit, skip))
            treatments = cursor.fetchall()
            
            return {
                "total": total,
                "returned": len(treatments),
                "treatments": treatments or []
            }
    except Exception as e:
        logger.error(f"Error fetching treatments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET TREATMENT BY ID
# ============================================

@router.get("/{treatment_id}", status_code=status.HTTP_200_OK)
def get_treatment_by_id(treatment_id: str):
    """Get treatment details by ID with related information"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(treatment_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid treatment ID format: {treatment_id}"
            )
        
        with get_db() as (cursor, connection):
            query = """
                SELECT 
                    t.*,
                    tc.treatment_name,
                    tc.base_price,
                    tc.duration,
                    tc.description as treatment_description,
                    cr.consultation_rec_id,
                    cr.appointment_id,
                    cr.symptoms,
                    cr.diagnoses,
                    a.patient_id,
                    ts.doctor_id
                FROM treatment t
                JOIN treatment_catalogue tc ON t.treatment_service_code = tc.treatment_service_code
                JOIN consultation_record cr ON t.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE t.treatment_id = %s
            """
            
            cursor.execute(query, (treatment_id,))
            treatment = cursor.fetchone()
            
            if not treatment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Treatment with ID {treatment_id} not found"
                )
            
            return {"treatment": treatment}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching treatment {treatment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET TREATMENTS BY CONSULTATION RECORD
# ============================================

@router.get("/consultation/{consultation_rec_id}", status_code=status.HTTP_200_OK)
def get_treatments_by_consultation(consultation_rec_id: str):
    """Get all treatments for a specific consultation record"""
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
            # Check if consultation exists
            cursor.execute(
                "SELECT * FROM consultation_record WHERE consultation_rec_id = %s",
                (consultation_rec_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Consultation record with ID {consultation_rec_id} not found"
                )
            
            # Get treatments
            query = """
                SELECT 
                    t.*,
                    tc.treatment_name,
                    tc.base_price,
                    tc.duration,
                    tc.description as treatment_description
                FROM treatment t
                JOIN treatment_catalogue tc ON t.treatment_service_code = tc.treatment_service_code
                WHERE t.consultation_rec_id = %s
                ORDER BY t.created_at ASC
            """
            
            cursor.execute(query, (consultation_rec_id,))
            treatments = cursor.fetchall()
            
            return {
                "consultation_rec_id": consultation_rec_id,
                "total": len(treatments),
                "treatments": treatments or []
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching treatments for consultation {consultation_rec_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# UPDATE TREATMENT
# ============================================

@router.patch("/{treatment_id}", status_code=status.HTTP_200_OK)
def update_treatment(treatment_id: str, update_data: TreatmentUpdate):
    """Update treatment notes"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(treatment_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid treatment ID format: {treatment_id}"
            )
        
        with get_db() as (cursor, connection):
            # Check if treatment exists
            cursor.execute(
                "SELECT * FROM treatment WHERE treatment_id = %s",
                (treatment_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Treatment with ID {treatment_id} not found"
                )
            
            # Build update query
            if update_data.notes is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            cursor.execute(
                "UPDATE treatment SET notes = %s WHERE treatment_id = %s",
                (update_data.notes, treatment_id)
            )
            connection.commit()
            
            # Fetch updated treatment
            cursor.execute(
                "SELECT * FROM treatment WHERE treatment_id = %s",
                (treatment_id,)
            )
            updated_treatment = cursor.fetchone()
            
            logger.info(f"Treatment {treatment_id} updated successfully")
            
            return {
                "success": True,
                "message": "Treatment updated successfully",
                "treatment": updated_treatment
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating treatment {treatment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# DELETE TREATMENT
# ============================================

@router.delete("/{treatment_id}", status_code=status.HTTP_200_OK)
def delete_treatment(treatment_id: str):
    """Delete a treatment record"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(treatment_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid treatment ID format: {treatment_id}"
            )
        
        with get_db() as (cursor, connection):
            # Check if treatment exists
            cursor.execute(
                "SELECT * FROM treatment WHERE treatment_id = %s",
                (treatment_id,)
            )
            treatment = cursor.fetchone()
            
            if not treatment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Treatment with ID {treatment_id} not found"
                )
            
            # Delete treatment
            cursor.execute(
                "DELETE FROM treatment WHERE treatment_id = %s",
                (treatment_id,)
            )
            connection.commit()
            
            logger.info(f"✅ Treatment {treatment_id} deleted successfully")
            
            return {
                "success": True,
                "message": "Treatment deleted successfully",
                "treatment_id": treatment_id
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting treatment {treatment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# GET TREATMENT STATISTICS
# ============================================

@router.get("/statistics/by-service", status_code=status.HTTP_200_OK)
def get_treatment_statistics(
    limit: int = Query(10, ge=1, le=100, description="Number of top treatments to return")
):
    """Get most frequently used treatments"""
    try:
        with get_db() as (cursor, connection):
            query = """
                SELECT 
                    tc.treatment_service_code,
                    tc.treatment_name,
                    tc.base_price,
                    COUNT(t.treatment_id) as times_used,
                    SUM(tc.base_price) as total_revenue
                FROM treatment_catalogue tc
                LEFT JOIN treatment t ON tc.treatment_service_code = t.treatment_service_code
                GROUP BY tc.treatment_service_code, tc.treatment_name, tc.base_price
                ORDER BY times_used DESC
                LIMIT %s
            """
            
            cursor.execute(query, (limit,))
            stats = cursor.fetchall()
            
            return {
                "top_treatments": stats or []
            }
            
    except Exception as e:
        logger.error(f"Error fetching treatment statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
