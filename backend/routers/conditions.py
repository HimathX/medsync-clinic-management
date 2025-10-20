from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import date
from core.database import get_db
from core.auth import get_current_user
import logging
import uuid

router = APIRouter(tags=["patient-conditions"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class AddAllergyRequest(BaseModel):
    patient_id: str = Field(..., description="Patient ID (UUID)")
    allergy_name: str = Field(..., max_length=50, description="Name of the allergy")
    severity: str = Field(..., pattern="^(Mild|Moderate|Severe|Life-threatening)$")
    reaction_description: Optional[str] = Field(None, max_length=200, description="Description of reaction")
    diagnosed_date: Optional[date] = Field(None, description="Date diagnosed (YYYY-MM-DD)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "patient_id": "patient-uuid-here",
                "allergy_name": "Peanuts",
                "severity": "Life-threatening",
                "reaction_description": "Anaphylaxis: swelling, difficulty breathing",
                "diagnosed_date": "2025-05-15"
            }
        }

class AddAllergyResponse(BaseModel):
    success: bool
    message: str
    patient_allergy_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Patient allergy added successfully",
                "patient_allergy_id": "allergy-uuid-here"
            }
        }

class AddConditionRequest(BaseModel):
    patient_id: str = Field(..., description="Patient ID (UUID)")
    condition_category_id: str = Field(..., description="Condition category ID (UUID)")
    condition_name: str = Field(..., max_length=50, description="Name of the condition")
    diagnosed_date: Optional[date] = Field(None, description="Date diagnosed (YYYY-MM-DD)")
    is_chronic: bool = Field(False, description="Is this a chronic condition?")
    current_status: str = Field("Active", pattern="^(Active|In Treatment|Managed|Resolved)$")
    notes: Optional[str] = Field(None, description="Additional notes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "patient_id": "patient-uuid-here",
                "condition_category_id": "cardiovascular-category-uuid",
                "condition_name": "Hypertension",
                "diagnosed_date": "2025-06-10",
                "is_chronic": True,
                "current_status": "Managed",
                "notes": "Blood pressure controlled with medication"
            }
        }

class AddConditionResponse(BaseModel):
    success: bool
    message: str
    condition_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Patient condition added successfully",
                "condition_id": "condition-uuid-here"
            }
        }

# ============================================
# ALLERGY ENDPOINTS
# ============================================

def require_roles(allowed_roles: list[str]):
    def decorator(fn):
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user or current_user.get('user_type') not in allowed_roles:
                raise HTTPException(status_code=403, detail="Operation not permitted")
            return await fn(*args, **kwargs)
        return wrapper
    return decorator

@router.post("/allergies", status_code=status.HTTP_201_CREATED)
def add_patient_allergy(
    allergy_data: AddAllergyRequest,
    current_user: dict = Depends(require_roles(['admin', 'doctor', 'nurse']))
):
    """Add allergy (Doctor/Nurse/Admin)"""
    # ...existing code...
    try:
        with get_db() as (cursor, connection):
            # Set session variables for OUT parameters
            cursor.execute("SET @p_patient_allergy_id = NULL")
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure
            call_sql = """
                CALL AddPatientAllergy(
                    %s, %s, %s, %s, %s,
                    @p_patient_allergy_id, @p_error_message, @p_success
                )
            """
            
            cursor.execute(call_sql, (
                allergy_data.patient_id,
                allergy_data.allergy_name,
                allergy_data.severity,
                allergy_data.reaction_description,
                allergy_data.diagnosed_date
            ))
            
            # Get OUT parameters
            cursor.execute("""
                SELECT 
                    @p_patient_allergy_id as patient_allergy_id,
                    @p_error_message as error_message,
                    @p_success as success
            """)
            result = cursor.fetchone()
            
            allergy_id = result['patient_allergy_id']
            error_message = result['error_message']
            success = result['success']
            
            if success == 1 or success is True:
                logger.info(f"Allergy added successfully: {allergy_id}")
                return AddAllergyResponse(
                    success=True,
                    message=error_message or "Patient allergy added successfully",
                    patient_allergy_id=allergy_id
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_message or "Failed to add allergy"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding allergy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while adding allergy: {str(e)}"
        )

