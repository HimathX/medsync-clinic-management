from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from .. import crud, schemas, auth
from ..db_utils import is_doctor_available
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/appointments", tags=["appointments"])

@router.get("/", response_model=List[Dict[str, Any]])
def get_appointments(
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=100),
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    appointment_date: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(auth.get_current_user)
):
    """Get appointments with filtering options"""
    try:
        # Patients can only see their own appointments
        if current_user['user_type'] == "patient":
            patient_id = current_user['user_id']
        
        # For employees, restrict by branch (except admins)
        if (current_user['user_type'] == "employee" and 
            current_user.get('role') not in ['admin'] and
            'branch_id' in current_user):
            branch_id = current_user['branch_id']
        
        appointments = crud.get_appointments(
            skip=skip, 
            limit=limit,
            patient_id=patient_id,
            doctor_id=doctor_id,
            branch_id=branch_id,
            status=status,
            appointment_date=appointment_date
        )
        
        return appointments
        
    except Exception as e:
        logger.error(f"Error getting appointments: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve appointments")

@router.get("/{appointment_id}", response_model=Dict[str, Any])
def get_appointment(
    appointment_id: str, 
    current_user: Dict[str, Any] = Depends(auth.get_current_user)
):
    """Get appointment by ID"""
    try:
        appointment = crud.get_appointment(appointment_id)
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Check permissions
        if (current_user['user_type'] == "patient" and 
            appointment['patient_id'] != current_user['user_id']):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return appointment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting appointment {appointment_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve appointment")

@router.post("/", response_model=Dict[str, Any])
def create_appointment(
    appointment: schemas.AppointmentCreate, 
    current_user: Dict[str, Any] = Depends(auth.get_current_user)
):
    """Create a new appointment"""
    try:
        appointment_data = appointment.dict()
        
        # Patients can only book for themselves
        if current_user['user_type'] == "patient":
            appointment_data['patient_id'] = current_user['user_id']
        elif not appointment_data.get('patient_id'):
            raise HTTPException(status_code=400, detail="Patient ID is required")
        
        # Check if timeslot is available
        timeslot = crud.get_timeslot(appointment_data['time_slot_id'])
        if not timeslot:
            raise HTTPException(status_code=404, detail="Time slot not found")
        if timeslot['is_booked']:
            raise HTTPException(status_code=400, detail="Time slot already booked")
        
        # Validate doctor availability using database function
        slot_date = timeslot['available_date']
        slot_time = timeslot['start_time']
        if not is_doctor_available(timeslot['doctor_id'], slot_date, slot_time):
            raise HTTPException(status_code=400, detail="Doctor not available at this time")
        
        result = crud.create_appointment(appointment_data)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error_message'])
        
        return {
            "message": "Appointment booked successfully",
            "appointment_id": result['appointment_id'],
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating appointment: {e}")
        raise HTTPException(status_code=500, detail="Failed to create appointment")

@router.put("/{appointment_id}", response_model=Dict[str, Any])
def update_appointment(
    appointment_id: str,
    appointment_update: schemas.AppointmentUpdate,
    current_user: Dict[str, Any] = Depends(auth.require_role(["admin", "receptionist", "manager", "doctor"]))
):
    """Update appointment - Employee only"""
    try:
        from ..database import execute_query
        
        # Check if appointment exists
        appointment = crud.get_appointment(appointment_id)
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Build update query
        updates = []
        params = []
        
        if appointment_update.status:
            updates.append("status = %s")
            params.append(appointment_update.status)
        
        if appointment_update.notes is not None:
            updates.append("notes = %s")
            params.append(appointment_update.notes)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update appointment
        query = f"UPDATE appointment SET {', '.join(updates)}, updated_at = NOW() WHERE appointment_id = %s"
        params.append(appointment_id)
        execute_query(query, tuple(params))
        
        return {
            "message": "Appointment updated successfully",
            "appointment_id": appointment_id,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating appointment {appointment_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update appointment")

@router.delete("/{appointment_id}")
def cancel_appointment(
    appointment_id: str,
    current_user: Dict[str, Any] = Depends(auth.get_current_user)
):
    """Cancel appointment"""
    try:
        from ..database import execute_query
        
        # Check if appointment exists and get details
        appointment = crud.get_appointment(appointment_id)
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Check permissions - patients can only cancel their own appointments
        if (current_user['user_type'] == "patient" and 
            appointment['patient_id'] != current_user['user_id']):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if appointment can be cancelled
        if appointment['status'] in ['Completed', 'Cancelled']:
            raise HTTPException(status_code=400, detail=f"Cannot cancel {appointment['status'].lower()} appointment")
        
        # Update appointment status to cancelled
        execute_query(
            "UPDATE appointment SET status = 'Cancelled', updated_at = NOW() WHERE appointment_id = %s",
            (appointment_id,)
        )
        
        # Free up the time slot
        execute_query(
            "UPDATE time_slot SET is_booked = FALSE WHERE time_slot_id = %s",
            (appointment['time_slot_id'],)
        )
        
        return {
            "message": "Appointment cancelled successfully",
            "appointment_id": appointment_id,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling appointment {appointment_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel appointment")

@router.get("/{appointment_id}/consultation", response_model=Dict[str, Any])
def get_appointment_consultation(
    appointment_id: str,
    current_user: Dict[str, Any] = Depends(auth.get_current_user)
):
    """Get consultation record for appointment"""
    try:
        from ..database import execute_query
        
        # Check if appointment exists
        appointment = crud.get_appointment(appointment_id)
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Check permissions
        if (current_user['user_type'] == "patient" and 
            appointment['patient_id'] != current_user['user_id']):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get consultation record
        consultation_query = """
        SELECT cr.*, 
               u.full_name as doctor_name
        FROM consultation_record cr
        JOIN appointment a ON cr.appointment_id = a.appointment_id
        JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
        JOIN doctor d ON ts.doctor_id = d.doctor_id
        JOIN employee e ON d.doctor_id = e.employee_id
        JOIN user u ON e.employee_id = u.user_id
        WHERE cr.appointment_id = %s
        """
        
        consultation = execute_query(consultation_query, (appointment_id,), fetch='one')
        
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation record not found")
        
        # Get prescriptions
        prescriptions_query = """
        SELECT pi.*, m.generic_name, m.manufacturer, m.form
        FROM prescription_item pi
        JOIN medication m ON pi.medication_id = m.medication_id
        WHERE pi.consultation_rec_id = %s
        ORDER BY pi.created_at
        """
        prescriptions = execute_query(prescriptions_query, (consultation['consultation_rec_id'],), fetch='all')
        
        # Get treatments
        treatments_query = """
        SELECT t.*, tc.treatment_name, tc.base_price
        FROM treatment t
        JOIN treatment_catalogue tc ON t.treatment_service_code = tc.treatment_service_code
        WHERE t.consultation_rec_id = %s
        ORDER BY t.created_at
        """
        treatments = execute_query(treatments_query, (consultation['consultation_rec_id'],), fetch='all')
        
        consultation['prescriptions'] = prescriptions or []
        consultation['treatments'] = treatments or []
        
        return consultation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting consultation for appointment {appointment_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve consultation")

@router.post("/{appointment_id}/consultation", response_model=Dict[str, Any])
def create_appointment_consultation(
    appointment_id: str,
    consultation_data: schemas.ConsultationRecordCreate,
    current_user: Dict[str, Any] = Depends(auth.get_current_doctor)
):
    """Create consultation record for appointment - Doctor only"""
    try:
        # Verify appointment exists and belongs to this doctor
        appointment = crud.get_appointment(appointment_id)
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Check if this appointment belongs to the current doctor
        from ..database import execute_query
        doctor_check = execute_query("""
            SELECT 1 FROM appointment a
            JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
            WHERE a.appointment_id = %s AND ts.doctor_id = %s
        """, (appointment_id, current_user['doctor_id']), fetch='one')
        
        if not doctor_check:
            raise HTTPException(status_code=403, detail="Access denied - appointment not assigned to you")
        
        # Check if consultation already exists
        existing_consultation = execute_query(
            "SELECT 1 FROM consultation_record WHERE appointment_id = %s", 
            (appointment_id,), fetch='one'
        )
        
        if existing_consultation:
            raise HTTPException(status_code=400, detail="Consultation record already exists for this appointment")
        
        # Create consultation record
        consultation_dict = consultation_data.dict()
        consultation_dict['appointment_id'] = appointment_id
        
        result = crud.create_consultation_record(consultation_dict)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error_message'])
        
        # Update appointment status to completed
        execute_query(
            "UPDATE appointment SET status = 'Completed', updated_at = NOW() WHERE appointment_id = %s",
            (appointment_id,)
        )
        
        return {
            "message": "Consultation record created successfully",
            "consultation_id": result['consultation_id'],
            "appointment_id": appointment_id,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating consultation for appointment {appointment_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create consultation record")