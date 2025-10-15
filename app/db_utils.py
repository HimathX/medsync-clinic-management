"""
Database utility functions and wrappers for stored procedures and functions
Provides secure access to database operations with SQL injection protection
"""

from typing import Optional, Dict, Any, List, Tuple
from datetime import date, datetime
import uuid
import logging
from .database import execute_query, execute_stored_procedure, execute_function

logger = logging.getLogger(__name__)

# ============================================
# DATABASE FUNCTION WRAPPERS
# ============================================

def calculate_age(dob: date) -> int:
    """Calculate patient age using database function"""
    return execute_function('CalculateAge', dob) or 0

def calculate_discount(base_amount: float, discount_percentage: float) -> float:
    """Calculate discount amount using database function"""
    return execute_function('CalculateDiscount', base_amount, discount_percentage) or 0.0

def calculate_insurance_coverage(bill_amount: float, copayment_percentage: float) -> float:
    """Calculate insurance coverage using database function"""
    return execute_function('CalculateInsuranceCoverage', bill_amount, copayment_percentage) or 0.0

def is_valid_email(email: str) -> bool:
    """Validate email format using database function"""
    result = execute_function('IsValidEmail', email)
    return bool(result)

def is_doctor_available(doctor_id: str, check_date: date, check_time: str) -> bool:
    """Check doctor availability using database function"""
    result = execute_function('IsDoctorAvailable', doctor_id, check_date, check_time)
    return bool(result)

def is_insurance_active(patient_id: str) -> bool:
    """Check if patient has active insurance using database function"""
    result = execute_function('IsInsuranceActive', patient_id)
    return bool(result)

def get_patient_name(patient_id: str) -> str:
    """Get patient full name using database function"""
    return execute_function('GetPatientName', patient_id) or 'Unknown'

def get_branch_name(branch_id: str) -> str:
    """Get branch name using database function"""
    return execute_function('GetBranchName', branch_id) or 'Unknown'

def count_patient_appointments(patient_id: str, status: Optional[str] = None) -> int:
    """Count patient appointments using database function"""
    return execute_function('CountPatientAppointments', patient_id, status) or 0

def generate_invoice_number(branch_id: str) -> str:
    """Generate invoice number using database function"""
    return execute_function('GenerateInvoiceNumber', branch_id) or ''

def get_consultation_duration(consultation_id: str) -> int:
    """Get consultation duration in minutes using database function"""
    return execute_function('GetConsultationDuration', consultation_id) or 0

# ============================================
# STORED PROCEDURE WRAPPERS
# ============================================

def register_patient(
    # Address data
    address_line1: str,
    city: str,
    province: str,
    postal_code: str,
    # Contact data
    contact_num1: str,
    # User data
    full_name: str,
    nic: str,
    email: str,
    gender: str,
    dob: date,
    password_hash: str,
    # Patient data
    blood_group: str,
    registered_branch_name: str,
    # Optional parameters
    address_line2: Optional[str] = None,
    country: str = 'Sri Lanka',
    contact_num2: Optional[str] = None
) -> Dict[str, Any]:
    """Register new patient using stored procedure"""
    
    # Prepare arguments for stored procedure
    args = [
        address_line1, address_line2, city, province, postal_code, country,
        contact_num1, contact_num2,
        full_name, nic, email, gender, dob, password_hash,
        blood_group, registered_branch_name,
        None, None, None  # OUT parameters: user_id, error_message, success
    ]
    
    try:
        print(f"🏥 DB_UTILS: Calling RegisterPatient with args: {args}")
        results, output = execute_stored_procedure('RegisterPatient', args)
        print(f"🏥 DB_UTILS: RegisterPatient results: {results}")
        print(f"🏥 DB_UTILS: RegisterPatient output: {output}")
        
        # Parse output parameters from the stored procedure
        # The output comes as a dictionary with parameter names
        if isinstance(output, dict):
            # Extract values from named parameters
            user_id = output.get('RegisterPatient_arg17')  # p_user_id (OUT)
            error_message = output.get('RegisterPatient_arg18')  # p_error_message (OUT) 
            success = output.get('RegisterPatient_arg19')  # p_success (OUT)
        else:
            # Fallback for list format (if needed)
            if not output or len(output) < 3:
                print(f"❌ DB_UTILS: RegisterPatient returned unexpected output: {output}")
                return {
                    'success': False,
                    'user_id': None,
                    'error_message': f'Stored procedure returned unexpected output: {output}',
                    'results': results
                }
            success = output[-1]
            user_id = output[-3] 
            error_message = output[-2]
        
        print(f"📋 DB_UTILS: Parsed output - success: {success}, user_id: {user_id}, error_message: {error_message}")
        
        # Convert success to boolean (stored procedure returns 1 for success, 0 for failure)
        success_bool = bool(success) and success != 0
        
        return {
            'success': success_bool,
            'user_id': user_id,
            'error_message': error_message,
            'results': results
        }
    except Exception as e:
        print(f"❌ DB_UTILS: Error registering patient: {e}")
        return {
            'success': False,
            'user_id': None,
            'error_message': str(e),
            'results': []
        }

