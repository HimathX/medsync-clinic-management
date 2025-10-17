from fastapi import APIRouter, HTTPException, status, UploadFile, File
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import date
from core.database import get_db
import logging

router = APIRouter(prefix="/patients", tags=["patient-profile"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone: str
    alternative_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None

class InsuranceInfo(BaseModel):
    provider: str
    policy_number: str
    group_number: Optional[str] = None
    coverage_type: str = "Individual"  # Individual or Family
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None

class PatientProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    contact_num1: Optional[str] = None
    contact_num2: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "Sri Lanka"
    emergency_contact_name: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None

class PatientProfileResponse(BaseModel):
    patient_id: str
    full_name: str
    email: str
    NIC: str
    gender: str
    DOB: date
    blood_group: Optional[str] = None
    contact_num1: str
    contact_num2: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    registered_branch: str
    registration_date: date

# ============================================
# ENDPOINTS
# ============================================

@router.get("/{patient_id}/profile", status_code=status.HTTP_200_OK, response_model=PatientProfileResponse)
def get_patient_profile(patient_id: str):
    """Get complete patient profile information"""
    try:
        with get_db() as (cursor, connection):
            query = """
                SELECT 
                    p.patient_id,
                    u.full_name,
                    u.email,
                    p.NIC,
                    p.gender,
                    p.DOB,
                    p.blood_group,
                    p.contact_num1,
                    p.contact_num2,
                    p.address_line1,
                    p.address_line2,
                    p.city,
                    p.province,
                    p.postal_code,
                    p.country,
                    p.emergency_contact_name,
                    p.emergency_contact_relationship,
                    p.emergency_contact_phone,
                    p.allergies,
                    p.chronic_conditions,
                    p.current_medications,
                    p.insurance_provider,
                    p.insurance_policy_number,
                    b.branch_name as registered_branch,
                    p.registration_date
                FROM patient p
                JOIN user u ON p.patient_id = u.user_id
                LEFT JOIN branch b ON p.registered_branch = b.branch_id
                WHERE p.patient_id = %s
            """
            
            cursor.execute(query, (patient_id,))
            patient = cursor.fetchone()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            logger.info(f"Retrieved profile for patient {patient_id}")
            return patient
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching patient profile {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.put("/{patient_id}/profile", status_code=status.HTTP_200_OK)
def update_patient_profile(patient_id: str, profile_data: PatientProfileUpdate):
    """Update patient profile information"""
    try:
        with get_db() as (cursor, connection):
            # Check if patient exists
            cursor.execute("SELECT * FROM patient WHERE patient_id = %s", (patient_id,))
            patient = cursor.fetchone()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            # Build dynamic update query for patient table
            patient_updates = []
            patient_values = []
            
            patient_fields = [
                'contact_num1', 'contact_num2', 'address_line1', 'address_line2',
                'city', 'province', 'postal_code', 'country',
                'emergency_contact_name', 'emergency_contact_relationship', 
                'emergency_contact_phone', 'allergies', 'chronic_conditions',
                'current_medications', 'insurance_provider', 'insurance_policy_number'
            ]
            
            for field in patient_fields:
                value = getattr(profile_data, field, None)
                if value is not None:
                    patient_updates.append(f"{field} = %s")
                    patient_values.append(value)
            
            if patient_updates:
                patient_values.append(patient_id)
                patient_query = f"UPDATE patient SET {', '.join(patient_updates)} WHERE patient_id = %s"
                cursor.execute(patient_query, patient_values)
            
            # Update user table if needed
            user_updates = []
            user_values = []
            
            if profile_data.full_name is not None:
                user_updates.append("full_name = %s")
                user_values.append(profile_data.full_name)
            
            if profile_data.email is not None:
                user_updates.append("email = %s")
                user_values.append(profile_data.email)
            
            if user_updates:
                user_values.append(patient_id)
                user_query = f"UPDATE user SET {', '.join(user_updates)} WHERE user_id = %s"
                cursor.execute(user_query, user_values)
            
            connection.commit()
            
            logger.info(f"Updated profile for patient {patient_id}")
            
            return {
                "message": "Profile updated successfully",
                "patient_id": patient_id
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating patient profile {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{patient_id}/stats", status_code=status.HTTP_200_OK)
def get_patient_statistics(patient_id: str):
    """Get patient statistics for dashboard"""
    try:
        with get_db() as (cursor, connection):
            # Check if patient exists
            cursor.execute("SELECT * FROM patient WHERE patient_id = %s", (patient_id,))
            patient = cursor.fetchone()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            # Get appointment statistics
            appointment_stats = """
                SELECT 
                    COUNT(*) as total_appointments,
                    SUM(CASE WHEN a.status = 'Scheduled' AND ts.available_date >= CURDATE() THEN 1 ELSE 0 END) as upcoming,
                    SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) as completed,
                    MAX(CASE WHEN a.status = 'Completed' THEN ts.available_date END) as last_visit
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE a.patient_id = %s
            """
            cursor.execute(appointment_stats, (patient_id,))
            appt_stats = cursor.fetchone()
            
            # Get prescription count
            prescription_count = """
                SELECT COUNT(DISTINCT p.prescription_id) as prescription_count
                FROM prescription p
                JOIN appointment a ON p.appointment_id = a.appointment_id
                WHERE a.patient_id = %s
            """
            cursor.execute(prescription_count, (patient_id,))
            rx_count = cursor.fetchone()
            
            # Get lab results count
            lab_count = """
                SELECT COUNT(DISTINCT lr.result_id) as lab_result_count
                FROM lab_result lr
                JOIN appointment a ON lr.appointment_id = a.appointment_id
                WHERE a.patient_id = %s
            """
            cursor.execute(lab_count, (patient_id,))
            lab_stats = cursor.fetchone()
            
            logger.info(f"Retrieved statistics for patient {patient_id}")
            
            return {
                "patient_id": patient_id,
                "total_appointments": int(appt_stats['total_appointments']) if appt_stats['total_appointments'] else 0,
                "upcoming_appointments": int(appt_stats['upcoming']) if appt_stats['upcoming'] else 0,
                "completed_appointments": int(appt_stats['completed']) if appt_stats['completed'] else 0,
                "last_visit": str(appt_stats['last_visit']) if appt_stats['last_visit'] else None,
                "prescriptions": int(rx_count['prescription_count']) if rx_count['prescription_count'] else 0,
                "lab_results": int(lab_stats['lab_result_count']) if lab_stats['lab_result_count'] else 0
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching statistics for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.post("/{patient_id}/profile-photo", status_code=status.HTTP_200_OK)
async def upload_profile_photo(patient_id: str, file: UploadFile = File(...)):
    """Upload patient profile photo"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # TODO: Implement file storage (local, S3, etc.)
        # For now, just return success
        
        logger.info(f"Uploaded profile photo for patient {patient_id}")
        
        return {
            "message": "Profile photo uploaded successfully",
            "patient_id": patient_id,
            "filename": file.filename
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading photo for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload error: {str(e)}"
        )


@router.get("/{patient_id}/medical-summary", status_code=status.HTTP_200_OK)
def get_medical_summary(patient_id: str):
    """Get patient's medical summary including allergies, conditions, and medications"""
    try:
        with get_db() as (cursor, connection):
            # Check if patient exists
            cursor.execute("SELECT * FROM patient WHERE patient_id = %s", (patient_id,))
            patient = cursor.fetchone()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            # Get medical information
            medical_query = """
                SELECT 
                    allergies,
                    chronic_conditions,
                    current_medications,
                    blood_group
                FROM patient
                WHERE patient_id = %s
            """
            cursor.execute(medical_query, (patient_id,))
            medical_data = cursor.fetchone()
            
            # Get recent diagnoses
            diagnoses_query = """
                SELECT 
                    t.diagnosis,
                    ts.available_date as diagnosis_date,
                    u.full_name as doctor_name
                FROM treatment t
                JOIN appointment a ON t.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u ON d.doctor_id = u.user_id
                WHERE a.patient_id = %s
                AND t.diagnosis IS NOT NULL
                ORDER BY ts.available_date DESC
                LIMIT 5
            """
            cursor.execute(diagnoses_query, (patient_id,))
            recent_diagnoses = cursor.fetchall()
            
            logger.info(f"Retrieved medical summary for patient {patient_id}")
            
            return {
                "patient_id": patient_id,
                "blood_group": medical_data['blood_group'],
                "allergies": medical_data['allergies'],
                "chronic_conditions": medical_data['chronic_conditions'],
                "current_medications": medical_data['current_medications'],
                "recent_diagnoses": recent_diagnoses or []
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching medical summary for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )