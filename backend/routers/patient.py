from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from models.patient import Patient, PatientAllergy
from models.user import User

router = APIRouter(
    prefix="/patients",
    tags=["patients"]
)

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_patients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all patients with pagination"""
    patients = db.query(Patient).offset(skip).limit(limit).all()
    return {
        "total": db.query(Patient).count(),
        "patients": patients
    }

@router.get("/{patient_id}", status_code=status.HTTP_200_OK)
def get_patient_by_id(
    patient_id: str,
    db: Session = Depends(get_db)
):
    """Get patient by ID"""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    # Get user details
    user = db.query(User).filter(User.user_id == patient_id).first()
    
    return {
        "patient": patient,
        "user": user
    }

@router.get("/{patient_id}/allergies", status_code=status.HTTP_200_OK)
def get_patient_allergies(
    patient_id: str,
    db: Session = Depends(get_db)
):
    """Get all allergies for a patient"""
    # Check if patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    allergies = db.query(PatientAllergy).filter(
        PatientAllergy.patient_id == patient_id,
        PatientAllergy.is_active == True
    ).all()
    
    return {
        "patient_id": patient_id,
        "allergies": allergies
    }

@router.get("/{patient_id}/appointments", status_code=status.HTTP_200_OK)
def get_patient_appointments(
    patient_id: str,
    db: Session = Depends(get_db)
):
    """Get all appointments for a patient"""
    from models.appointment import Appointment
    
    # Check if patient exists
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
        "appointments": appointments
    }

@router.get("/search/by-nic/{nic}", status_code=status.HTTP_200_OK)
def search_patient_by_nic(
    nic: str,
    db: Session = Depends(get_db)
):
    """Search patient by NIC"""
    user = db.query(User).filter(User.NIC == nic).first()
    
    if not user or user.user_type != 'patient':
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with NIC {nic} not found"
        )
    
    patient = db.query(Patient).filter(Patient.patient_id == user.user_id).first()
    
    return {
        "user": user,
        "patient": patient
    }