def register_employee(
    # Address data
    address_line1: str,
    city: str,
    province: str,
    postal_code: str,
    # Contact data
    contact_num1: str,
    # User data
    full_name: str,
    nic: str,
    email: str,
    gender: str,
    dob: date,
    password_hash: str,
    # Employee data
    branch_name: str,
    role: str,
    salary: float,
    joined_date: date,
    # Optional parameters
    address_line2: Optional[str] = None,
    country: str = 'Sri Lanka',
    contact_num2: Optional[str] = None
) -> Dict[str, Any]:
    """Register new employee using stored procedure"""
    
    args = [
        address_line1, address_line2, city, province, postal_code, country,
        contact_num1, contact_num2,
        full_name, nic, email, gender, dob, password_hash,
        branch_name, role, salary, joined_date,
        None, None, None  # OUT parameters
    ]
    
    try:
        results, output = execute_stored_procedure('RegisterEmployee', args)
        
        return {
            'success': output[-1] if len(output) >= 3 else False,
            'user_id': output[-3] if len(output) >= 3 else None,
            'error_message': output[-2] if len(output) >= 3 else 'Unknown error',
            'results': results
        }
    except Exception as e:
        logger.error(f"Error registering employee: {e}")
        return {
            'success': False,
            'user_id': None,
            'error_message': str(e),
            'results': []
        }

