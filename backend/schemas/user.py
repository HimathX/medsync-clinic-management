from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import date
from core.database import get_db
from models.user import User


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
