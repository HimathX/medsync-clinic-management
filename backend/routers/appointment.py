from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from core.database import get_db
from models.appointment import Appointment, TimeSlot
from models.patient import Patient
from models.employee import Doctor

router = APIRouter(   tags=["appointments"])

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_appointments(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all appointments with pagination and optional status filter"""
    query = db.query(Appointment)
    
    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    
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
    
    # Get related time slot
    time_slot = db.query(TimeSlot).filter(
        TimeSlot.time_slot_id == appointment.time_slot_id
    ).first()
    
    # Get patient info
    patient = db.query(Patient).filter(
        Patient.patient_id == appointment.patient_id
    ).first()
    
    # Get doctor info
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

@router.get("/date/{appointment_date}", status_code=status.HTTP_200_OK)
def get_appointments_by_date(
    appointment_date: date,
    db: Session = Depends(get_db)
):
    """Get all appointments for a specific date"""
    appointments = db.query(Appointment).join(
        TimeSlot
    ).filter(
        TimeSlot.available_date == appointment_date
    ).all()
    
    return {
        "date": appointment_date,
        "total": len(appointments),
        "appointments": appointments
    }

@router.get("/patient/{patient_id}", status_code=status.HTTP_200_OK)
def get_appointments_by_patient(
    patient_id: str,
    db: Session = Depends(get_db)
):
    """Get all appointments for a specific patient"""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    appointments = db.query(Appointment).filter(
        Appointment.patient_id == patient_id
    ).all()
    
    return {
        "patient_id": patient_id,
        "total": len(appointments),
        "appointments": appointments
    }

@router.get("/doctor/{doctor_id}", status_code=status.HTTP_200_OK)
def get_appointments_by_doctor(
    doctor_id: str,
    db: Session = Depends(get_db)
):
    """Get all appointments for a specific doctor"""
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID {doctor_id} not found"
        )
    
    appointments = db.query(Appointment).join(
        TimeSlot
    ).filter(
        TimeSlot.doctor_id == doctor_id
    ).all()
    
    return {
        "doctor_id": doctor_id,
        "total": len(appointments),
        "appointments": appointments
    }