def register_doctor(
    # Address data
    address_line1: str,
    city: str,
    province: str,
    postal_code: str,
    # Contact data
    contact_num1: str,
    # User data
    full_name: str,
    nic: str,
    email: str,
    gender: str,
    dob: date,
    password_hash: str,
    # Employee data
    branch_name: str,
    salary: float,
    joined_date: date,
    # Doctor data
    medical_licence_no: str,
    consultation_fee: float,
    # Optional parameters
    address_line2: Optional[str] = None,
    country: str = 'Sri Lanka',
    contact_num2: Optional[str] = None,
    room_no: Optional[str] = None,
    specialization_ids: List[str] = None
) -> Dict[str, Any]:
    """Register new doctor using stored procedure"""
    
    print(f"👨‍⚕️ DB_UTILS: Doctor registration started")
    print(f"👨‍⚕️ DB_UTILS: Doctor basic info - name: {full_name}, email: {email}, nic: {nic}")
    print(f"👨‍⚕️ DB_UTILS: Doctor employment - branch: {branch_name}, salary: {salary}, joined: {joined_date}")
    print(f"👨‍⚕️ DB_UTILS: Doctor medical - licence: {medical_licence_no}, fee: {consultation_fee}, room: {room_no}")
    print(f"👨‍⚕️ DB_UTILS: Doctor specializations: {specialization_ids}")
    
    # Convert specialization_ids to JSON string if provided
    specialization_json = None
    if specialization_ids:
        import json
        specialization_json = json.dumps(specialization_ids)
        print(f"👨‍⚕️ DB_UTILS: Specializations converted to JSON: {specialization_json}")
    else:
        print(f"👨‍⚕️ DB_UTILS: No specializations provided")
    
    # Prepare arguments for stored procedure
    args = [
        address_line1, address_line2, city, province, postal_code, country,
        contact_num1, contact_num2,
        full_name, nic, email, gender, dob, password_hash,
        branch_name, salary, joined_date,
        room_no, medical_licence_no, consultation_fee, specialization_json,
        None, None, None  # OUT parameters: user_id, error_message, success
    ]
    
    try:
        print(f"👨‍⚕️ DB_UTILS: Calling RegisterDoctor with args: {args}")
        results, output = execute_stored_procedure('RegisterDoctor', args)
        print(f"👨‍⚕️ DB_UTILS: RegisterDoctor results: {results}")
        print(f"👨‍⚕️ DB_UTILS: RegisterDoctor output: {output}")
        
        # Parse output parameters from the stored procedure
        # The output comes as a dictionary with parameter names
        if isinstance(output, dict):
            # Extract values from named parameters (corrected indices based on actual output)
            user_id = output.get('RegisterDoctor_arg22')  # p_user_id (OUT) - actual user_id
            success_message = output.get('RegisterDoctor_arg23')  # p_message (OUT) - success message
            success_flag = output.get('RegisterDoctor_arg24')  # p_success (OUT) - success flag
            
            # Set error_message based on success
            error_message = None if success_flag else success_message
        else:
            # Fallback for list format (if needed)
            if not output or len(output) < 3:
                print(f"❌ DB_UTILS: RegisterDoctor returned unexpected output: {output}")
                return {
                    'success': False,
                    'user_id': None,
                    'error_message': f'Stored procedure returned unexpected output: {output}',
                    'results': results
                }
            success_flag = output[-1]
            user_id = output[-3] 
            error_message = output[-2]
        
        print(f"📋 DB_UTILS: Parsed output - success_flag: {success_flag}, user_id: {user_id}, success_message: {success_message}, error_message: {error_message}")
        
        # Convert success to boolean (stored procedure returns 1 for success, 0 for failure)
        success_bool = bool(success_flag) and success_flag != 0
        
        return {
            'success': success_bool,
            'user_id': user_id,
            'error_message': error_message,
            'results': results
        }
    except Exception as e:
        print(f"❌ DB_UTILS: Error registering doctor: {e}")
        return {
            'success': False,
            'user_id': None,
            'error_message': str(e),
            'results': []
        }

