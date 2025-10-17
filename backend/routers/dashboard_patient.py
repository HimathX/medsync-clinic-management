from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List
from datetime import date, datetime, timedelta
from pydantic import BaseModel, Field
from core.database import get_db
import logging

router = APIRouter(prefix="/patients", tags=["patient-dashboard"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class AllergyInfo(BaseModel):
    allergy: str
    severity: Optional[str] = None
    reaction: Optional[str] = None

class ChronicConditionInfo(BaseModel):
    condition: str
    diagnosed_date: Optional[date] = None
    status: str = "Active"  # Active, Controlled, Resolved

class RecentConsultation(BaseModel):
    consultation_id: str
    appointment_id: str
    consultation_date: date
    doctor_name: str
    specialty: str
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    notes: Optional[str] = None

class ActivePrescription(BaseModel):
    prescription_id: str
    prescription_date: date
    doctor_name: str
    medications: List[dict]
    duration_days: Optional[int] = None
    is_active: bool = True

class VitalSigns(BaseModel):
    blood_pressure: Optional[str] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    bmi: Optional[float] = None
    recorded_date: Optional[date] = None

class LabResult(BaseModel):
    result_id: str
    test_name: str
    result_date: date
    result_value: str
    normal_range: Optional[str] = None
    status: str  # Normal, Abnormal, Critical
    doctor_name: str

class MedicalSummaryResponse(BaseModel):
    patient_id: str
    patient_name: str
    age: int
    gender: str
    blood_group: Optional[str] = None
    allergies: List[str]
    chronic_conditions: List[str]
    current_medications: List[str]
    recent_consultations: List[RecentConsultation]
    active_prescriptions: List[ActivePrescription]
    recent_lab_results: List[LabResult]
    latest_vitals: Optional[VitalSigns] = None
    medical_alerts: List[str]
    last_visit_date: Optional[date] = None
    next_appointment_date: Optional[date] = None

# ============================================
# ENDPOINTS
# ============================================

@router.get("/{patient_id}/medical-summary", status_code=status.HTTP_200_OK)
def get_patient_medical_summary(
    patient_id: str,
    include_consultations: bool = Query(True, description="Include recent consultations"),
    include_prescriptions: bool = Query(True, description="Include active prescriptions"),
    include_lab_results: bool = Query(True, description="Include recent lab results"),
    consultations_limit: int = Query(5, ge=1, le=20, description="Number of recent consultations"),
    prescriptions_limit: int = Query(3, ge=1, le=10, description="Number of active prescriptions"),
    lab_results_limit: int = Query(5, ge=1, le=20, description="Number of recent lab results")
):
    """
    Get comprehensive medical summary for a patient
    
    Returns a complete view of:
    - Patient demographics and basic info
    - Allergies and chronic conditions
    - Recent consultations with diagnoses
    - Active prescriptions and medications
    - Recent lab results
    - Latest vital signs
    - Medical alerts and warnings
    - Upcoming appointments
    
    **Use cases:**
    - Patient dashboard overview
    - Doctor consultation preparation
    - Medical history review
    - Emergency information access
    """
    try:
        logger.info(f"Fetching comprehensive medical summary for patient {patient_id}")
        
        with get_db() as (cursor, connection):
            # ============================================
            # 1. GET PATIENT BASIC INFO
            # ============================================
            patient_query = """
                SELECT 
                    p.patient_id,
                    u.full_name,
                    u.gender,
                    u.DOB,
                    p.blood_group,
                    p.allergies,
                    p.chronic_conditions,
                    NULL as current_medications,
                    b.branch_name as registered_branch
                FROM patient p
                JOIN user u ON p.patient_id = u.user_id
                LEFT JOIN branch b ON p.registered_branch_id = b.branch_id
                WHERE p.patient_id = %s
            """
            cursor.execute(patient_query, (patient_id,))
            patient = cursor.fetchone()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            # Calculate age
            today = date.today()
            dob = patient['DOB']
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            
            # Parse allergies, conditions, and medications
            allergies = [a.strip() for a in patient['allergies'].split(',') if a.strip()] if patient['allergies'] else []
            chronic_conditions = [c.strip() for c in patient['chronic_conditions'].split(',') if c.strip()] if patient['chronic_conditions'] else []
            current_medications = [m.strip() for m in patient['current_medications'].split(',') if m.strip()] if patient['current_medications'] else []
            
            # ============================================
            # 2. GET RECENT CONSULTATIONS
            # ============================================
            recent_consultations = []
            if include_consultations:
                consultations_query = """
                    SELECT 
                        cr.consultation_rec_id as consultation_id,
                        cr.appointment_id,
                        cr.created_at as consultation_date,
                        u.full_name as doctor_name,
                        GROUP_CONCAT(DISTINCT s.specialization_title SEPARATOR ', ') as specialty,
                        cr.diagnoses as diagnosis,
                        cr.symptoms
                    FROM consultation_record cr
                    JOIN appointment a ON cr.appointment_id = a.appointment_id
                    JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                    JOIN doctor d ON ts.doctor_id = d.doctor_id
                    JOIN user u ON d.doctor_id = u.user_id
                    LEFT JOIN doctor_specialization ds ON d.doctor_id = ds.doctor_id
                    LEFT JOIN specialization s ON ds.specialization_id = s.specialization_id
                    WHERE a.patient_id = %s
                    GROUP BY cr.consultation_rec_id, cr.appointment_id, cr.created_at, 
                             u.full_name, cr.diagnoses, cr.symptoms
                    ORDER BY cr.created_at DESC
                    LIMIT %s
                """
                cursor.execute(consultations_query, (patient_id, consultations_limit))
                recent_consultations = cursor.fetchall()
            
            # ============================================
            # 3. GET ACTIVE PRESCRIPTIONS
            # ============================================
            active_prescriptions = []
            if include_prescriptions:
                prescriptions_query = """
                    SELECT DISTINCT
                        cr.consultation_rec_id,
                        cr.created_at as prescription_date,
                        u.full_name as doctor_name,
                        DATEDIFF(CURDATE(), cr.created_at) as days_since_prescribed
                    FROM consultation_record cr
                    JOIN prescription_item pi ON cr.consultation_rec_id = pi.consultation_rec_id
                    JOIN appointment a ON cr.appointment_id = a.appointment_id
                    JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                    JOIN doctor d ON ts.doctor_id = d.doctor_id
                    JOIN user u ON d.doctor_id = u.user_id
                    WHERE a.patient_id = %s
                    AND DATEDIFF(CURDATE(), cr.created_at) <= 90
                    ORDER BY cr.created_at DESC
                    LIMIT %s
                """
                cursor.execute(prescriptions_query, (patient_id, prescriptions_limit))
                prescriptions = cursor.fetchall()
                
                # Get medications for each prescription
                for rx in prescriptions:
                    medications_query = """
                        SELECT 
                            m.generic_name,
                            m.manufacturer,
                            m.form,
                            pi.dosage,
                            pi.frequency,
                            pi.duration_days as duration
                        FROM prescription_item pi
                        JOIN medication m ON pi.medication_id = m.medication_id
                        WHERE pi.consultation_rec_id = %s
                    """
                    cursor.execute(medications_query, (rx['consultation_rec_id'],))
                    medications = cursor.fetchall()
                    
                    active_prescriptions.append({
                        'prescription_id': str(rx['consultation_rec_id']),
                        'prescription_date': rx['prescription_date'],
                        'doctor_name': rx['doctor_name'],
                        'medications': medications,
                        'days_since_prescribed': rx['days_since_prescribed'],
                        'is_active': rx['days_since_prescribed'] <= 30
                    })

            # ============================================
            # 4. GET RECENT LAB RESULTS
            # ============================================
            # Note: lab_result table doesn't exist in schema
            recent_lab_results = []

            # ============================================
            # 5. GET LATEST VITAL SIGNS
            # ============================================
            # Note: consultation_record table doesn't have vitals columns
            # Set to None for now
            latest_vitals = None
            
            # ============================================
            # 6. GET LAST VISIT AND NEXT APPOINTMENT
            # ============================================
            last_visit_query = """
                SELECT MAX(ts.available_date) as last_visit
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE a.patient_id = %s
                AND a.status = 'Completed'
            """
            cursor.execute(last_visit_query, (patient_id,))
            last_visit_result = cursor.fetchone()
            last_visit_date = last_visit_result['last_visit'] if last_visit_result else None
            
            next_appointment_query = """
                SELECT MIN(ts.available_date) as next_appointment
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE a.patient_id = %s
                AND a.status = 'Scheduled'
                AND ts.available_date >= CURDATE()
            """
            cursor.execute(next_appointment_query, (patient_id,))
            next_appointment_result = cursor.fetchone()
            next_appointment_date = next_appointment_result['next_appointment'] if next_appointment_result else None
            
            # ============================================
            # 7. GENERATE MEDICAL ALERTS
            # ============================================
            medical_alerts = []
            
            # Alert for critical allergies
            critical_allergies = ['penicillin', 'aspirin', 'sulfa', 'latex']
            for allergy in allergies:
                if any(crit in allergy.lower() for crit in critical_allergies):
                    medical_alerts.append(f"⚠️ CRITICAL ALLERGY: {allergy}")
            
            # Alert for chronic conditions
            if chronic_conditions:
                medical_alerts.append(f"📋 {len(chronic_conditions)} chronic condition(s) on record")
            
            # Alert for abnormal recent lab results
            abnormal_labs = [lab for lab in recent_lab_results if lab.get('status') in ['Abnormal', 'Critical']]
            if abnormal_labs:
                medical_alerts.append(f"⚕️ {len(abnormal_labs)} abnormal lab result(s) - review recommended")
            
            # Alert for no recent visit
            if last_visit_date:
                days_since_visit = (today - last_visit_date).days
                if days_since_visit > 365:
                    medical_alerts.append(f"📅 Last visit was {days_since_visit} days ago - checkup recommended")
            
            # Alert for multiple active prescriptions
            if len(active_prescriptions) > 3:
                medical_alerts.append(f"💊 {len(active_prescriptions)} active prescriptions - review for interactions")
            
            # ============================================
            # 8. BUILD RESPONSE
            # ============================================
            logger.info(f"Successfully compiled medical summary for patient {patient_id}")
            
            return {
                "patient_id": patient_id,
                "patient_name": patient['full_name'],
                "age": age,
                "gender": patient['gender'],
                "blood_group": patient['blood_group'],
                "registered_branch": patient['registered_branch'],
                "allergies": allergies,
                "chronic_conditions": chronic_conditions,
                "current_medications": current_medications,
                "recent_consultations": recent_consultations,
                "active_prescriptions": active_prescriptions,
                "recent_lab_results": recent_lab_results,
                "latest_vitals": latest_vitals,
                "medical_alerts": medical_alerts,
                "last_visit_date": str(last_visit_date) if last_visit_date else None,
                "next_appointment_date": str(next_appointment_date) if next_appointment_date else None,
                "summary_generated_at": datetime.now().isoformat(),
                "data_completeness": {
                    "has_allergies": len(allergies) > 0,
                    "has_chronic_conditions": len(chronic_conditions) > 0,
                    "has_current_medications": len(current_medications) > 0,
                    "has_recent_consultations": len(recent_consultations) > 0,
                    "has_active_prescriptions": len(active_prescriptions) > 0,
                    "has_recent_labs": len(recent_lab_results) > 0,
                    "has_vitals": latest_vitals is not None
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching medical summary for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

