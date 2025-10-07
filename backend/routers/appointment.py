from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List
from datetime import date, time
from pydantic import BaseModel, Field
from core.database import get_db
from models.appointment import Appointment, TimeSlot
from models.patient import Patient
from models.employee import Doctor

router = APIRouter(tags=["appointments"])

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class AppointmentBookingRequest(BaseModel):
    patient_id: str = Field(..., description="Patient ID (UUID)")
    time_slot_id: str = Field(..., description="Time slot ID (UUID)")
    notes: Optional[str] = Field(None, description="Additional notes or symptoms")
    
    class Config:
        json_schema_extra = {
            "example": {
                "patient_id": "patient-uuid-here",
                "time_slot_id": "timeslot-uuid-here",
                "notes": "Patient complains of headache and fever"
            }
        }

class AppointmentBookingResponse(BaseModel):
    success: bool
    message: str
    appointment_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Appointment booked successfully",
                "appointment_id": "appointment-uuid-here"
            }
        }

class AppointmentUpdateRequest(BaseModel):
    status: Optional[str] = Field(None, pattern="^(Scheduled|Completed|Cancelled|No-show)$")
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    notes: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "Completed",
                "diagnosis": "Common cold",
                "prescription": "Paracetamol 500mg twice daily",
                "notes": "Patient advised to rest"
            }
        }

# ============================================
# BOOK APPOINTMENT ENDPOINT
# ============================================

@router.post("/book", status_code=status.HTTP_201_CREATED, response_model=AppointmentBookingResponse)
def book_appointment(
    booking_data: AppointmentBookingRequest,
    db: Session = Depends(get_db)
):
    """
    Book a new appointment using stored procedure
    
    - Validates patient and time slot
    - Marks time slot as booked
    - Creates appointment record
    """
    try:
        # Call the stored procedure
        result = db.execute(
            text("""
                CALL BookAppointment(
                    :p_patient_id,
                    :p_time_slot_id,
                    :p_notes,
                    @p_appointment_id,
                    @p_error_message,
                    @p_success
                )
            """),
            {
                "p_patient_id": booking_data.patient_id,
                "p_time_slot_id": booking_data.time_slot_id,
                "p_notes": booking_data.notes
            }
        )
        
        # Get output parameters
        output = db.execute(text("SELECT @p_appointment_id, @p_error_message, @p_success")).fetchone()
        
        appointment_id = output[0]  # type: ignore
        error_message = output[1]  # type: ignore
        success = bool(output[2])  # type: ignore
        
        # Commit the transaction
        db.commit()
        
        if success:
            return AppointmentBookingResponse(
                success=True,
                message=error_message or "Appointment booked successfully",
                appointment_id=appointment_id
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message or "Failed to book appointment"
            )
            
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while booking appointment: {str(e)}"
        )

