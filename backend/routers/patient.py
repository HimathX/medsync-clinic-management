from fastapi import APIRouter, HTTPException, status
from typing import List, Optional, Dict, Any
from core.database import get_db
from schemas import PatientRegistrationRequest, PatientRegistrationResponse
import hashlib
import logging
from datetime import datetime, date

router = APIRouter(tags=["patients"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Password hashing helper
def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(plain_password) == hashed_password


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=PatientRegistrationResponse)
def register_patient(patient_data: PatientRegistrationRequest):
    """Register a new patient using stored procedure"""
    connection = None
    cursor = None
    
    try:
        # Log incoming data (excluding password)
        logger.info(f"Registration attempt for email: {patient_data.email}, NIC: {patient_data.NIC}")
        
        # Get database connection
        with get_db() as (cursor, connection):
            # Hash the password
            password_hash = hash_password(patient_data.password)
            logger.info(f"Password hash length: {len(password_hash)}")
            
            # Set session variables for OUT parameters BEFORE calling procedure
            cursor.execute("SET @p_user_id = NULL")
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure with only IN parameters
            call_sql = """
                CALL RegisterPatient(
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    @p_user_id, @p_error_message, @p_success
                )
            """
            
            args = (
                patient_data.address_line1,           # 1 IN
                patient_data.address_line2 or '',     # 2 IN
                patient_data.city,                    # 3 IN
                patient_data.province,                # 4 IN
                patient_data.postal_code,             # 5 IN
                patient_data.country or 'Sri Lanka',  # 6 IN
                patient_data.contact_num1,            # 7 IN
                patient_data.contact_num2 or '',      # 8 IN (handle None)
                patient_data.full_name,               # 9 IN
                patient_data.NIC,                     # 10 IN
                patient_data.email,                   # 11 IN
                patient_data.gender,                  # 12 IN
                patient_data.DOB,                     # 13 IN
                password_hash,                        # 14 IN
                patient_data.blood_group,             # 15 IN
                patient_data.registered_branch_name,  # 16 IN
            )
            
            logger.info(f"Calling RegisterPatient procedure with branch: {patient_data.registered_branch_name}")
            
            # Call stored procedure
            try:
                cursor.execute(call_sql, args)
                logger.info("Stored procedure called successfully")
            except Exception as proc_error:
                logger.error(f"Error calling stored procedure: {str(proc_error)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Database procedure error: {str(proc_error)}"
                )
            
            # Get OUT parameters from session variables
            try:
                cursor.execute("SELECT @p_user_id as user_id, @p_error_message as error_message, @p_success as success")
                out_result = cursor.fetchone()
                
                if not out_result:
                    logger.error("No result returned from stored procedure")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="No response from database procedure"
                    )
                
                user_id = out_result.get('user_id')
                error_message = out_result.get('error_message')
                success = out_result.get('success')
                
                logger.info(f"Procedure result - Success: {success}, User ID: {user_id}, Error: {error_message}")
                
            except Exception as fetch_error:
                logger.error(f"Error fetching OUT parameters: {str(fetch_error)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error retrieving procedure results: {str(fetch_error)}"
                )
            
            # Check if registration was successful
            if success == 1 or success is True:
                logger.info(f"Patient registered successfully with ID: {user_id}")
                return PatientRegistrationResponse(
                    success=True,
                    message=error_message or "Patient registered successfully",
                    patient_id=user_id
                )
            else:
                logger.warning(f"Registration failed: {error_message}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_message or "Failed to register patient"
                )
                
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error during registration: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during registration: {str(e)}"
        )


