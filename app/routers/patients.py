from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List, Optional
from datetime import date
from .. import crud, schemas, auth
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("/test")
def test_endpoint():
    """Test endpoint to verify router is working"""
    return {"message": "Patients router is working"}

@router.get("/", response_model=List[Dict[str, Any]])
def get_patients(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    current_user: Dict[str, Any] = Depends(auth.require_role(["admin", "manager"]))
):
    """Get all patients with pagination - Admin/Manager only"""
    try:
        print(f"📋 ROUTER: Getting patients with skip={skip}, limit={limit}")
        print(f"📋 ROUTER: Current user: {current_user.get('email', 'Unknown')}")
        
        from ..db_utils import get_all_patients
        result = get_all_patients(skip=skip, limit=limit)
        
        print(f"📋 ROUTER: Retrieved {len(result)} patients")
        return result if result else []
    except Exception as e:
        print(f"❌ ROUTER: Error getting patients: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve patients")

@router.post("/register", response_model=Dict[str, Any])
def register_patient(patient_data: schemas.PatientRegistration, current_user: Dict[str, Any] = Depends(auth.require_role(["admin", "manager"]))):
    """Register new patient - Admin/Manager only"""
    try:
        print(f"🏥 ROUTER: Patient registration started")
        print(f"🏥 ROUTER: Current user: {current_user.get('email', 'Unknown')}")
        print(f"🏥 ROUTER: Patient data received: {patient_data.dict()}")
        
        result = crud.create_patient_account(patient_data.dict())
        print(f"🏥 ROUTER: CRUD result: {result}")
        
        if not result['success']:
            print(f"❌ ROUTER: Registration failed: {result['error_message']}")
            raise HTTPException(status_code=400, detail=result['error_message'])
        
        print(f"✅ ROUTER: Patient registered successfully with ID: {result['user_id']}")
        return {
            "message": "Patient registered successfully",
            "patient_id": result['user_id'],
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ROUTER: Patient registration error: {e}")
        raise HTTPException(status_code=500, detail="Patient registration failed")

@router.get("/{patient_id}", response_model=Dict[str, Any])
def get_patient(patient_id: str, current_user: Dict[str, Any] = Depends(auth.get_current_user)):
    """Get patient by ID"""
    try:
        patient = crud.get_patient(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Check permissions
        if (current_user['user_type'] == "patient" and patient['user_id'] != current_user['user_id']):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # For employees, check branch access (except admins)
        if (current_user['user_type'] == "employee" and 
            current_user.get('role') not in ['admin'] and
            patient.get('registered_branch_id') != current_user.get('branch_id')):
            raise HTTPException(status_code=403, detail="Access denied - branch restriction")
        
        return patient
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting patient {patient_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve patient")

@router.get("/{patient_id}/appointments", response_model=List[Dict[str, Any]])
def get_patient_appointments(
    patient_id: str,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(auth.get_current_user)
):
    """Get patient's appointments"""
    try:
        # Check permissions
        if (current_user['user_type'] == "patient" and patient_id != current_user['user_id']):
            raise HTTPException(status_code=403, detail="Access denied")
        
        appointments = crud.get_appointments(
            skip=skip,
            limit=limit,
            patient_id=patient_id,
            status=status
        )
        
        return appointments
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting patient appointments: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve appointments")

@router.get("/{patient_id}/medical-history", response_model=Dict[str, Any])
def get_patient_medical_history(patient_id: str, current_user: Dict[str, Any] = Depends(auth.get_current_user)):
    """Get patient's medical history including conditions, allergies, and consultations"""
    try:
        # Check permissions
        if (current_user['user_type'] == "patient" and patient_id != current_user['user_id']):
            raise HTTPException(status_code=403, detail="Access denied")
        
        from ..database import execute_query
        
        # Get allergies
        allergies_query = """
        SELECT pa.*, pa.allergy_name, pa.severity, pa.reaction_description, pa.diagnosed_date
        FROM patient_allergy pa
        WHERE pa.patient_id = %s
        ORDER BY pa.diagnosed_date DESC
        """
        allergies = execute_query(allergies_query, (patient_id,), fetch='all')
        
        # Get conditions
        conditions_query = """
        SELECT pc.*, c.condition_name, cc.category_name, pc.current_status, pc.is_chronic
        FROM patient_condition pc
        JOIN conditions c ON pc.condition_id = c.condition_id
        JOIN conditions_category cc ON c.condition_category_id = cc.condition_category_id
        WHERE pc.patient_id = %s
        ORDER BY pc.diagnosed_date DESC
        """
        conditions = execute_query(conditions_query, (patient_id,), fetch='all')
        
        # Get recent consultations
        consultations_query = """
        SELECT cr.*, a.appointment_id, a.created_at as appointment_date,
               u.full_name as doctor_name
        FROM consultation_record cr
        JOIN appointment a ON cr.appointment_id = a.appointment_id
        JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
        JOIN doctor d ON ts.doctor_id = d.doctor_id
        JOIN employee e ON d.doctor_id = e.employee_id
        JOIN user u ON e.employee_id = u.user_id
        WHERE a.patient_id = %s
        ORDER BY cr.created_at DESC
        LIMIT 10
        """
        consultations = execute_query(consultations_query, (patient_id,), fetch='all')
        
        return {
            "patient_id": patient_id,
            "allergies": allergies or [],
            "conditions": conditions or [],
            "recent_consultations": consultations or []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting medical history for patient {patient_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve medical history")

@router.post("/{patient_id}/allergies", response_model=Dict[str, Any])
def add_patient_allergy(
    patient_id: str,
    allergy_data: schemas.PatientAllergyCreate,
    current_user: Dict[str, Any] = Depends(auth.require_role(["doctor", "nurse", "admin"]))
):
    """Add patient allergy - Doctor/Nurse/Admin only"""
    try:
        allergy_dict = allergy_data.dict()
        allergy_dict['patient_id'] = patient_id
        
        result = crud.create_patient_allergy(allergy_dict)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error_message'])
        
        return {
            "message": "Allergy added successfully",
            "allergy_id": result['allergy_id'],
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding patient allergy: {e}")
        raise HTTPException(status_code=500, detail="Failed to add allergy")

@router.post("/{patient_id}/conditions", response_model=Dict[str, Any])
def add_patient_condition(
    patient_id: str,
    condition_data: schemas.PatientConditionCreate,
    current_user: Dict[str, Any] = Depends(auth.require_role(["doctor", "admin"]))
):
    """Add patient condition - Doctor/Admin only"""
    try:
        condition_dict = condition_data.dict()
        condition_dict['patient_id'] = patient_id
        
        result = crud.create_patient_condition(condition_dict)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error_message'])
        
        return {
            "message": "Condition added successfully",
            "condition_id": result['condition_id'],
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding patient condition: {e}")
        raise HTTPException(status_code=500, detail="Failed to add condition")

@router.put("/{patient_id}", response_model=Dict[str, Any])
def update_patient(
    patient_id: str,
    patient_data: schemas.PatientUpdate,
    current_user: Dict[str, Any] = Depends(auth.require_role(["admin", "receptionist", "manager"]))
):
    """Update patient information - Admin/Receptionist/Manager only"""
    try:
        from ..database import execute_query
        
        # Build update query dynamically
        updates = []
        params = []
        
        if patient_data.blood_group:
            updates.append("blood_group = %s")
            params.append(patient_data.blood_group)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update patient table
        if updates:
            query = f"UPDATE patient SET {', '.join(updates)} WHERE patient_id = %s"
            params.append(patient_id)
            execute_query(query, tuple(params))
        
        # Update user table if needed
        user_updates = []
        user_params = []
        
        if patient_data.full_name:
            user_updates.append("full_name = %s")
            user_params.append(patient_data.full_name)
        
        if patient_data.email:
            user_updates.append("email = %s")
            user_params.append(patient_data.email.lower())
        
        if user_updates:
            user_query = f"UPDATE User SET {', '.join(user_updates)} WHERE user_id = %s"
            user_params.append(patient_id)
            execute_query(user_query, tuple(user_params))
        
        return {
            "message": "Patient updated successfully",
            "patient_id": patient_id,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating patient {patient_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update patient")