# ============================================
# GET ENDPOINTS
# ============================================

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_appointments(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    date_filter: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Get all appointments with optional filters"""
    query = db.query(Appointment)
    
    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    
    if date_filter:
        query = query.join(TimeSlot).filter(TimeSlot.available_date == date_filter)
    
    appointments = query.offset(skip).limit(limit).all()
    
    return {
        "total": query.count(),
        "appointments": appointments
    }

@router.get("/{appointment_id}", status_code=status.HTTP_200_OK)
def get_appointment_by_id(
    appointment_id: str,
    db: Session = Depends(get_db)
):
    """Get appointment details by ID"""
    appointment = db.query(Appointment).filter(
        Appointment.appointment_id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment with ID {appointment_id} not found"
        )
    
    # Get related data
    time_slot = db.query(TimeSlot).filter(
        TimeSlot.time_slot_id == appointment.time_slot_id
    ).first()
    
    patient = db.query(Patient).filter(
        Patient.patient_id == appointment.patient_id
    ).first()
    
    doctor = None
    if time_slot:
        doctor = db.query(Doctor).filter(
            Doctor.doctor_id == time_slot.doctor_id
        ).first()
    
    return {
        "appointment": appointment,
        "time_slot": time_slot,
        "patient": patient,
        "doctor": doctor
    }

@router.get("/patient/{patient_id}", status_code=status.HTTP_200_OK)
def get_appointments_by_patient(
    patient_id: str,
    include_past: bool = False,
    db: Session = Depends(get_db)
):
    """Get all appointments for a specific patient"""
    # Check if patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    query = db.query(Appointment).filter(Appointment.patient_id == patient_id)
    
    if not include_past:
        query = query.join(TimeSlot).filter(TimeSlot.available_date >= date.today())
    
    appointments = query.all()
    
    return {
        "patient_id": patient_id,
        "appointments": appointments
    }

@router.get("/doctor/{doctor_id}", status_code=status.HTTP_200_OK)
def get_appointments_by_doctor(
    doctor_id: str,
    include_past: bool = False,
    db: Session = Depends(get_db)
):
    """Get all appointments for a specific doctor"""
    # Check if doctor exists
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID {doctor_id} not found"
        )
    
    query = db.query(Appointment).join(
        TimeSlot,
        Appointment.time_slot_id == TimeSlot.time_slot_id
    ).filter(TimeSlot.doctor_id == doctor_id)
    
    if not include_past:
        query = query.filter(TimeSlot.available_date >= date.today())
    
    appointments = query.all()
    
    return {
        "doctor_id": doctor_id,
        "appointments": appointments
    }

@router.get("/date/{appointment_date}", status_code=status.HTTP_200_OK)
def get_appointments_by_date(
    appointment_date: date,
    db: Session = Depends(get_db)
):
    """Get all appointments for a specific date"""
    appointments = db.query(Appointment).join(
        TimeSlot,
        Appointment.time_slot_id == TimeSlot.time_slot_id
    ).filter(TimeSlot.available_date == appointment_date).all()
    
    return {
        "date": appointment_date,
        "total": len(appointments),
        "appointments": appointments
    }

# ============================================
# UPDATE/CANCEL ENDPOINTS
# ============================================

@router.patch("/{appointment_id}", status_code=status.HTTP_200_OK)
def update_appointment(
    appointment_id: str,
    update_data: AppointmentUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update appointment details (status, diagnosis, prescription, notes)"""
    try:
        appointment = db.query(Appointment).filter(
            Appointment.appointment_id == appointment_id
        ).first()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment with ID {appointment_id} not found"
            )
        
        # Update fields if provided
        if update_data.status:
            appointment.status = update_data.status
        if update_data.diagnosis:
            appointment.diagnosis = update_data.diagnosis
        if update_data.prescription:
            appointment.prescription = update_data.prescription
        if update_data.notes:
            appointment.notes = update_data.notes
        
        db.commit()
        db.refresh(appointment)
        
        return {
            "success": True,
            "message": "Appointment updated successfully",
            "appointment": appointment
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating appointment: {str(e)}"
        )

@router.delete("/{appointment_id}", status_code=status.HTTP_200_OK)
def cancel_appointment(
    appointment_id: str,
    db: Session = Depends(get_db)
):
    """Cancel an appointment and free up the time slot"""
    try:
        appointment = db.query(Appointment).filter(
            Appointment.appointment_id == appointment_id
        ).first()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment with ID {appointment_id} not found"
            )
        
        if appointment.status in ['Completed', 'Cancelled']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel appointment with status: {appointment.status}"
            )
        
        # Update appointment status
        appointment.status = 'Cancelled'
        
        # Free up the time slot
        time_slot = db.query(TimeSlot).filter(
            TimeSlot.time_slot_id == appointment.time_slot_id
        ).first()
        
        if time_slot:
            time_slot.is_booked = False
        
        db.commit()
        
        return {
            "success": True,
            "message": "Appointment cancelled successfully",
            "appointment_id": appointment_id
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while cancelling appointment: {str(e)}"
        )

# ============================================
# TIME SLOT MANAGEMENT
# ============================================

@router.get("/available-slots/{doctor_id}", status_code=status.HTTP_200_OK)
def get_available_time_slots(
    doctor_id: str,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Get available time slots for a doctor within a date range"""
    # Check if doctor exists
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID {doctor_id} not found"
        )
    
    query = db.query(TimeSlot).filter(
        TimeSlot.doctor_id == doctor_id,
        TimeSlot.is_booked == False,
        TimeSlot.available_date >= date.today()
    )
    
    if date_from:
        query = query.filter(TimeSlot.available_date >= date_from)
    if date_to:
        query = query.filter(TimeSlot.available_date <= date_to)
    
    time_slots = query.order_by(
        TimeSlot.available_date,
        TimeSlot.start_time
    ).all()
    
    return {
        "doctor_id": doctor_id,
        "total_available": len(time_slots),
        "time_slots": time_slots
    }