def book_appointment(
    patient_id: str,
    time_slot_id: str,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """Book appointment using stored procedure"""
    
    args = [patient_id, time_slot_id, notes, None, None, None]  # OUT parameters
    
    try:
        results, output = execute_stored_procedure('BookAppointment', args)
        
        return {
            'success': output[-1] if len(output) >= 3 else False,
            'appointment_id': output[-3] if len(output) >= 3 else None,
            'error_message': output[-2] if len(output) >= 3 else 'Unknown error',
            'results': results
        }
    except Exception as e:
        logger.error(f"Error booking appointment: {e}")
        return {
            'success': False,
            'appointment_id': None,
            'error_message': str(e),
            'results': []
        }

def add_patient_allergy(
    patient_id: str,
    allergy_name: str,
    severity: str = 'Mild',
    reaction_description: Optional[str] = None,
    diagnosed_date: Optional[date] = None
) -> Dict[str, Any]:
    """Add patient allergy using stored procedure"""
    
    args = [patient_id, allergy_name, severity, reaction_description, diagnosed_date, None, None, None]
    
    try:
        results, output = execute_stored_procedure('AddPatientAllergy', args)
        
        return {
            'success': output[-1] if len(output) >= 3 else False,
            'allergy_id': output[-3] if len(output) >= 3 else None,
            'error_message': output[-2] if len(output) >= 3 else 'Unknown error',
            'results': results
        }
    except Exception as e:
        logger.error(f"Error adding patient allergy: {e}")
        return {
            'success': False,
            'allergy_id': None,
            'error_message': str(e),
            'results': []
        }

def add_patient_condition(
    patient_id: str,
    condition_id: str,
    diagnosed_date: date,
    is_chronic: bool = False,
    current_status: str = 'Active',
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """Add patient condition using stored procedure"""
    
    args = [patient_id, condition_id, diagnosed_date, is_chronic, current_status, notes, None, None, None]
    
    try:
        results, output = execute_stored_procedure('AddPatientCondition', args)
        
        return {
            'success': output[-1] if len(output) >= 3 else False,
            'condition_id': output[-3] if len(output) >= 3 else None,
            'error_message': output[-2] if len(output) >= 3 else 'Unknown error',
            'results': results
        }
    except Exception as e:
        logger.error(f"Error adding patient condition: {e}")
        return {
            'success': False,
            'condition_id': None,
            'error_message': str(e),
            'results': []
        }

def add_time_slot(
    doctor_id: str,
    branch_id: str,
    available_date: date,
    start_time: str,
    end_time: str
) -> Dict[str, Any]:
    """Add time slot using stored procedure"""
    
    args = [doctor_id, branch_id, available_date, start_time, end_time, None, None, None]
    
    try:
        results, output = execute_stored_procedure('AddTimeSlot', args)
        
        return {
            'success': output[-1] if len(output) >= 3 else False,
            'slot_id': output[-3] if len(output) >= 3 else None,
            'error_message': output[-2] if len(output) >= 3 else 'Unknown error',
            'results': results
        }
    except Exception as e:
        logger.error(f"Error adding time slot: {e}")
        return {
            'success': False,
            'slot_id': None,
            'error_message': str(e),
            'results': []
        }

def add_consultation_record(
    appointment_id: str,
    symptoms: str,
    diagnoses: str,
    follow_up_required: bool = False,
    follow_up_date: Optional[date] = None
) -> Dict[str, Any]:
    """Add consultation record using stored procedure"""
    
    args = [appointment_id, symptoms, diagnoses, follow_up_required, follow_up_date, None, None, None]
    
    try:
        results, output = execute_stored_procedure('AddConsultationRecord', args)
        
        return {
            'success': output[-1] if len(output) >= 3 else False,
            'consultation_id': output[-3] if len(output) >= 3 else None,
            'error_message': output[-2] if len(output) >= 3 else 'Unknown error',
            'results': results
        }
    except Exception as e:
        logger.error(f"Error adding consultation record: {e}")
        return {
            'success': False,
            'consultation_id': None,
            'error_message': str(e),
            'results': []
        }

def add_prescription_item(
    consultation_rec_id: str,
    medication_id: str,
    dosage: str,
    frequency: str,
    duration_days: int,
    instructions: Optional[str] = None
) -> Dict[str, Any]:
    """Add prescription item using stored procedure"""
    
    args = [consultation_rec_id, medication_id, dosage, frequency, duration_days, instructions, None, None, None]
    
    try:
        results, output = execute_stored_procedure('AddPrescriptionItem', args)
        
        return {
            'success': output[-1] if len(output) >= 3 else False,
            'prescription_id': output[-3] if len(output) >= 3 else None,
            'error_message': output[-2] if len(output) >= 3 else 'Unknown error',
            'results': results
        }
    except Exception as e:
        logger.error(f"Error adding prescription item: {e}")
        return {
            'success': False,
            'prescription_id': None,
            'error_message': str(e),
            'results': []
        }

def add_treatment(
    consultation_rec_id: str,
    treatment_service_code: str,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """Add treatment using stored procedure"""
    
    args = [consultation_rec_id, treatment_service_code, notes, None, None, None]
    
    try:
        results, output = execute_stored_procedure('AddTreatment', args)
        
        return {
            'success': output[-1] if len(output) >= 3 else False,
            'treatment_id': output[-3] if len(output) >= 3 else None,
            'error_message': output[-2] if len(output) >= 3 else 'Unknown error',
            'results': results
        }
    except Exception as e:
        logger.error(f"Error adding treatment: {e}")
        return {
            'success': False,
            'treatment_id': None,
            'error_message': str(e),
            'results': []
        }

# ============================================
# COMMON QUERY FUNCTIONS
# ============================================

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    query = "SELECT * FROM User WHERE email = %s"
    return execute_query(query, (email,), fetch='one')

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    query = "SELECT * FROM User WHERE user_id = %s"
    return execute_query(query, (user_id,), fetch='one')

def get_patient_by_user_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get patient by user ID"""
    query = """
    SELECT p.*, u.full_name, u.email, u.NIC, u.gender, u.DOB, 
           a.address_line1, a.address_line2, a.city, a.province, a.postal_code,
           c.contact_num1, c.contact_num2,
           b.branch_name
    FROM patient p
    JOIN user u ON p.user_id = u.user_id
    LEFT JOIN address a ON u.address_id = a.address_id
    LEFT JOIN contact c ON u.contact_id = c.contact_id
    LEFT JOIN branch b ON p.registered_branch_id = b.branch_id
    WHERE p.user_id = %s
    """
    return execute_query(query, (user_id,), fetch='one')

def get_employee_by_user_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get employee by user ID"""
    query = """
    SELECT e.*, u.full_name, u.email, u.NIC, u.gender, u.DOB,
           b.branch_name
    FROM employee e
    JOIN user u ON e.employee_id = u.user_id
    JOIN branch b ON e.branch_id = b.branch_id
    WHERE e.employee_id = %s AND e.is_active = TRUE
    """
    return execute_query(query, (user_id,), fetch='one')

def get_doctor_by_user_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get doctor by user ID"""
    query = """
    SELECT d.*, e.role, e.salary, e.branch_id,
           u.full_name, u.email,
           b.branch_name
    FROM doctor d
    JOIN employee e ON d.doctor_id = e.employee_id
    JOIN user u ON e.employee_id = u.user_id
    JOIN branch b ON e.branch_id = b.branch_id
    WHERE d.doctor_id = %s AND e.is_active = TRUE
    """
    return execute_query(query, (user_id,), fetch='one')

def get_branches() -> List[Dict[str, Any]]:
    """Get all active branches"""
    query = """
    SELECT b.*, a.address_line1, a.address_line2, a.city, a.province,
           c.contact_num1, c.contact_num2
    FROM branch b
    LEFT JOIN address a ON b.address_id = a.address_id
    LEFT JOIN contact c ON b.contact_id = c.contact_id
    WHERE b.is_active = TRUE
    ORDER BY b.branch_name
    """
    return execute_query(query, fetch='all')

def get_specializations() -> List[Dict[str, Any]]:
    """Get all specializations"""
    query = "SELECT * FROM specialization ORDER BY specialization_title"
    return execute_query(query, fetch='all')

def get_medications(search: Optional[str] = None, form: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get medications with optional filtering"""
    query = "SELECT * FROM medication WHERE 1=1"
    params = []
    
    if search:
        query += " AND (generic_name LIKE %s OR manufacturer LIKE %s)"
        search_term = f"%{search}%"
        params.extend([search_term, search_term])
    
    if form:
        query += " AND form = %s"
        params.append(form)
    
    query += " ORDER BY generic_name"
    
    return execute_query(query, tuple(params) if params else None, fetch='all')

def create_session(user_id: str, token: str, expires_at: datetime) -> str:
    """Create new session"""
    session_id = str(uuid.uuid4())
    query = """
    INSERT INTO Session (session_id, user_id, token, expires_at, is_active)
    VALUES (%s, %s, %s, %s, TRUE)
    """
    print(f"💾 DB_UTILS: Creating session: user_id={user_id}, session_id={session_id}, token={token[:20]}...")
    print(f"💾 DB_UTILS: Query: {query}")
    print(f"💾 DB_UTILS: Parameters: session_id={session_id}, user_id={user_id}, token={token[:20]}..., expires_at={expires_at}")
    
    try:
        result = execute_query(query, (session_id, user_id, token, expires_at))
        print(f"💾 DB_UTILS: Session insert result: {result}")
        print(f"✅ DB_UTILS: Session created successfully: {session_id}")
        return session_id
    except Exception as e:
        print(f"❌ DB_UTILS: Error creating session: {e}")
        raise

def get_active_session(token: str) -> Optional[Dict[str, Any]]:
    """Get active session by token"""
    # Use UTC_TIMESTAMP() to match Python's UTC time
    query = """
    SELECT * FROM Session 
    WHERE token = %s AND is_active = TRUE AND expires_at > UTC_TIMESTAMP()
    """
    print(f"🔍 DB_UTILS: Looking up session for token: {token[:20]}...")
    print(f"🔍 DB_UTILS: Query: {query}")
    print(f"🔍 DB_UTILS: Token parameter: {token[:20]}...")
    
    try:
        result = execute_query(query, (token,), fetch='one')
        print(f"🔍 DB_UTILS: Session lookup result: {result is not None}")
        
        if result:
            print(f"✅ DB_UTILS: Found session: session_id={result.get('session_id')}, user_id={result.get('user_id')}, expires_at={result.get('expires_at')}, is_active={result.get('is_active')}")
        else:
            print(f"❌ DB_UTILS: No session found for token {token[:20]}...")
            # Let's also check if there are ANY sessions in the table
            count_query = "SELECT COUNT(*) as count FROM Session"
            count_result = execute_query(count_query, fetch='one')
            print(f"📊 DB_UTILS: Total sessions in table: {count_result.get('count') if count_result else 'ERROR'}")
            
            # Check current database time vs session expiry
            time_query = "SELECT NOW() as db_local_time, UTC_TIMESTAMP() as db_utc_time"
            time_result = execute_query(time_query, fetch='one')
            if time_result:
                print(f"⏰ DB_UTILS: Database local time: {time_result.get('db_local_time')}")
                print(f"⏰ DB_UTILS: Database UTC time: {time_result.get('db_utc_time')}")
            else:
                print("❌ DB_UTILS: Failed to get database time")
            
            # Check if there are sessions for this token but inactive/expired
            check_query = "SELECT session_id, is_active, expires_at, (expires_at > UTC_TIMESTAMP()) as is_valid_utc FROM Session WHERE token = %s"
            check_result = execute_query(check_query, (token,), fetch='one')
            if check_result:
                print(f"⚠️ DB_UTILS: Found session but inactive/expired: {check_result}")
            else:
                print(f"❌ DB_UTILS: No session found at all for this token")
        
        return result
    except Exception as e:
        print(f"❌ DB_UTILS: Error looking up session: {e}")
        raise

def invalidate_session(token: str) -> bool:
    """Invalidate session"""
    query = "UPDATE Session SET is_active = FALSE WHERE token = %s"
    rows_affected = execute_query(query, (token,))
    return rows_affected > 0

def add_doctor_specialization(
    doctor_id: str, 
    specialization_id: str, 
    certification_date: Optional[date] = None
) -> Dict[str, Any]:
    """Add specialization to doctor"""
    try:
        # Check if association already exists
        existing_query = """
        SELECT 1 FROM doctor_specialization 
        WHERE doctor_id = %s AND specialization_id = %s
        """
        existing = execute_query(existing_query, (doctor_id, specialization_id), fetch='one')
        
        if existing:
            return {
                'success': False,
                'error_message': 'Doctor already has this specialization',
                'results': []
            }
        
        # Insert new doctor specialization
        insert_query = """
        INSERT INTO doctor_specialization (doctor_id, specialization_id, certification_date)
        VALUES (%s, %s, %s)
        """
        
        execute_query(insert_query, (doctor_id, specialization_id, certification_date))
        
        return {
            'success': True,
            'doctor_id': doctor_id,
            'specialization_id': specialization_id,
            'results': []
        }
        
    except Exception as e:
        logger.error(f"Error adding doctor specialization: {e}")
        return {
            'success': False,
            'error_message': str(e),
            'results': []
        }

def get_all_patients(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """Get all patients with pagination"""
    try:
        query = """
        SELECT 
            p.patient_id, 
            u.full_name, 
            u.email, 
            u.nic, 
            u.gender, 
            u.dob, 
            p.blood_group,
            u.contact_num1,
            u.contact_num2,
            u.created_at,
            u.is_active
        FROM Patient p
        JOIN User u ON p.user_id = u.user_id
        ORDER BY u.created_at DESC
        LIMIT %s OFFSET %s
        """
        print(f"📋 DB_UTILS: Getting patients with skip={skip}, limit={limit}")
        print(f"📋 DB_UTILS: Query: {query}")
        result = execute_query(query, (limit, skip), fetch='all') or []
        print(f"📋 DB_UTILS: Found {len(result)} patients")
        return result
    except Exception as e:
        print(f"❌ DB_UTILS: Error getting patients: {e}")
        return []