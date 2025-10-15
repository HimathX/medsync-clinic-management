from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import date
from .. import crud, schemas, auth
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/consultations", tags=["consultations"])

@router.get("/test")
def test_endpoint():
    """Test endpoint to verify router is working"""
    return {"message": "Consultations router is working"}

@router.get("/", response_model=List[Dict[str, Any]])
def get_consultations(
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=100),
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(auth.require_role(["admin", "manager", "doctor", "receptionist"]))
):
    """Get consultation records (Employee only)"""
    try:
        print(f"🩺 ROUTER: Getting consultations with filters - patient:{patient_id}, doctor:{doctor_id}")
        print(f"🩺 ROUTER: Current user: {current_user.get('email', 'Unknown')}")
        
        # For doctors, restrict to their own consultations unless admin/manager
        if (current_user.get('role') == 'doctor' and 
            current_user.get('role') not in ['admin', 'manager']):
            doctor_id = current_user.get('doctor_id')
        
        consultations = crud.get_consultations(
            skip=skip, 
            limit=limit,
            patient_id=patient_id,
            doctor_id=doctor_id,
            date_from=date_from,
            date_to=date_to
        )
        
        print(f"🩺 ROUTER: Retrieved {len(consultations)} consultations")
        return consultations
        
    except Exception as e:
        print(f"❌ ROUTER: Error getting consultations: {e}")
        logger.error(f"Error getting consultations: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve consultations")

@router.get("/{consultation_id}", response_model=Dict[str, Any])
def get_consultation(
    consultation_id: str, 
    current_user: Dict[str, Any] = Depends(auth.get_current_user)
):
    """Get consultation record by ID"""
    try:
        consultation = crud.get_consultation_record(consultation_id)
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation record not found")
        
        # Check permissions - patients can only see their own consultations
        if (current_user['user_type'] == "patient" and 
            consultation.get('patient_id') != current_user['user_id']):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # For doctors, only allow access to their own consultations unless admin/manager
        if (current_user['user_type'] == "employee" and
            current_user.get('role') == 'doctor' and
            current_user.get('role') not in ['admin', 'manager'] and
            consultation.get('doctor_id') != current_user.get('doctor_id')):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return consultation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting consultation {consultation_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve consultation")

@router.post("/", response_model=Dict[str, Any])
def create_consultation(
    consultation: schemas.ConsultationRecordCreate, 
    current_user: Dict[str, Any] = Depends(auth.get_current_doctor)
):
    """Create consultation record (Doctor only)"""
    try:
        consultation_data = consultation.dict()
        
        result = crud.create_consultation_record(consultation_data)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error_message'])
        
        return {
            "message": "Consultation record created successfully",
            "consultation_id": result['consultation_id'],
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating consultation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create consultation")

@router.put("/{consultation_id}", response_model=Dict[str, Any])
def update_consultation(
    consultation_id: str,
    consultation: schemas.ConsultationRecordUpdate,
    current_user: Dict[str, Any] = Depends(auth.get_current_doctor)
):
    """Update consultation record (Doctor only)"""
    try:
        # Check if consultation exists and belongs to this doctor
        existing_consultation = crud.get_consultation_record(consultation_id)
        if not existing_consultation:
            raise HTTPException(status_code=404, detail="Consultation record not found")
        
        # Verify doctor ownership unless admin/manager
        if (current_user.get('role') not in ['admin', 'manager'] and
            existing_consultation.get('doctor_id') != current_user.get('doctor_id')):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update consultation
        update_data = consultation.dict(exclude_unset=True)
        result = crud.update_consultation_record(consultation_id, update_data)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error_message'])
        
        return {
            "message": "Consultation record updated successfully",
            "consultation_id": consultation_id,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating consultation {consultation_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update consultation")

@router.get("/{consultation_id}/prescriptions", response_model=List[Dict[str, Any]])
def get_consultation_prescriptions(
    consultation_id: str,
    current_user: Dict[str, Any] = Depends(auth.get_current_user)
):
    """Get prescriptions for a consultation"""
    try:
        # Verify consultation exists and user has access
        consultation = crud.get_consultation_record(consultation_id)
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation record not found")
        
        # Check permissions
        if (current_user['user_type'] == "patient" and 
            consultation.get('patient_id') != current_user['user_id']):
            raise HTTPException(status_code=403, detail="Access denied")
        
        prescriptions = crud.get_consultation_prescriptions(consultation_id)
        return prescriptions
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting prescriptions for consultation {consultation_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve prescriptions")

@router.post("/{consultation_id}/prescriptions", response_model=Dict[str, Any])
def add_consultation_prescription(
    consultation_id: str,
    prescription: schemas.PrescriptionItemCreate,
    current_user: Dict[str, Any] = Depends(auth.get_current_doctor)
):
    """Add prescription to consultation (Doctor only)"""
    try:
        # Verify consultation exists and belongs to this doctor
        consultation = crud.get_consultation_record(consultation_id)
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation record not found")
        
        if (current_user.get('role') not in ['admin', 'manager'] and
            consultation.get('doctor_id') != current_user.get('doctor_id')):
            raise HTTPException(status_code=403, detail="Access denied")
        
        prescription_data = prescription.dict()
        prescription_data['consultation_rec_id'] = consultation_id
        
        result = crud.add_prescription_item_to_consultation(prescription_data)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error_message'])
        
        return {
            "message": "Prescription added successfully",
            "prescription_id": result['prescription_id'],
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding prescription to consultation {consultation_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to add prescription")