from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import date
from core.database import get_db
from models.patient import Patient, PatientAllergy
from models.user import User
import hashlib

router = APIRouter(tags=["patients"])

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

class PatientRegistrationRequest(BaseModel):
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
    
    # Patient Info
    blood_group: str = Field(..., pattern="^(A\\+|A-|B\\+|B-|O\\+|O-|AB\\+|AB-)$")
    registered_branch_id: str = Field(..., description="Branch ID (UUID)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "address_line1": "45 Galle Road",
                "address_line2": "Colombo 03",
                "city": "Colombo",
                "province": "Western",
                "postal_code": "00300",
                "country": "Sri Lanka",
                "contact_num1": "+94771234567",
                "contact_num2": "+94112345678",
                "full_name": "John Doe",
                "NIC": "199012345678",
                "email": "john.doe@example.com",
                "gender": "Male",
                "DOB": "1990-05-15",
                "password": "SecurePass123!",
                "blood_group": "O+",
                "registered_branch_id": "branch-uuid-here"
            }
        }

class PatientRegistrationResponse(BaseModel):
    success: bool
    message: str
    patient_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Patient registered successfully",
                "patient_id": "uuid-of-new-patient"
            }
        }

# ============================================
# PATIENT REGISTRATION ENDPOINT
# ============================================

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=PatientRegistrationResponse)
def register_patient(
    patient_data: PatientRegistrationRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new patient using stored procedure
    
    - Creates user account
    - Stores address and contact information
    - Registers patient with blood group and branch
    """
    try:
        # Hash the password using SHA-256 (64 hex characters, well under 255)
        password_hash = hash_password(patient_data.password)
        
        # Call the stored procedure
        result = db.execute(
            text("""
                CALL RegisterPatient(
                    :p_address_line1, :p_address_line2, :p_city, :p_province, 
                    :p_postal_code, :p_country,
                    :p_contact_num1, :p_contact_num2,
                    :p_full_name, :p_NIC, :p_email, :p_gender, :p_DOB, :p_password_hash,
                    :p_blood_group, :p_registered_branch_id,
                    @p_user_id, @p_error_message, @p_success
                )
            """),
            {
                "p_address_line1": patient_data.address_line1,
                "p_address_line2": patient_data.address_line2,
                "p_city": patient_data.city,
                "p_province": patient_data.province,
                "p_postal_code": patient_data.postal_code,
                "p_country": patient_data.country,
                "p_contact_num1": patient_data.contact_num1,
                "p_contact_num2": patient_data.contact_num2,
                "p_full_name": patient_data.full_name,
                "p_NIC": patient_data.NIC,
                "p_email": patient_data.email,
                "p_gender": patient_data.gender,
                "p_DOB": patient_data.DOB,
                "p_password_hash": password_hash,
                "p_blood_group": patient_data.blood_group,
                "p_registered_branch_id": patient_data.registered_branch_id
            }
        )
        
        # Get output parameters
        output = db.execute(text("SELECT @p_user_id, @p_error_message, @p_success")).fetchone()
        
        user_id = output[0]
        error_message = output[1]
        success = bool(output[2])
        
        # Commit the transaction
        db.commit()
        
        if success:
            return PatientRegistrationResponse(
                success=True,
                message=error_message or "Patient registered successfully",
                patient_id=user_id
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message or "Failed to register patient"
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
# EXISTING ENDPOINTS
# ============================================

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
