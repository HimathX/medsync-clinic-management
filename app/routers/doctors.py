from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List, Optional, Dict, Any
from datetime import date, time
from pydantic import ValidationError
from .. import crud, schemas, auth
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/doctors", tags=["doctors"])

@router.get("/", response_model=List[Dict[str, Any]])
def get_doctors(
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=100),
    branch_id: Optional[str] = None,
    specialization_id: Optional[str] = None,
    is_available: Optional[bool] = None
):
    """Get all doctors with optional filtering"""
    try:
        doctors = crud.get_doctors(
            skip=skip, 
            limit=limit, 
            branch_id=branch_id,
            specialization_id=specialization_id,
            is_available=is_available
        )
        
        return doctors
        
    except Exception as e:
        logger.error(f"Error getting doctors: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve doctors")

@router.get("/{doctor_id}", response_model=Dict[str, Any])
def get_doctor(doctor_id: str):
    """Get doctor by ID"""
    try:
        doctor = crud.get_doctor(doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        return doctor
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting doctor {doctor_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve doctor")

@router.post("/register", response_model=Dict[str, Any])
def register_doctor(
    doctor_data: schemas.DoctorRegistration,
    current_user: Dict[str, Any] = Depends(auth.require_role(["admin", "manager"]))
):
    """Register new doctor - Admin/Manager only"""
    try:
        print(f"👨‍⚕️ ROUTER: Doctor registration started")
        print(f"👨‍⚕️ ROUTER: Current user: {current_user.get('email')}")
        print(f"👨‍⚕️ ROUTER: Doctor data received: {doctor_data.dict()}")
        
        result = crud.create_doctor_account(doctor_data.dict())
        print(f"👨‍⚕️ ROUTER: CRUD result: {result}")
        
        if not result['success']:
            print(f"❌ ROUTER: Registration failed: {result['error_message']}")
            raise HTTPException(status_code=400, detail=result['error_message'])
        
        print(f"✅ ROUTER: Doctor registered successfully with ID: {result['user_id']}")
        return {
            "message": "Doctor registered successfully",
            "doctor_id": result['user_id'],
            "success": True
        }
        
    except HTTPException:
        raise
    except ValidationError as ve:
        print(f"❌ ROUTER: Schema validation failed: {ve}")
        print(f"❌ ROUTER: Validation errors: {ve.errors()}")
        raise HTTPException(status_code=422, detail=f"Validation error: {ve.errors()}")
    except Exception as e:
        print(f"❌ ROUTER: Error registering doctor: {e}")
        logger.error(f"Error registering doctor: {e}")
        raise HTTPException(status_code=500, detail="Doctor registration failed")

@router.put("/{doctor_id}", response_model=Dict[str, Any])
def update_doctor(
    doctor_id: str,
    doctor_update: schemas.DoctorUpdate,
    current_user: Dict[str, Any] = Depends(auth.require_role(["admin", "manager"]))
):
    """Update doctor information - Admin/Manager only"""
    try:
        from ..database import execute_query
        
        # Check if doctor exists
        doctor = crud.get_doctor(doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        # Build update query
        updates = []
        params = []
        
        if doctor_update.room_no is not None:
            updates.append("room_no = %s")
            params.append(doctor_update.room_no)
        
        if doctor_update.consultation_fee is not None:
            updates.append("consultation_fee = %s")
            params.append(doctor_update.consultation_fee)
        
        if doctor_update.is_available is not None:
            updates.append("is_available = %s")
            params.append(doctor_update.is_available)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update doctor table
        query = f"UPDATE doctor SET {', '.join(updates)}, updated_at = NOW() WHERE doctor_id = %s"
        params.append(doctor_id)
        execute_query(query, tuple(params))
        
        return {
            "message": "Doctor updated successfully",
            "doctor_id": doctor_id,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating doctor {doctor_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update doctor")

@router.get("/{doctor_id}/timeslots", response_model=List[Dict[str, Any]])
def get_doctor_timeslots(
    doctor_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    available_only: bool = True
):
    """Get doctor's time slots"""
    try:
        # Check if doctor exists
        doctor = crud.get_doctor(doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        timeslots = crud.get_doctor_timeslots(
            doctor_id=doctor_id, 
            start_date=start_date,
            end_date=end_date,
            available_only=available_only
        )
        
        return timeslots
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting doctor timeslots: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve time slots")

@router.post("/{doctor_id}/timeslots", response_model=Dict[str, Any])
def create_doctor_timeslot(
    doctor_id: str,
    timeslot_data: schemas.TimeSlotCreate,
    current_user: Dict[str, Any] = Depends(auth.require_role(["admin", "manager", "doctor"]))
):
    """Create time slot for doctor"""
    try:
        # Check if doctor exists
        doctor = crud.get_doctor(doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        # If current user is a doctor, they can only create slots for themselves
        if current_user['role'] == 'doctor' and current_user['user_id'] != doctor_id:
            raise HTTPException(status_code=403, detail="Doctors can only create their own time slots")
        
        # Validate the timeslot data
        timeslot_dict = timeslot_data.dict()
        timeslot_dict['doctor_id'] = doctor_id
        
        # Ensure branch_id matches doctor's branch if not admin
        if current_user['role'] != 'admin' and timeslot_dict['branch_id'] != doctor['branch_id']:
            raise HTTPException(status_code=400, detail="Time slot must be in doctor's assigned branch")
        
        result = crud.create_time_slot(timeslot_dict)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error_message'])
        
        return {
            "message": "Time slot created successfully",
            "slot_id": result['slot_id'],
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating doctor timeslot: {e}")
        raise HTTPException(status_code=500, detail="Failed to create time slot")

@router.get("/{doctor_id}/appointments", response_model=List[Dict[str, Any]])
def get_doctor_appointments(
    doctor_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = None,
    appointment_date: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(auth.get_current_user)
):
    """Get doctor's appointments"""
    try:
        # Check if doctor exists
        doctor = crud.get_doctor(doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        # Check permissions - doctors can only see their own appointments
        if (current_user['user_type'] == 'employee' and 
            current_user.get('role') == 'doctor' and 
            current_user['user_id'] != doctor_id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        appointments = crud.get_appointments(
            skip=skip,
            limit=limit,
            doctor_id=doctor_id,
            status=status,
            appointment_date=appointment_date
        )
        
        return appointments
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting doctor appointments: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve doctor's appointments")

@router.get("/{doctor_id}/specializations", response_model=List[Dict[str, Any]])
def get_doctor_specializations(doctor_id: str):
    """Get doctor's specializations"""
    try:
        from ..database import execute_query
        
        # Check if doctor exists
        doctor = crud.get_doctor(doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        # Get specializations
        specializations_query = """
        SELECT s.*, ds.certification_date
        FROM specialization s
        JOIN doctor_specialization ds ON s.specialization_id = ds.specialization_id
        WHERE ds.doctor_id = %s
        ORDER BY s.specialization_title
        """
        
        specializations = execute_query(specializations_query, (doctor_id,), fetch='all')
        
        return specializations or []
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting doctor specializations: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve doctor's specializations")

@router.post("/{doctor_id}/specializations/{specialization_id}", response_model=Dict[str, Any])
def add_doctor_specialization(
    doctor_id: str,
    specialization_id: str,
    certification_date: Optional[date] = None,
    current_user: Dict[str, Any] = Depends(auth.require_role(["admin", "manager"]))
):
    """Add specialization to doctor - Admin/Manager only"""
    try:
        from ..db_utils import add_doctor_specialization
        
        # Check if doctor exists
        doctor = crud.get_doctor(doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        # Check if specialization exists
        from ..database import execute_query
        specialization = execute_query(
            "SELECT * FROM specialization WHERE specialization_id = %s", 
            (specialization_id,), fetch='one'
        )
        
        if not specialization:
            raise HTTPException(status_code=404, detail="Specialization not found")
        
        result = add_doctor_specialization(
            doctor_id=doctor_id,
            specialization_id=specialization_id,
            certification_date=certification_date
        )
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error_message'])
        
        return {
            "message": "Specialization added to doctor successfully",
            "doctor_id": doctor_id,
            "specialization_id": specialization_id,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding doctor specialization: {e}")
        raise HTTPException(status_code=500, detail="Failed to add specialization to doctor")