@router.get("/allergies/{patient_id}", status_code=status.HTTP_200_OK)
def get_patient_allergies(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get allergies (with access check)"""
    user_type = current_user.get('user_type')
    user_id = current_user.get('user_id')
    
    if user_type == 'patient' and user_id != patient_id:
        raise HTTPException(403, "Can only view own allergies")
    
    # ...existing code...
    try:
        with get_db() as (cursor, connection):
            # Check if patient exists
            cursor.execute("SELECT patient_id FROM patient WHERE patient_id = %s", (patient_id,))
            patient = cursor.fetchone()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            # Get allergies
            cursor.execute(
                """SELECT * FROM patient_allergy 
                   WHERE patient_id = %s 
                   ORDER BY diagnosed_date DESC""",
                (patient_id,)
            )
            allergies = cursor.fetchall()
            
            return {
                "patient_id": patient_id,
                "total": len(allergies),
                "allergies": allergies or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching allergies for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.delete("/allergies/{allergy_id}", status_code=status.HTTP_200_OK)
def delete_patient_allergy(allergy_id: str):
    """Delete a patient allergy"""
    try:
        with get_db() as (cursor, connection):
            # Check if allergy exists
            cursor.execute(
                "SELECT * FROM patient_allergy WHERE patient_allergy_id = %s",
                (allergy_id,)
            )
            allergy = cursor.fetchone()
            
            if not allergy:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Allergy with ID {allergy_id} not found"
                )
            
            # Delete allergy
            cursor.execute(
                "DELETE FROM patient_allergy WHERE patient_allergy_id = %s",
                (allergy_id,)
            )
            
            connection.commit()
            logger.info(f"Allergy {allergy_id} deleted successfully")
            
            return {
                "success": True,
                "message": "Allergy deleted successfully"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting allergy {allergy_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting allergy: {str(e)}"
        )

# ============================================
# CONDITION ENDPOINTS
# ============================================

@router.post("/conditions", status_code=status.HTTP_201_CREATED)
def add_patient_condition(
    condition_data: AddConditionRequest,
    current_user: dict = Depends(require_roles(['admin', 'doctor']))
):
    """Add condition (Doctor/Admin)"""
    try:
        with get_db() as (cursor, connection):
            # Set session variables for OUT parameters
            cursor.execute("SET @p_condition_id = NULL")
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure
            call_sql = """
                CALL AddPatientCondition(
                    %s, %s, %s, %s, %s, %s, %s,
                    @p_condition_id, @p_error_message, @p_success
                )
            """
            
            cursor.execute(call_sql, (
                condition_data.patient_id,
                condition_data.condition_category_id,
                condition_data.condition_name,
                condition_data.diagnosed_date,
                condition_data.is_chronic,
                condition_data.current_status,
                condition_data.notes
            ))
            
            # Get OUT parameters
            cursor.execute("""
                SELECT 
                    @p_condition_id as condition_id,
                    @p_error_message as error_message,
                    @p_success as success
            """)
            result = cursor.fetchone()
            
            condition_id = result['condition_id']
            error_message = result['error_message']
            success = result['success']
            
            if success == 1 or success is True:
                logger.info(f"Condition added successfully: {condition_id}")
                return AddConditionResponse(
                    success=True,
                    message=error_message or "Patient condition added successfully",
                    condition_id=condition_id
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_message or "Failed to add condition"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding condition: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while adding condition: {str(e)}"
        )

@router.get("/conditions/{patient_id}", status_code=status.HTTP_200_OK)
def get_patient_conditions(patient_id: str, active_only: bool = False):
    """Get all conditions for a specific patient"""
    try:
        with get_db() as (cursor, connection):
            # Check if patient exists
            cursor.execute("SELECT patient_id FROM patient WHERE patient_id = %s", (patient_id,))
            patient = cursor.fetchone()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            # Build query
            query = """
                SELECT 
                    pc.*,
                    c.condition_name,
                    c.description as condition_description,
                    c.severity,
                    cc.category_name,
                    cc.description as category_description
                FROM patient_condition pc
                JOIN conditions c ON pc.condition_id = c.condition_id
                JOIN conditions_category cc ON c.condition_category_id = cc.condition_category_id
                WHERE pc.patient_id = %s
            """
            
            if active_only:
                query += " AND pc.current_status IN ('Active', 'In Treatment')"
            
            query += " ORDER BY pc.diagnosed_date DESC"
            
            cursor.execute(query, (patient_id,))
            conditions = cursor.fetchall()
            
            return {
                "patient_id": patient_id,
                "total": len(conditions),
                "conditions": conditions or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conditions for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.patch("/conditions/{patient_id}/{condition_id}", status_code=status.HTTP_200_OK)
def update_patient_condition(
    patient_id: str,
    condition_id: str,
    current_status: Optional[str] = None,
    notes: Optional[str] = None
):
    """Update patient condition status and notes"""
    try:
        with get_db() as (cursor, connection):
            # Check if patient condition exists
            cursor.execute(
                """SELECT * FROM patient_condition 
                   WHERE patient_id = %s AND condition_id = %s""",
                (patient_id, condition_id)
            )
            patient_condition = cursor.fetchone()
            
            if not patient_condition:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient condition not found"
                )
            
            # Build update query
            updates = []
            params = []
            
            if current_status:
                updates.append("current_status = %s")
                params.append(current_status)
            
            if notes is not None:
                updates.append("notes = %s")
                params.append(notes)
            
            if not updates:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            params.extend([patient_id, condition_id])
            
            update_query = f"""
                UPDATE patient_condition 
                SET {', '.join(updates)}
                WHERE patient_id = %s AND condition_id = %s
            """
            
            cursor.execute(update_query, params)
            connection.commit()
            
            # Fetch updated record
            cursor.execute(
                """SELECT * FROM patient_condition 
                   WHERE patient_id = %s AND condition_id = %s""",
                (patient_id, condition_id)
            )
            updated_condition = cursor.fetchone()
            
            logger.info(f"Condition updated: patient={patient_id}, condition={condition_id}")
            
            return {
                "success": True,
                "message": "Patient condition updated successfully",
                "patient_condition": updated_condition
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating condition: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating condition: {str(e)}"
        )

# ============================================
# CATEGORY ENDPOINTS
# ============================================

@router.get("/categories", status_code=status.HTTP_200_OK)
def get_all_condition_categories():
    """Get all condition categories"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute("SELECT * FROM conditions_category ORDER BY category_name")
            categories = cursor.fetchall()
            
            return {
                "total": len(categories),
                "categories": categories or []
            }
    except Exception as e:
        logger.error(f"Error fetching condition categories: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.get("/categories/{category_id}/conditions", status_code=status.HTTP_200_OK)
def get_conditions_by_category(category_id: str):
    """Get all conditions in a specific category"""
    try:
        with get_db() as (cursor, connection):
            # Check if category exists
            cursor.execute(
                "SELECT * FROM conditions_category WHERE condition_category_id = %s",
                (category_id,)
            )
            category = cursor.fetchone()
            
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Category with ID {category_id} not found"
                )
            
            # Get conditions in this category
            cursor.execute(
                """SELECT * FROM conditions 
                   WHERE condition_category_id = %s 
                   ORDER BY condition_name""",
                (category_id,)
            )
            conditions = cursor.fetchall()
            
            return {
                "category": category,
                "total": len(conditions),
                "conditions": conditions or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conditions for category {category_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )