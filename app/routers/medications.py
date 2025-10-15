from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from .. import crud, schemas, auth
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/medications", tags=["medications"])

@router.get("/test")
def test_endpoint():
    """Test endpoint to verify router is working"""
    return {"message": "Medications router is working"}

@router.get("/", response_model=List[Dict[str, Any]])
def get_medications(
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=100),
    form: Optional[str] = None,
    manufacturer: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(auth.require_role(["admin", "manager", "doctor", "receptionist"]))
):
    """Get medications with optional filtering"""
    try:
        print(f"💊 ROUTER: Getting medications with filters - form:{form}, manufacturer:{manufacturer}, search:{search}")
        print(f"💊 ROUTER: Current user: {current_user.get('email', 'Unknown')}")
        
        medications = crud.get_medications_list(search=search, form=form)
        
        # Apply pagination
        start = skip
        end = skip + limit
        paginated_medications = medications[start:end] if medications else []
        
        print(f"💊 ROUTER: Retrieved {len(paginated_medications)} medications")
        return paginated_medications
        
    except Exception as e:
        print(f"❌ ROUTER: Error getting medications: {e}")
        logger.error(f"Error getting medications: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve medications")

@router.get("/{medication_id}", response_model=Dict[str, Any])
def get_medication(
    medication_id: str, 
    current_user: Dict[str, Any] = Depends(auth.require_role(["admin", "manager", "doctor", "receptionist"]))
):
    """Get medication by ID"""
    try:
        medication = crud.get_medication(medication_id)
        if not medication:
            raise HTTPException(status_code=404, detail="Medication not found")
        return medication
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting medication {medication_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve medication")

@router.post("/", response_model=Dict[str, Any])
def create_medication(
    medication: schemas.MedicationCreate, 
    current_user: Dict[str, Any] = Depends(auth.require_role(["admin", "doctor"]))
):
    """Create a new medication (Doctor/Admin only)"""
    try:
        medication_data = medication.dict()
        result = crud.create_medication(medication_data)
        
        if not result.get('success', True):
            raise HTTPException(status_code=400, detail=result.get('error_message', 'Failed to create medication'))
        
        return {
            "message": "Medication created successfully",
            "medication_id": result.get('medication_id'),
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating medication: {e}")
        raise HTTPException(status_code=500, detail="Failed to create medication")

@router.put("/{medication_id}", response_model=Dict[str, Any])
def update_medication(
    medication_id: str,
    medication: schemas.MedicationUpdate,
    current_user: Dict[str, Any] = Depends(auth.require_role(["admin"]))
):
    """Update medication (Admin only)"""
    try:
        existing_medication = crud.get_medication(medication_id)
        if not existing_medication:
            raise HTTPException(status_code=404, detail="Medication not found")
        
        update_data = medication.dict(exclude_unset=True)
        result = crud.update_medication(medication_id, update_data)
        
        if not result.get('success', True):
            raise HTTPException(status_code=400, detail=result.get('error_message', 'Failed to update medication'))
        
        return {
            "message": "Medication updated successfully",
            "medication_id": medication_id,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating medication {medication_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update medication")