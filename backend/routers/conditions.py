from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import date
from core.database import get_db
from models.patient import Patient, PatientAllergy, PatientCondition
from models import Condition, ConditionsCategory

router = APIRouter(tags=["patient-conditions"])

# ============================
# PYDANTIC SCHEMAS FOR ALLERGIES
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

# ============================================
# PYDANTIC SCHEMAS FOR CONDITIONS
# ============================================

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

@router.post("/allergies", status_code=status.HTTP_201_CREATED, response_model=AddAllergyResponse)
def add_patient_allergy(
    allergy_data: AddAllergyRequest,
    db: Session = Depends(get_db)
):
    """
    Add a new allergy to a patient
    
    - Validates patient exists
    - Records allergy name, severity, and reaction
    - Stores diagnosis date
    """
    try:
        # Call the stored procedure
        result = db.execute(
            text("""
                CALL AddPatientAllergy(
                    :p_patient_id,
                    :p_allergy_name,
                    :p_severity,
                    :p_reaction_description,
                    :p_diagnosed_date,
                    @p_patient_allergy_id,
                    @p_error_message,
                    @p_success
                )
            """),
            {
                "p_patient_id": allergy_data.patient_id,
                "p_allergy_name": allergy_data.allergy_name,
                "p_severity": allergy_data.severity,
                "p_reaction_description": allergy_data.reaction_description,
                "p_diagnosed_date": allergy_data.diagnosed_date
            }
        )
        
        # Get output parameters
        output = db.execute(text("SELECT @p_patient_allergy_id, @p_error_message, @p_success")).fetchone()
        
        allergy_id = output[0]  # type: ignore
        error_message = output[1]  # type: ignore
        success = bool(output[2])  # type: ignore
        
        # Commit the transaction
        db.commit()
        
        if success:
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
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while adding allergy: {str(e)}"
        )

@router.get("/allergies/{patient_id}", status_code=status.HTTP_200_OK)
def get_patient_allergies(
    patient_id: str,
    db: Session = Depends(get_db)
):
    """Get all allergies for a specific patient"""
    # Check if patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    allergies = db.query(PatientAllergy).filter(
        PatientAllergy.patient_id == patient_id
    ).all()
    
    return {
        "patient_id": patient_id,
        "total": len(allergies),
        "allergies": allergies
    }

@router.delete("/allergies/{allergy_id}", status_code=status.HTTP_200_OK)
def delete_patient_allergy(
    allergy_id: str,
    db: Session = Depends(get_db)
):
    """Delete a patient allergy"""
    try:
        allergy = db.query(PatientAllergy).filter(
            PatientAllergy.patient_allergy_id == allergy_id
        ).first()
        
        if not allergy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Allergy with ID {allergy_id} not found"
            )
        
        db.delete(allergy)
        db.commit()
        
        return {
            "success": True,
            "message": "Allergy deleted successfully"
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting allergy: {str(e)}"
        )

# ============================================
# CONDITION ENDPOINTS
# ============================================

@router.post("/conditions", status_code=status.HTTP_201_CREATED, response_model=AddConditionResponse)
def add_patient_condition(
    condition_data: AddConditionRequest,
    db: Session = Depends(get_db)
):
    """
    Add a new condition to a patient
    
    - Validates patient and category exist
    - Creates new condition entry
    - Links to patient with status and notes
    """
    try:
        # Call the stored procedure
        result = db.execute(
            text("""
                CALL AddPatientCondition(
                    :p_patient_id,
                    :p_condition_category_id,
                    :p_condition_name,
                    :p_diagnosed_date,
                    :p_is_chronic,
                    :p_current_status,
                    :p_notes,
                    @p_condition_id,
                    @p_error_message,
                    @p_success
                )
            """),
            {
                "p_patient_id": condition_data.patient_id,
                "p_condition_category_id": condition_data.condition_category_id,
                "p_condition_name": condition_data.condition_name,
                "p_diagnosed_date": condition_data.diagnosed_date,
                "p_is_chronic": condition_data.is_chronic,
                "p_current_status": condition_data.current_status,
                "p_notes": condition_data.notes
            }
        )
        
        # Get output parameters
        output = db.execute(text("SELECT @p_condition_id, @p_error_message, @p_success")).fetchone()
        
        condition_id = output[0]  # type: ignore
        error_message = output[1]  # type: ignore
        success = bool(output[2])  # type: ignore
        
        # Commit the transaction
        db.commit()
        
        if success:
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
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while adding condition: {str(e)}"
        )

@router.get("/conditions/{patient_id}", status_code=status.HTTP_200_OK)
def get_patient_conditions(
    patient_id: str,
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all conditions for a specific patient"""
    # Check if patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    query = db.query(
        PatientCondition,
        Condition,
        ConditionsCategory
    ).join(
        Condition,
        PatientCondition.condition_id == Condition.condition_id
    ).join(
        ConditionsCategory,
        Condition.condition_category_id == ConditionsCategory.condition_category_id
    ).filter(
        PatientCondition.patient_id == patient_id
    )
    
    if active_only:
        query = query.filter(PatientCondition.current_status.in_(['Active', 'In Treatment']))
    
    results = query.all()
    
    conditions_list = [
        {
            "patient_condition": {
                "condition_id": pc.condition_id,
                "diagnosed_date": pc.diagnosed_date,
                "is_chronic": pc.is_chronic,
                "current_status": pc.current_status,
                "notes": pc.notes
            },
            "condition": {
                "condition_id": c.condition_id,
                "condition_name": c.condition_name,
                "description": c.description,
                "severity": c.severity
            },
            "category": {
                "category_id": cc.condition_category_id,
                "category_name": cc.category_name,
                "description": cc.description
            }
        }
        for pc, c, cc in results
    ]
    
    return {
        "patient_id": patient_id,
        "total": len(conditions_list),
        "conditions": conditions_list
    }

@router.patch("/conditions/{patient_id}/{condition_id}", status_code=status.HTTP_200_OK)
def update_patient_condition(
    patient_id: str,
    condition_id: str,
    current_status: Optional[str] = None,
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update patient condition status and notes"""
    try:
        patient_condition = db.query(PatientCondition).filter(
            PatientCondition.patient_id == patient_id,
            PatientCondition.condition_id == condition_id
        ).first()
        
        if not patient_condition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient condition not found"
            )
        
        if current_status:
            patient_condition.current_status = current_status
        if notes is not None:
            patient_condition.notes = notes
        
        db.commit()
        db.refresh(patient_condition)
        
        return {
            "success": True,
            "message": "Patient condition updated successfully",
            "patient_condition": patient_condition
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating condition: {str(e)}"
        )

# ============================================
# CATEGORY ENDPOINTS
# ============================================

@router.get("/categories", status_code=status.HTTP_200_OK)
def get_all_condition_categories(
    db: Session = Depends(get_db)
):
    """Get all condition categories"""
    categories = db.query(ConditionsCategory).all()
    
    return {
        "total": len(categories),
        "categories": categories
    }

@router.get("/categories/{category_id}/conditions", status_code=status.HTTP_200_OK)
def get_conditions_by_category(
    category_id: str,
    db: Session = Depends(get_db)
):
    """Get all conditions in a specific category"""
    # Check if category exists
    category = db.query(ConditionsCategory).filter(
        ConditionsCategory.condition_category_id == category_id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID {category_id} not found"
        )
    
    conditions = db.query(Condition).filter(
        Condition.condition_category_id == category_id
    ).all()
    
    return {
        "category": category,
        "total": len(conditions),
        "conditions": conditions
    }