@router.get("/", status_code=status.HTTP_200_OK)
def get_all_patients(skip: int = 0, limit: int = 100):
    """Get all patients with pagination and user information"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute("SELECT COUNT(*) as total FROM patient")
            result = cursor.fetchone()
            total = result['total'] if result else 0
            
            # Get patients with user information
            cursor.execute("""
                SELECT 
                    p.patient_id,
                    p.blood_group,
                    p.created_at,
                    u.full_name,
                    u.NIC,
                    u.email,
                    u.gender,
                    u.DOB,
                    c.contact_num1,
                    c.contact_num2,
                    b.branch_name
                FROM patient p
                JOIN user u ON p.patient_id = u.user_id
                LEFT JOIN contact c ON u.contact_id = c.contact_id
                LEFT JOIN branch b ON p.registered_branch_id = b.branch_id
                ORDER BY p.created_at DESC
                LIMIT %s OFFSET %s
            """, (limit, skip))
            patients = cursor.fetchall()
            
            return {
                "total": total,
                "patients": patients or []
            }
    except Exception as e:
        logger.error(f"Error fetching patients: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{patient_id}", status_code=status.HTTP_200_OK)
def get_patient_by_id(patient_id: str):
    """Get patient by ID"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute("SELECT * FROM patient WHERE patient_id = %s", (patient_id,))
            patient = cursor.fetchone()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            cursor.execute("SELECT * FROM user WHERE user_id = %s", (patient_id,))
            user = cursor.fetchone()
            
            return {
                "patient": patient,
                "user": user
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{patient_id}/allergies", status_code=status.HTTP_200_OK)
def get_patient_allergies(patient_id: str):
    """Get all allergies for a patient"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute("SELECT * FROM patient WHERE patient_id = %s", (patient_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            cursor.execute(
                """SELECT * FROM patient_allergy 
                   WHERE patient_id = %s AND is_active = TRUE""",
                (patient_id,)
            )
            allergies = cursor.fetchall()
            
            return {
                "patient_id": patient_id,
                "allergies": allergies or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching allergies for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{patient_id}/appointments", status_code=status.HTTP_200_OK)
def get_patient_appointments(patient_id: str):
    """Get all appointments for a patient"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute("SELECT * FROM patient WHERE patient_id = %s", (patient_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            cursor.execute(
                "SELECT * FROM appointment WHERE patient_id = %s",
                (patient_id,)
            )
            appointments = cursor.fetchall()
            
            return {
                "patient_id": patient_id,
                "appointments": appointments or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching appointments for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/search/by-nic/{nic}", status_code=status.HTTP_200_OK)
def search_patient_by_nic(nic: str):
    """Search patient by NIC"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute(
                "SELECT * FROM user WHERE NIC = %s AND user_type = 'patient'",
                (nic,)
            )
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with NIC {nic} not found"
                )
            
            cursor.execute(
                "SELECT * FROM patient WHERE patient_id = %s",
                (user['user_id'],)
            )
            patient = cursor.fetchone()
            
            return {
                "user": user,
                "patient": patient
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching patient by NIC {nic}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/metrics/statistics", status_code=status.HTTP_200_OK)
def get_patient_metrics():
    """Get comprehensive patient statistics and metrics"""
    try:
        with get_db() as (cursor, connection):
            metrics = {}
            
            # Total patients
            cursor.execute("SELECT COUNT(*) as total FROM patient")
            metrics['total_patients'] = cursor.fetchone()['total']
            
            # Patients by gender
            cursor.execute("""
                SELECT u.gender, COUNT(*) as count 
                FROM patient p 
                JOIN user u ON p.patient_id = u.user_id 
                GROUP BY u.gender
            """)
            metrics['by_gender'] = cursor.fetchall()
            
            # Patients by blood group
            cursor.execute("""
                SELECT blood_group, COUNT(*) as count 
                FROM patient 
                GROUP BY blood_group 
                ORDER BY count DESC
            """)
            metrics['by_blood_group'] = cursor.fetchall()
            
            # Patients by branch
            cursor.execute("""
                SELECT b.branch_name, COUNT(*) as count 
                FROM patient p 
                JOIN branch b ON p.registered_branch_id = b.branch_id 
                GROUP BY b.branch_name
            """)
            metrics['by_branch'] = cursor.fetchall()
            
            # Age distribution (approximate)
            cursor.execute("""
                SELECT 
                    CASE 
                        WHEN TIMESTAMPDIFF(YEAR, u.DOB, CURDATE()) < 18 THEN 'Under 18'
                        WHEN TIMESTAMPDIFF(YEAR, u.DOB, CURDATE()) BETWEEN 18 AND 30 THEN '18-30'
                        WHEN TIMESTAMPDIFF(YEAR, u.DOB, CURDATE()) BETWEEN 31 AND 50 THEN '31-50'
                        WHEN TIMESTAMPDIFF(YEAR, u.DOB, CURDATE()) BETWEEN 51 AND 70 THEN '51-70'
                        ELSE 'Over 70'
                    END as age_group,
                    COUNT(*) as count
                FROM patient p
                JOIN user u ON p.patient_id = u.user_id
                GROUP BY age_group
                ORDER BY age_group
            """)
            metrics['by_age_group'] = cursor.fetchall()
            
            # Recent registrations (last 30 days)
            cursor.execute("""
                SELECT COUNT(*) as count 
                FROM patient 
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            """)
            metrics['new_patients_last_30_days'] = cursor.fetchone()['count']
            
            # Patients with active appointments
            cursor.execute("""
                SELECT COUNT(DISTINCT patient_id) as count 
                FROM appointment 
                WHERE status IN ('Scheduled', 'Pending')
            """)
            metrics['patients_with_active_appointments'] = cursor.fetchone()['count']
            
            # Patients with allergies
            cursor.execute("""
                SELECT COUNT(DISTINCT patient_id) as count 
                FROM patient_allergy 
                WHERE is_active = TRUE
            """)
            metrics['patients_with_allergies'] = cursor.fetchone()['count']
            
            logger.info("Patient metrics retrieved successfully")
            return metrics
            
    except Exception as e:
        logger.error(f"Error fetching patient metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/all/detailed", status_code=status.HTTP_200_OK)
def get_all_patients_detailed(skip: int = 0, limit: int = 50):
    """Get all patients with detailed information including user data, appointments count, and allergies count"""
    try:
        with get_db() as (cursor, connection):
            # Get total count
            cursor.execute("SELECT COUNT(*) as total FROM patient")
            total = cursor.fetchone()['total']
            
            # Get detailed patient information with proper GROUP BY
            cursor.execute("""
                SELECT 
                    p.patient_id,
                    p.blood_group,
                    p.created_at as registered_date,
                    u.full_name,
                    u.NIC,
                    u.email,
                    u.gender,
                    u.DOB,
                    TIMESTAMPDIFF(YEAR, u.DOB, CURDATE()) as age,
                    c.contact_num1,
                    c.contact_num2,
                    COALESCE(b.branch_name, 'Unknown') as registered_branch,
                    COUNT(DISTINCT a.appointment_id) as total_appointments,
                    COUNT(DISTINCT CASE WHEN pa.is_active = TRUE THEN pa.patient_allergy_id END) as total_allergies
                FROM patient p
                JOIN user u ON p.patient_id = u.user_id
                LEFT JOIN contact c ON u.contact_id = c.contact_id
                LEFT JOIN branch b ON p.registered_branch_id = b.branch_id
                LEFT JOIN appointment a ON p.patient_id = a.patient_id
                LEFT JOIN patient_allergy pa ON p.patient_id = pa.patient_id
                GROUP BY p.patient_id, p.blood_group, p.created_at, 
                         u.user_id, u.full_name, u.NIC, u.email, u.gender, u.DOB, 
                         c.contact_id, c.contact_num1, c.contact_num2,
                         b.branch_id, b.branch_name
                ORDER BY p.created_at DESC
                LIMIT %s OFFSET %s
            """, (limit, skip))
            
            patients = cursor.fetchall()
            
            logger.info(f"Retrieved {len(patients)} detailed patient records")
            
            return {
                "total": total,
                "count": len(patients),
                "skip": skip,
                "limit": limit,
                "patients": patients or []
            }
            
    except Exception as e:
        logger.error(f"Error fetching detailed patients: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{patient_id}/complete", status_code=status.HTTP_200_OK)
def get_complete_patient_profile(patient_id: str):
    """Get complete patient profile with all related information"""
    try:
        with get_db() as (cursor, connection):
            # 1. Basic patient and user information
            cursor.execute("""
                SELECT 
                    p.*,
                    u.full_name,
                    u.NIC,
                    u.email,
                    u.gender,
                    u.DOB,
                    TIMESTAMPDIFF(YEAR, u.DOB, CURDATE()) as age,
                    c.contact_num1,
                    c.contact_num2,
                    b.branch_name as registered_branch,
                    CONCAT(ba.address_line1, ', ', ba.city, ', ', ba.province) as branch_address,
                    bc.contact_num1 as branch_contact
                FROM patient p
                JOIN user u ON p.patient_id = u.user_id
                JOIN contact c ON u.contact_id = c.contact_id
                LEFT JOIN branch b ON p.registered_branch_id = b.branch_id
                LEFT JOIN address ba ON b.address_id = ba.address_id
                LEFT JOIN contact bc ON b.contact_id = bc.contact_id
                WHERE p.patient_id = %s
            """, (patient_id,))
            
            patient_info = cursor.fetchone()
            
            if not patient_info:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            # 2. Get all appointments with details
            cursor.execute("""
                SELECT 
                    a.*,
                    ts.available_date as appointment_date,
                    ts.start_time,
                    ts.end_time,
                    du.full_name as doctor_name,
                    GROUP_CONCAT(s.specialization_title SEPARATOR ', ') as specialization,
                    b.branch_name
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user du ON d.doctor_id = du.user_id
                JOIN employee e ON d.doctor_id = e.employee_id
                JOIN branch b ON e.branch_id = b.branch_id
                LEFT JOIN doctor_specialization ds ON d.doctor_id = ds.doctor_id
                LEFT JOIN specialization s ON ds.specialization_id = s.specialization_id
                WHERE a.patient_id = %s
                GROUP BY a.appointment_id, ts.available_date, ts.start_time, ts.end_time, du.full_name, b.branch_name
                ORDER BY ts.available_date DESC, ts.start_time DESC
            """, (patient_id,))
            appointments = cursor.fetchall()
            
            # 3. Get all allergies
            cursor.execute("""
                SELECT * FROM patient_allergy 
                WHERE patient_id = %s
                ORDER BY allergy_name
            """, (patient_id,))
            allergies = cursor.fetchall()
            
            # 4. Get all consultations with treatment details
            cursor.execute("""
                SELECT 
                    cr.*,
                    du.full_name as doctor_name,
                    GROUP_CONCAT(s.specialization_title SEPARATOR ', ') as specialization,
                    a.time_slot_id,
                    ts.available_date as consultation_date
                FROM consultation_record cr
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user du ON d.doctor_id = du.user_id
                LEFT JOIN doctor_specialization ds ON d.doctor_id = ds.doctor_id
                LEFT JOIN specialization s ON ds.specialization_id = s.specialization_id
                WHERE a.patient_id = %s
                GROUP BY cr.consultation_rec_id, du.full_name, a.time_slot_id, ts.available_date
                ORDER BY ts.available_date DESC
            """, (patient_id,))
            consultations = cursor.fetchall()
            
            # 5. Get prescriptions
            cursor.execute("""
                SELECT 
                    pi.*,
                    m.generic_name,
                    m.manufacturer,
                    m.form,
                    du.full_name as doctor_name,
                    cr.diagnoses
                FROM prescription_item pi
                JOIN medication m ON pi.medication_id = m.medication_id
                JOIN consultation_record cr ON pi.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user du ON d.doctor_id = du.user_id
                WHERE a.patient_id = %s
                ORDER BY pi.created_at DESC
            """, (patient_id,))
            prescriptions = cursor.fetchall()
            
            # 6. Get invoices and billing
            cursor.execute("""
                SELECT 
                    i.*,
                    a.patient_id
                FROM invoice i
                JOIN consultation_record cr ON i.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                WHERE a.patient_id = %s
                ORDER BY i.created_at DESC
            """, (patient_id,))
            invoices = cursor.fetchall()
            
            # 7. Get payments
            cursor.execute("""
                SELECT * FROM payment
                WHERE patient_id = %s
                ORDER BY payment_date DESC
            """, (patient_id,))
            payments = cursor.fetchall()
            
            # 8. Calculate statistics
            stats = {
                "total_appointments": len(appointments),
                "total_consultations": len(consultations),
                "total_prescriptions": len(prescriptions),
                "total_allergies": len(allergies),
                "total_invoices": len(invoices),
                "total_payments": len(payments),
                "pending_appointments": len([a for a in appointments if a.get('status') in ['Scheduled', 'Pending']]),
                "completed_appointments": len([a for a in appointments if a.get('status') == 'Completed']),
            }
            
            # Calculate total amount paid and outstanding
            total_paid = sum(float(p.get('amount_paid', 0)) for p in payments)
            total_invoiced = sum(float(i.get('sub_total', 0)) + float(i.get('tax_amount', 0)) for i in invoices)
            stats['total_amount_paid'] = float(total_paid)
            stats['total_amount_invoiced'] = float(total_invoiced)
            stats['outstanding_balance'] = float(total_invoiced - total_paid)
            
            logger.info(f"Retrieved complete profile for patient {patient_id}")
            
            return {
                "patient_info": patient_info,
                "appointments": appointments or [],
                "allergies": allergies or [],
                "consultations": consultations or [],
                "prescriptions": prescriptions or [],
                "invoices": invoices or [],
                "payments": payments or [],
                "statistics": stats
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching complete patient profile {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )