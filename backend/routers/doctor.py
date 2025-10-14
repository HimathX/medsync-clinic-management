from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import date
from decimal import Decimal
from core.database import get_db
from models.employee import Doctor, Employee, DoctorSpecialization, Specialization
from models.user import User
from models.appointment import TimeSlot
import hashlib
import json

router = APIRouter(tags=["doctors"])

# Password hashing helper
def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(plain_password) == hashed_password

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class DoctorRegistrationRequest(BaseModel):
    # Address
    address_line1: str = Field(..., max_length=50, description="Primary address line")
    address_line2: Optional[str] = Field(None, max_length=50, description="Secondary address line")
    city: str = Field(..., max_length=50)
    province: str = Field(..., max_length=50)
    postal_code: str = Field(..., max_length=20)
    country: Optional[str] = Field("Sri Lanka", max_length=50)
    
    # Contact
    contact_num1: str = Field(..., max_length=20, description="Primary contact number")
    contact_num2: Optional[str] = Field(None, max_length=20, description="Secondary contact number")
    
    # User Info
    full_name: str = Field(..., max_length=255)
    NIC: str = Field(..., max_length=20, description="National Identity Card number")
    email: EmailStr
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    DOB: date = Field(..., description="Date of birth (YYYY-MM-DD)")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    
    # Employee Info
    branch_name: str = Field(..., max_length=50, description="Branch name")
    salary: Decimal = Field(..., gt=0, description="Monthly salary")
    joined_date: date = Field(..., description="Date of joining")
    
    # Doctor Info
    room_no: Optional[str] = Field(None, max_length=5, description="Room number")
    medical_licence_no: str = Field(..., max_length=50, description="Medical licence number")
    consultation_fee: Decimal = Field(..., ge=0, description="Consultation fee")
    specialization_ids: List[str] = Field(default_factory=list, description="List of specialization IDs")
    
    class Config:
        json_schema_extra = {
            "example": {
                "address_line1": "789 Doctor Street",
                "address_line2": "Colombo 07",
                "city": "Colombo",
                "province": "Western",
                "postal_code": "00700",
                "country": "Sri Lanka",
                "contact_num1": "+94115556677",
                "contact_num2": "+94771112233",
                "full_name": "Dr. John Smith",
                "NIC": "197501234567",
                "email": "dr.john@clinic.com",
                "gender": "Male",
                "DOB": "1975-05-15",
                "password": "SecureDoc123!",
                "branch_name": "MedSync Colombo",
                "salary": 120000.00,
                "joined_date": "2025-01-01",
                "room_no": "R101",
                "medical_licence_no": "LK-MED-12345",
                "consultation_fee": 2500.00,
                "specialization_ids": ["spec-uuid-1", "spec-uuid-2"]
            }
        }

class DoctorRegistrationResponse(BaseModel):
    success: bool
    message: str
    doctor_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Doctor registered successfully",
                "doctor_id": "uuid-of-new-doctor"
            }
        }

class AddSpecializationRequest(BaseModel):
    specialization_id: str = Field(..., description="Specialization ID (UUID)")
    certification_date: date = Field(..., description="Date of certification (YYYY-MM-DD)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "specialization_id": "spec-uuid-here",
                "certification_date": "2024-01-15"
            }
        }

class AddSpecializationResponse(BaseModel):
    success: bool
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Doctor specialization added successfully"
            }
        }

