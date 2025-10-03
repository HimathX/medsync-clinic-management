from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from core.database import get_db
from models.employee import Doctor, Employee, DoctorSpecialization, Specialization
from models.user import User
from models.appointment import TimeSlot

router = APIRouter(
    prefix="/doctors",
    tags=["doctors"]
)

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_doctors(
    skip: int = 0,
    limit: int = 100,
    is_available: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all doctors with optional availability filter"""
    query = db.query(Doctor)
    
    if is_available is not None:
        query = query.filter(Doctor.is_available == is_available)
    
    doctors = query.offset(skip).limit(limit).all()
    
    return {
        "total": query.count(),
        "doctors": doctors
    }

@router.get("/{doctor_id}", status_code=status.HTTP_200_OK)
def get_doctor_by_id(
    doctor_id: str,
    db: Session = Depends(get_db)
):
    """Get doctor details by ID"""
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID {doctor_id} not found"
        )
    
    # Get employee and user details
    employee = db.query(Employee).filter(Employee.employee_id == doctor_id).first()
    user = db.query(User).filter(User.user_id == doctor_id).first()
    
    return {
        "doctor": doctor,
        "employee": employee,
        "user": user
    }

@router.get("/{doctor_id}/specializations", status_code=status.HTTP_200_OK)
def get_doctor_specializations(
    doctor_id: str,
    db: Session = Depends(get_db)
):
    """Get all specializations for a doctor"""
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID {doctor_id} not found"
        )
    
    specializations = db.query(
        Specialization
    ).join(
        DoctorSpecialization
    ).filter(
        DoctorSpecialization.doctor_id == doctor_id
    ).all()
    
    return {
        "doctor_id": doctor_id,
        "specializations": specializations
    }

@router.get("/{doctor_id}/time-slots", status_code=status.HTTP_200_OK)
def get_doctor_time_slots(
    doctor_id: str,
    available_date: Optional[date] = None,
    is_booked: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get time slots for a doctor with optional filters"""
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID {doctor_id} not found"
        )
    
    query = db.query(TimeSlot).filter(TimeSlot.doctor_id == doctor_id)
    
    if available_date:
        query = query.filter(TimeSlot.available_date == available_date)
    
    if is_booked is not None:
        query = query.filter(TimeSlot.is_booked == is_booked)
    
    time_slots = query.all()
    
    return {
        "doctor_id": doctor_id,
        "time_slots": time_slots
    }

@router.get("/specialization/{specialization_id}", status_code=status.HTTP_200_OK)
def get_doctors_by_specialization(
    specialization_id: str,
    db: Session = Depends(get_db)
):
    """Get all doctors with a specific specialization"""
    specialization = db.query(Specialization).filter(
        Specialization.specialization_id == specialization_id
    ).first()
    
    if not specialization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Specialization with ID {specialization_id} not found"
        )
    
    doctors = db.query(Doctor).join(
        DoctorSpecialization
    ).filter(
        DoctorSpecialization.specialization_id == specialization_id
    ).all()
    
    return {
        "specialization": specialization,
        "doctors": doctors
    }
