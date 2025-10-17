from fastapi import APIRouter, HTTPException, status, UploadFile, File
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
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
    registration_date: datetime  # CHANGED: datetime instead of date

# ============================================
# ENDPOINTS
# ============================================

@router.get("/{patient_id}/profile", status_code=status.HTTP_200_OK, response_model=PatientProfileResponse)
def get_patient_profile(patient_id: str):
    """Get complete patient profile information"""
    try:
        with get_db() as (cursor, connection):
            # FIXED: Changed p.registered_branch to p.registered_branch_id in the JOIN
            query = """
                SELECT 
                    p.patient_id,
                    u.full_name,
                    u.email,
                    u.NIC,
                    u.gender,
                    u.DOB,
                    p.blood_group,
                    c.contact_num1,
                    c.contact_num2,
                    a.address_line1,
                    a.address_line2,
                    a.city,
                    a.province,
                    a.postal_code,
                    a.country,
                    NULL as emergency_contact_name,
                    NULL as emergency_contact_relationship,
                    NULL as emergency_contact_phone,
                    p.allergies,
                    p.chronic_conditions,
                    NULL as current_medications,
                    NULL as insurance_provider,
                    NULL as insurance_policy_number,
                    b.branch_name as registered_branch,
                    p.created_at as registration_date
                FROM patient p
                JOIN user u ON p.patient_id = u.user_id
                JOIN contact c ON u.contact_id = c.contact_id
                JOIN address a ON u.address_id = a.address_id
                JOIN branch b ON p.registered_branch_id = b.branch_id
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
            
            # Get user's contact_id and address_id
            cursor.execute("""
                SELECT contact_id, address_id 
                FROM user 
                WHERE user_id = %s
            """, (patient_id,))
            user_info = cursor.fetchone()
            
            if not user_info:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User information not found for patient {patient_id}"
                )
            
            # Update contact table
            contact_updates = []
            contact_values = []
            
            if profile_data.contact_num1 is not None:
                contact_updates.append("contact_num1 = %s")
                contact_values.append(profile_data.contact_num1)
            
            if profile_data.contact_num2 is not None:
                contact_updates.append("contact_num2 = %s")
                contact_values.append(profile_data.contact_num2)
            
            if contact_updates:
                contact_values.append(user_info['contact_id'])
                contact_query = f"UPDATE contact SET {', '.join(contact_updates)} WHERE contact_id = %s"
                cursor.execute(contact_query, contact_values)
            
            # Update address table
            address_updates = []
            address_values = []
            
            address_fields = ['address_line1', 'address_line2', 'city', 'province', 'postal_code', 'country']
            for field in address_fields:
                value = getattr(profile_data, field, None)
                if value is not None:
                    address_updates.append(f"{field} = %s")
                    address_values.append(value)
            
            if address_updates:
                address_values.append(user_info['address_id'])
                address_query = f"UPDATE address SET {', '.join(address_updates)} WHERE address_id = %s"
                cursor.execute(address_query, address_values)
            
            # Update patient table
            patient_updates = []
            patient_values = []
            
            patient_fields = ['allergies', 'chronic_conditions']
            
            for field in patient_fields:
                value = getattr(profile_data, field, None)
                if value is not None:
                    patient_updates.append(f"{field} = %s")
                    patient_values.append(value)
            
            if patient_updates:
                patient_values.append(patient_id)
                patient_query = f"UPDATE patient SET {', '.join(patient_updates)} WHERE patient_id = %s"
                cursor.execute(patient_query, patient_values)
            
            # Update user table
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
        connection.rollback()
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
            
            # FIXED: Get prescription count from prescription_item through consultation_record
            prescription_count = """
                SELECT COUNT(DISTINCT pi.consultation_rec_id) as prescription_count
                FROM prescription_item pi
                JOIN consultation_record cr ON pi.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                WHERE a.patient_id = %s
            """
            cursor.execute(prescription_count, (patient_id,))
            rx_count = cursor.fetchone()
            
            # FIXED: Lab results don't exist in schema - set to 0
            lab_count_value = 0
            
            logger.info(f"Retrieved statistics for patient {patient_id}")
            
            return {
                "patient_id": patient_id,
                "total_appointments": int(appt_stats['total_appointments']) if appt_stats['total_appointments'] else 0,
                "upcoming_appointments": int(appt_stats['upcoming']) if appt_stats['upcoming'] else 0,
                "completed_appointments": int(appt_stats['completed']) if appt_stats['completed'] else 0,
                "last_visit": str(appt_stats['last_visit']) if appt_stats['last_visit'] else None,
                "prescriptions": int(rx_count['prescription_count']) if rx_count['prescription_count'] else 0,
                "lab_results": lab_count_value
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching statistics for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
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
                    p.allergies,
                    p.chronic_conditions,
                    p.blood_group
                FROM patient p
                WHERE p.patient_id = %s
            """
            cursor.execute(medical_query, (patient_id,))
            medical_data = cursor.fetchone()
            
            diagnoses_query = """
                SELECT 
                    cr.diagnoses as diagnosis,
                    cr.created_at as diagnosis_date,
                    u.full_name as doctor_name
                FROM consultation_record cr
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u ON d.doctor_id = u.user_id
                WHERE a.patient_id = %s
                ORDER BY cr.created_at DESC
                LIMIT 5
            """
            cursor.execute(diagnoses_query, (patient_id,))
            recent_diagnoses = cursor.fetchall()
            
            # Get patient allergies from patient_allergy table
            allergies_query = """
                SELECT 
                    allergy_name,
                    severity,
                    reaction_description,
                    diagnosed_date
                FROM patient_allergy
                WHERE patient_id = %s
                AND is_active = TRUE
                ORDER BY diagnosed_date DESC
            """
            cursor.execute(allergies_query, (patient_id,))
            detailed_allergies = cursor.fetchall()
            
            # Get patient conditions from patient_condition table
            conditions_query = """
                SELECT 
                    c.condition_name,
                    pc.diagnosed_date,
                    pc.is_chronic,
                    pc.current_status,
                    pc.notes,
                    cc.category_name
                FROM patient_condition pc
                JOIN conditions c ON pc.condition_id = c.condition_id
                JOIN conditions_category cc ON c.condition_category_id = cc.condition_category_id
                WHERE pc.patient_id = %s
                ORDER BY pc.diagnosed_date DESC
            """
            cursor.execute(conditions_query, (patient_id,))
            detailed_conditions = cursor.fetchall()
            
            logger.info(f"Retrieved medical summary for patient {patient_id}")
            
            return {
                "patient_id": patient_id,
                "blood_group": medical_data['blood_group'] if medical_data else None,
                "allergies": medical_data['allergies'] if medical_data else None,
                "chronic_conditions": medical_data['chronic_conditions'] if medical_data else None,
                "detailed_allergies": detailed_allergies or [],
                "detailed_conditions": detailed_conditions or [],
                "current_medications": None,
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