# ============================================
# DOCTOR REGISTRATION ENDPOINT
# ============================================

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=DoctorRegistrationResponse)
def register_doctor(
    doctor_data: DoctorRegistrationRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new doctor using stored procedure
    
    - Creates user account
    - Creates employee record
    - Creates doctor record with medical licence
    - Associates specializations
    """
    try:
        # Hash the password using SHA-256
        password_hash = hash_password(doctor_data.password)
        
        # Convert specialization IDs to JSON array for MySQL
        specialization_json = json.dumps(doctor_data.specialization_ids) if doctor_data.specialization_ids else None
        
        # Call the stored procedure
        result = db.execute(
            text("""
                CALL RegisterDoctor(
                    :p_address_line1, :p_address_line2, :p_city, :p_province, 
                    :p_postal_code, :p_country,
                    :p_contact_num1, :p_contact_num2,
                    :p_full_name, :p_NIC, :p_email, :p_gender, :p_DOB, :p_password_hash,
                    :p_branch_name, :p_salary, :p_joined_date,
                    :p_room_no, :p_medical_licence_no, :p_consultation_fee, :p_specialization_ids,
                    @p_user_id, @p_error_message, @p_success
                )
            """),
            {
                "p_address_line1": doctor_data.address_line1,
                "p_address_line2": doctor_data.address_line2,
                "p_city": doctor_data.city,
                "p_province": doctor_data.province,
                "p_postal_code": doctor_data.postal_code,
                "p_country": doctor_data.country,
                "p_contact_num1": doctor_data.contact_num1,
                "p_contact_num2": doctor_data.contact_num2,
                "p_full_name": doctor_data.full_name,
                "p_NIC": doctor_data.NIC,
                "p_email": doctor_data.email,
                "p_gender": doctor_data.gender,
                "p_DOB": doctor_data.DOB,
                "p_password_hash": password_hash,
                "p_branch_name": doctor_data.branch_name,
                "p_salary": float(doctor_data.salary),
                "p_joined_date": doctor_data.joined_date,
                "p_room_no": doctor_data.room_no,
                "p_medical_licence_no": doctor_data.medical_licence_no,
                "p_consultation_fee": float(doctor_data.consultation_fee),
                "p_specialization_ids": specialization_json
            }
        )
        
        # Get output parameters
        output = db.execute(text("SELECT @p_user_id, @p_error_message, @p_success")).fetchone()
        
        user_id = output[0]  # type: ignore
        error_message = output[1]  # type: ignore
        success = bool(output[2])  # type: ignore
        
        # Commit the transaction
        db.commit()
        
        if success:
            return DoctorRegistrationResponse(
                success=True,
                message=error_message or "Doctor registered successfully",
                doctor_id=user_id
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message or "Failed to register doctor"
            )
            
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during registration: {str(e)}"
        )

# ============================================
# GET ENDPOINTS
# ============================================

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_doctors(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all doctors with pagination"""
    doctors = db.query(Doctor).offset(skip).limit(limit).all()
    return {
        "total": db.query(Doctor).count(),
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
    
    # Get user and employee details
    user = db.query(User).filter(User.user_id == doctor_id).first()
    employee = db.query(Employee).filter(Employee.employee_id == doctor_id).first()
    
    # Get specializations
    specializations = db.query(Specialization).join(
        DoctorSpecialization,
        Specialization.specialization_id == DoctorSpecialization.specialization_id
    ).filter(
        DoctorSpecialization.doctor_id == doctor_id
    ).all()
    
    return {
        "doctor": doctor,
        "user": user,
        "employee": employee,
        "specializations": specializations
    }

@router.get("/{doctor_id}/time-slots", status_code=status.HTTP_200_OK)
def get_doctor_time_slots(
    doctor_id: str,
    available_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all time slots for a doctor"""
    # Check if doctor exists
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID {doctor_id} not found"
        )
    
    query = db.query(TimeSlot).filter(TimeSlot.doctor_id == doctor_id)
    
    if available_only:
        query = query.filter(
            TimeSlot.is_booked == False,
            TimeSlot.available_date >= date.today()
        )
    
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
    doctors = db.query(Doctor).join(
        DoctorSpecialization,
        Doctor.doctor_id == DoctorSpecialization.doctor_id
    ).filter(
        DoctorSpecialization.specialization_id == specialization_id
    ).all()
    
    return {
        "specialization_id": specialization_id,
        "doctors": doctors
    }

@router.post("/{doctor_id}/specializations", status_code=status.HTTP_201_CREATED, response_model=AddSpecializationResponse)
def add_doctor_specialization(
    doctor_id: str,
    specialization_data: AddSpecializationRequest,
    db: Session = Depends(get_db)
):
    """
    Add a new specialization to a doctor
    
    - Validates doctor and specialization exist
    - Checks for duplicates
    - Associates specialization with certification date
    """
    try:
        # Call the stored procedure
        result = db.execute(
            text("""
                CALL AddDoctorSpecialization(
                    :p_doctor_id,
                    :p_specialization_id,
                    :p_certification_date,
                    @p_error_message,
                    @p_success
                )
            """),
            {
                "p_doctor_id": doctor_id,
                "p_specialization_id": specialization_data.specialization_id,
                "p_certification_date": specialization_data.certification_date
            }
        )
        
        # Get output parameters
        output = db.execute(text("SELECT @p_error_message, @p_success")).fetchone()
        
        error_message = output[0]  # type: ignore
        success = bool(output[1])  # type: ignore
        
        # Commit the transaction
        db.commit()
        
        if success:
            return AddSpecializationResponse(
                success=True,
                message=error_message or "Doctor specialization added successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message or "Failed to add specialization"
            )
            
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while adding specialization: {str(e)}"
        )

@router.get("/{doctor_id}/specializations", status_code=status.HTTP_200_OK)
def get_doctor_specializations(
    doctor_id: str,
    db: Session = Depends(get_db)
):
    """Get all specializations for a specific doctor"""
    # Check if doctor exists
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID {doctor_id} not found"
        )
    
    # Get specializations with certification dates
    specializations = db.query(
        Specialization,
        DoctorSpecialization.certification_date
    ).join(
        DoctorSpecialization,
        Specialization.specialization_id == DoctorSpecialization.specialization_id
    ).filter(
        DoctorSpecialization.doctor_id == doctor_id
    ).all()
    
    return {
        "doctor_id": doctor_id,
        "total": len(specializations),
        "specializations": [
            {
                "specialization_id": spec.specialization_id,
                "specialization_title": spec.specialization_title,
                "other_details": spec.other_details,
                "certification_date": cert_date
            }
            for spec, cert_date in specializations
        ]
    }

@router.delete("/{doctor_id}/specializations/{specialization_id}", status_code=status.HTTP_200_OK)
def remove_doctor_specialization(
    doctor_id: str,
    specialization_id: str,
    db: Session = Depends(get_db)
):
    """Remove a specialization from a doctor"""
    try:
        # Check if the association exists
        specialization = db.query(DoctorSpecialization).filter(
            DoctorSpecialization.doctor_id == doctor_id,
            DoctorSpecialization.specialization_id == specialization_id
        ).first()
        
        if not specialization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Specialization not found for this doctor"
            )
        
        # Delete the association
        db.delete(specialization)
        db.commit()
        
        return {
            "success": True,
            "message": "Specialization removed successfully"
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while removing specialization: {str(e)}"
        )

