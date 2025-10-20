from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import List, Optional
from core.database import get_db
from core.auth import get_current_user, hash_password
from schemas import PatientRegistrationRequest, PatientRegistrationResponse
import logging

router = APIRouter(
    prefix="/api/patients",
    tags=["Patients"]
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================
# AUTHORIZATION HELPERS
# ============================================

def require_roles(allowed_roles: list[str]):
    """
    Dependency to check if user has required role
    
    Args:
        allowed_roles: List of allowed roles (e.g., ['admin', 'receptionist'])
    
    Returns:
        Dependency function
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        print(f"\n🔐 [AUTH] Role check for patient operation:")
        print(f"   User: {current_user.get('email')}")
        print(f"   User Type: {current_user.get('user_type')}")
        print(f"   User Role: {current_user.get('role')}")
        print(f"   Required Roles: {allowed_roles}")
        
        user_role = current_user.get('role')
        user_type = current_user.get('user_type')
        
        # Admin always has access
        if user_type == 'employee' and user_role == 'admin':
            print(f"   ✅ Access granted (admin)")
            return current_user
        
        # Check if user has required role
        if user_type == 'employee' and user_role in allowed_roles:
            print(f"   ✅ Access granted ({user_role})")
            return current_user
        
        print(f"   ❌ Access denied")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required roles: {', '.join(allowed_roles)}"
        )
    
    return role_checker


def require_patient_or_staff(required_staff_roles: list[str] = None):
    """
    Dependency to check if user is the patient themselves or authorized staff
    
    Args:
        required_staff_roles: List of staff roles that can access (default: all staff)
    
    Returns:
        Dependency function that also returns patient_id to check
    """
    async def patient_or_staff_checker(
        patient_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        print(f"\n🔐 [AUTH] Patient data access check:")
        print(f"   Target Patient ID: {patient_id}")
        print(f"   Current User: {current_user.get('email')}")
        print(f"   User Type: {current_user.get('user_type')}")
        
        user_type = current_user.get('user_type')
        user_id = current_user.get('user_id')
        user_role = current_user.get('role')
        
        # Check if user is the patient themselves
        if user_type == 'patient' and user_id == patient_id:
            print(f"   ✅ Access granted (own data)")
            return current_user
        
        # Check if user is authorized staff
        if user_type == 'employee':
            # Admin always has access
            if user_role == 'admin':
                print(f"   ✅ Access granted (admin)")
                return current_user
            
            # Check if staff role is in allowed list
            if required_staff_roles is None or user_role in required_staff_roles:
                print(f"   ✅ Access granted (staff: {user_role})")
                return current_user
        
        print(f"   ❌ Access denied")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this patient's data"
        )
    
    return patient_or_staff_checker


# ============================================
# PATIENT REGISTRATION - RECEPTIONIST/ADMIN ONLY
# ============================================

@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=PatientRegistrationResponse,
    summary="Register New Patient",
    description="Register a new patient (Receptionist/Admin only)"
)
async def register_patient(
    patient_data: PatientRegistrationRequest,
    current_user: dict = Depends(require_roles(['admin', 'receptionist']))
):
    """
    Register a new patient using stored procedure
    
    **Required Role:** Admin or Receptionist
    
    **Process:**
    - Creates user account
    - Creates patient record
    - Links to registered branch
    
    **Authentication:** Bearer token required
    """
    logger.info(f"Patient registration initiated by {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Hash the password
            password_hash = hash_password(patient_data.password)
            
            print(f"\n📋 Patient Registration Data:")
            print(f"   Name: {patient_data.full_name}")
            print(f"   Email: {patient_data.email}")
            print(f"   NIC: {patient_data.NIC}")
            print(f"   Branch: {patient_data.registered_branch_name}")
            print(f"   Registered by: {current_user.get('email')}")
            
            # Set session variables for OUT parameters
            cursor.execute("SET @p_user_id = NULL")
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure
            call_sql = """
                CALL RegisterPatient(
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    @p_user_id, @p_error_message, @p_success
                )
            """
            
            cursor.execute(call_sql, (
                patient_data.address_line1,
                patient_data.address_line2 or '',
                patient_data.city,
                patient_data.province,
                patient_data.postal_code,
                patient_data.country or 'Sri Lanka',
                patient_data.contact_num1,
                patient_data.contact_num2 or '',
                patient_data.full_name,
                patient_data.NIC,
                patient_data.email,
                patient_data.gender,
                patient_data.DOB,
                password_hash,
                patient_data.blood_group,
                patient_data.registered_branch_name
            ))
            
            # Get OUT parameters
            cursor.execute("""
                SELECT 
                    @p_user_id as user_id,
                    @p_error_message as error_message,
                    @p_success as success
            """)
            result = cursor.fetchone()
            
            user_id = result['user_id']
            error_message = result['error_message']
            success = result['success']
            
            if success == 1 or success is True:
                logger.info(f"✅ Patient registered by {current_user.get('email')}: {user_id}")
                return PatientRegistrationResponse(
                    success=True,
                    message=error_message or "Patient registered successfully",
                    patient_id=user_id
                )
            else:
                error_msg = error_message or "Failed to register patient"
                logger.error(f"❌ Patient registration failed: {error_msg}")
                
                # Determine appropriate status code
                if "already registered" in error_msg.lower():
                    status_code = status.HTTP_409_CONFLICT
                elif "not found" in error_msg.lower():
                    status_code = status.HTTP_404_NOT_FOUND
                else:
                    status_code = status.HTTP_400_BAD_REQUEST
                
                raise HTTPException(
                    status_code=status_code,
                    detail=error_msg
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during registration: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during registration: {str(e)}"
        )


# ============================================
# GET ALL PATIENTS - STAFF ONLY
# ============================================

@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="Get All Patients",
    description="Get all patients with pagination (Staff only)"
)
async def get_all_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(require_roles(['admin', 'manager', 'doctor', 'nurse', 'receptionist']))
):
    """
    Get all patients with pagination
    
    **Required Role:** Admin, Manager, Doctor, Nurse, or Receptionist
    
    **Authentication:** Bearer token required
    """
    logger.info(f"Fetching patients - User: {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Get total count
            cursor.execute("SELECT COUNT(*) as total FROM patient")
            count_result = cursor.fetchone()
            total = count_result.get('total', 0) if count_result else 0
            
            # Get patients with user details
            cursor.execute("""
                SELECT 
                    p.*,
                    u.full_name,
                    u.email,
                    u.NIC,
                    u.gender,
                    u.DOB,
                    b.branch_name as registered_branch_name
                FROM patient p
                JOIN user u ON p.patient_id = u.user_id
                JOIN branch b ON p.registered_branch_id = b.branch_id
                ORDER BY u.created_at DESC
                LIMIT %s OFFSET %s
            """, (limit, skip))
            
            patients = cursor.fetchall()
            
            # Convert datetime objects to strings
            result_patients = []
            if patients:
                for patient in patients:
                    result_patient = dict(patient)
                    if 'DOB' in result_patient and result_patient['DOB']:
                        result_patient['DOB'] = str(result_patient['DOB'])
                    if 'created_at' in result_patient and result_patient['created_at']:
                        result_patient['created_at'] = str(result_patient['created_at'])
                    if 'updated_at' in result_patient and result_patient['updated_at']:
                        result_patient['updated_at'] = str(result_patient['updated_at'])
                    result_patients.append(result_patient)
            
            return {
                "success": True,
                "total": total,
                "count": len(result_patients),
                "skip": skip,
                "limit": limit,
                "patients": result_patients
            }
            
    except Exception as e:
        logger.error(f"Error fetching patients: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET PATIENT BY ID - PATIENT OR STAFF
# ============================================

@router.get(
    "/{patient_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Patient Details",
    description="Get patient details (Patient themselves or Staff)"
)
async def get_patient_by_id(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get patient by ID
    
    **Access:** 
    - Patient can view their own data
    - Staff (all roles) can view any patient
    
    **Authentication:** Bearer token required
    """
    # Check authorization
    user_type = current_user.get('user_type')
    user_id = current_user.get('user_id')
    
    if user_type == 'patient' and user_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own data"
        )
    
    logger.info(f"Fetching patient {patient_id} - User: {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Get patient with user details
            cursor.execute("""
                SELECT 
                    p.*,
                    u.full_name,
                    u.email,
                    u.NIC,
                    u.gender,
                    u.DOB,
                    u.created_at as user_created_at,
                    b.branch_name as registered_branch_name,
                    a.address_line1,
                    a.address_line2,
                    a.city,
                    a.province,
                    a.postal_code,
                    a.country,
                    c.contact_num1,
                    c.contact_num2
                FROM patient p
                JOIN user u ON p.patient_id = u.user_id
                JOIN branch b ON p.registered_branch_id = b.branch_id
                LEFT JOIN address a ON u.address_id = a.address_id
                LEFT JOIN contact c ON u.contact_id = c.contact_id
                WHERE p.patient_id = %s
            """, (patient_id,))
            
            patient = cursor.fetchone()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            # Convert to dict and handle datetime
            result = dict(patient)
            if 'DOB' in result and result['DOB']:
                result['DOB'] = str(result['DOB'])
            if 'created_at' in result and result['created_at']:
                result['created_at'] = str(result['created_at'])
            if 'updated_at' in result and result['updated_at']:
                result['updated_at'] = str(result['updated_at'])
            if 'user_created_at' in result and result['user_created_at']:
                result['user_created_at'] = str(result['user_created_at'])
            
            return {
                "success": True,
                "patient": result
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET PATIENT ALLERGIES - PATIENT OR MEDICAL STAFF
# ============================================

@router.get(
    "/{patient_id}/allergies",
    status_code=status.HTTP_200_OK,
    summary="Get Patient Allergies",
    description="Get patient allergies (Patient or Medical Staff)"
)
async def get_patient_allergies(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all allergies for a patient
    
    **Access:** 
    - Patient can view their own allergies
    - Medical staff (doctor, nurse) can view any patient's allergies
    - Receptionist can view for registration purposes
    
    **Authentication:** Bearer token required
    """
    user_type = current_user.get('user_type')
    user_id = current_user.get('user_id')
    user_role = current_user.get('role')
    
    # Authorization check
    if user_type == 'patient' and user_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own allergies"
        )
    
    if user_type == 'employee' and user_role not in ['admin', 'doctor', 'nurse', 'receptionist']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view patient allergies"
        )
    
    logger.info(f"Fetching allergies for patient {patient_id} - User: {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Verify patient exists
            cursor.execute("SELECT * FROM patient WHERE patient_id = %s", (patient_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            # Get allergies
            cursor.execute("""
                SELECT 
                    patient_allergy_id,
                    patient_id,
                    allergy_name,
                    severity,
                    reaction_description,
                    diagnosed_date,
                    created_at,
                    updated_at
                FROM patient_allergy 
                WHERE patient_id = %s
                ORDER BY severity DESC, diagnosed_date DESC
            """, (patient_id,))
            
            allergies = cursor.fetchall()
            
            # Convert datetime to string
            result_allergies = []
            if allergies:
                for allergy in allergies:
                    result_allergy = dict(allergy)
                    if 'diagnosed_date' in result_allergy and result_allergy['diagnosed_date']:
                        result_allergy['diagnosed_date'] = str(result_allergy['diagnosed_date'])
                    if 'created_at' in result_allergy and result_allergy['created_at']:
                        result_allergy['created_at'] = str(result_allergy['created_at'])
                    if 'updated_at' in result_allergy and result_allergy['updated_at']:
                        result_allergy['updated_at'] = str(result_allergy['updated_at'])
                    result_allergies.append(result_allergy)
            
            return {
                "success": True,
                "patient_id": patient_id,
                "total": len(result_allergies),
                "allergies": result_allergies
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching allergies for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET PATIENT APPOINTMENTS - PATIENT OR STAFF
# ============================================

@router.get(
    "/{patient_id}/appointments",
    status_code=status.HTTP_200_OK,
    summary="Get Patient Appointments",
    description="Get patient appointments (Patient or Staff)"
)
async def get_patient_appointments(
    patient_id: str,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all appointments for a patient
    
    **Access:** 
    - Patient can view their own appointments
    - Staff can view any patient's appointments
    
    **Authentication:** Bearer token required
    """
    user_type = current_user.get('user_type')
    user_id = current_user.get('user_id')
    
    if user_type == 'patient' and user_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own appointments"
        )
    
    logger.info(f"Fetching appointments for patient {patient_id} - User: {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Verify patient exists
            cursor.execute("SELECT * FROM patient WHERE patient_id = %s", (patient_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            # Build query
            query = """
                SELECT 
                    a.*,
                    ts.available_date,
                    ts.start_time,
                    ts.end_time,
                    u.full_name as doctor_name,
                    b.branch_name
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u ON d.doctor_id = u.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE a.patient_id = %s
            """
            
            params = [patient_id]
            
            if status_filter:
                query += " AND a.status = %s"
                params.append(status_filter)
            
            query += " ORDER BY ts.available_date DESC, ts.start_time DESC"
            
            cursor.execute(query, params)
            appointments = cursor.fetchall()
            
            # Convert datetime to string
            result_appointments = []
            if appointments:
                for appointment in appointments:
                    result_appt = dict(appointment)
                    if 'available_date' in result_appt and result_appt['available_date']:
                        result_appt['available_date'] = str(result_appt['available_date'])
                    if 'start_time' in result_appt and result_appt['start_time']:
                        result_appt['start_time'] = str(result_appt['start_time'])
                    if 'end_time' in result_appt and result_appt['end_time']:
                        result_appt['end_time'] = str(result_appt['end_time'])
                    if 'created_at' in result_appt and result_appt['created_at']:
                        result_appt['created_at'] = str(result_appt['created_at'])
                    if 'updated_at' in result_appt and result_appt['updated_at']:
                        result_appt['updated_at'] = str(result_appt['updated_at'])
                    result_appointments.append(result_appt)
            
            return {
                "success": True,
                "patient_id": patient_id,
                "total": len(result_appointments),
                "appointments": result_appointments
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching appointments for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# SEARCH PATIENT BY NIC - STAFF ONLY
# ============================================

@router.get(
    "/search/by-nic/{nic}",
    status_code=status.HTTP_200_OK,
    summary="Search Patient by NIC",
    description="Search patient by NIC (Staff only)"
)
async def search_patient_by_nic(
    nic: str,
    current_user: dict = Depends(require_roles(['admin', 'receptionist', 'doctor', 'nurse']))
):
    """
    Search patient by NIC
    
    **Required Role:** Admin, Receptionist, Doctor, or Nurse
    
    **Authentication:** Bearer token required
    """
    logger.info(f"Searching patient by NIC {nic} - User: {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            cursor.execute("""
                SELECT 
                    p.*,
                    u.full_name,
                    u.email,
                    u.NIC,
                    u.gender,
                    u.DOB,
                    b.branch_name as registered_branch_name
                FROM user u
                JOIN patient p ON u.user_id = p.patient_id
                JOIN branch b ON p.registered_branch_id = b.branch_id
                WHERE u.NIC = %s AND u.user_type = 'patient'
            """, (nic,))
            
            patient = cursor.fetchone()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with NIC {nic} not found"
                )
            
            # Convert to dict and handle datetime
            result = dict(patient)
            if 'DOB' in result and result['DOB']:
                result['DOB'] = str(result['DOB'])
            if 'created_at' in result and result['created_at']:
                result['created_at'] = str(result['created_at'])
            if 'updated_at' in result and result['updated_at']:
                result['updated_at'] = str(result['updated_at'])
            
            return {
                "success": True,
                "patient": result
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching patient by NIC {nic}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )