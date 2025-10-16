from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import date


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
