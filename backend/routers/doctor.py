from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import date
from decimal import Decimal
from core.database import get_db
from core.auth import get_current_user, hash_password  # ✅ Import auth functions
import json
import logging

router = APIRouter(
    prefix="/api/doctors",  # ✅ Add prefix
    tags=["doctor"]
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================
# AUTHORIZATION HELPERS
# ============================================

def require_roles(allowed_roles: List[str]):
    """
    Dependency to check if user has required role
    
    Args:
        allowed_roles: List of allowed roles (e.g., ['admin', 'manager', 'doctor'])
    
    Returns:
        Dependency function
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        print(f"\n🔐 [AUTH] Role check:")
        print(f"   User: {current_user.get('email')}")
        print(f"   User Type: {current_user.get('user_type')}")
        print(f"   User Role: {current_user.get('role')}")
        print(f"   Required Roles: {allowed_roles}")
        
        user_role = current_user.get('role')
        user_type = current_user.get('user_type')
        
        # Check if user has required role
        if user_type == 'employee' and user_role in allowed_roles:
            print(f"   ✅ Access granted")
            return current_user
        
        # Admin always has access
        if user_type == 'employee' and user_role == 'admin':
            print(f"   ✅ Access granted (admin)")
            return current_user
        
        print(f"   ❌ Access denied")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required roles: {', '.join(allowed_roles)}"
        )
    
    return role_checker


# ============================================
# PYDANTIC MODELS (Keep existing models)
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


class DoctorRegistrationResponse(BaseModel):
    success: bool
    message: str
    doctor_id: Optional[str] = None


class AddSpecializationRequest(BaseModel):
    specialization_id: str = Field(..., description="Specialization ID (UUID)")
    certification_date: date = Field(..., description="Date of certification (YYYY-MM-DD)")


class AddSpecializationResponse(BaseModel):
    success: bool
    message: str


class CreateSpecializationRequest(BaseModel):
    specialization_title: str = Field(..., max_length=50, description="Title of the specialization")
    other_details: Optional[str] = Field(None, description="Additional details about the specialization")


class CreateSpecializationResponse(BaseModel):
    success: bool
    message: str
    specialization_id: Optional[str] = None


# ============================================
# PROTECTED ENDPOINTS - ADMIN/MANAGER ONLY
# ============================================

@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=DoctorRegistrationResponse,
    summary="Register New Doctor",
    description="Register a new doctor (Admin/Manager only)"
)
async def register_doctor(
    doctor_data: DoctorRegistrationRequest,
    current_user: dict = Depends(require_roles(['admin', 'manager']))
):
    """
    Register a new doctor using stored procedure
    
    **Required Role:** Admin or Manager
    
    **Process:**
    - Creates user account
    - Creates employee record
    - Creates doctor record with medical licence
    - Associates specializations
    
    **Authentication:** Bearer token required
    """
    logger.info(f"Doctor registration initiated by {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Hash the password using SHA-256
            password_hash = hash_password(doctor_data.password)
            
            # Convert specialization IDs to JSON array
            specialization_json = json.dumps(doctor_data.specialization_ids) if doctor_data.specialization_ids else None
            
            print(f"\n📋 Doctor Registration Data:")
            print(f"   Name: {doctor_data.full_name}")
            print(f"   Email: {doctor_data.email}")
            print(f"   NIC: {doctor_data.NIC}")
            print(f"   Branch: {doctor_data.branch_name}")
            print(f"   Medical Licence: {doctor_data.medical_licence_no}")
            print(f"   Specializations: {doctor_data.specialization_ids}")
            
            # Set session variables for OUT parameters
            cursor.execute("SET @p_user_id = NULL")
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure
            call_sql = """
                CALL RegisterDoctor(
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    @p_user_id, @p_error_message, @p_success
                )
            """
            
            print(f"\n🔧 Calling RegisterDoctor stored procedure...")
            
            cursor.execute(call_sql, (
                doctor_data.address_line1,
                doctor_data.address_line2 or '',
                doctor_data.city,
                doctor_data.province,
                doctor_data.postal_code,
                doctor_data.country or 'Sri Lanka',
                doctor_data.contact_num1,
                doctor_data.contact_num2 or '',
                doctor_data.full_name,
                doctor_data.NIC,
                doctor_data.email,
                doctor_data.gender,
                doctor_data.DOB,
                password_hash,
                doctor_data.branch_name,
                float(doctor_data.salary),
                doctor_data.joined_date,
                doctor_data.room_no,
                doctor_data.medical_licence_no,
                float(doctor_data.consultation_fee),
                specialization_json
            ))
            
            # Get OUT parameters
            cursor.execute("SELECT @p_user_id as user_id, @p_error_message as error_message, @p_success as success")
            result = cursor.fetchone()
            
            user_id = result['user_id']
            error_message = result['error_message']
            success = result['success']
            
            print(f"\n📊 Stored Procedure Result:")
            print(f"   User ID: {user_id}")
            print(f"   Error Message: {error_message}")
            print(f"   Success: {success}")
            
            if success == 1 or success is True:
                logger.info(f"✅ Doctor registered successfully by {current_user.get('email')}: {user_id}")
                print(f"✅ Doctor registered successfully: {user_id}")
                
                return DoctorRegistrationResponse(
                    success=True,
                    message=error_message or "Doctor registered successfully",
                    doctor_id=user_id
                )
            else:
                # ✅ FIXED: Return proper error code based on error message
                error_msg = error_message or "Failed to register doctor"
                logger.error(f"❌ Doctor registration failed: {error_msg}")
                print(f"❌ Registration failed: {error_msg}")
                
                # Determine appropriate status code
                if "already registered" in error_msg.lower() or "already exists" in error_msg.lower():
                    status_code = status.HTTP_409_CONFLICT
                elif "not found" in error_msg.lower():
                    status_code = status.HTTP_404_NOT_FOUND
                elif "invalid" in error_msg.lower():
                    status_code = status.HTTP_400_BAD_REQUEST
                else:
                    status_code = status.HTTP_400_BAD_REQUEST
                
                raise HTTPException(
                    status_code=status_code,
                    detail=error_msg
                )
                
    except HTTPException:
        # ✅ Re-raise HTTPException without wrapping
        raise
    except Exception as e:
        # ✅ Only catch unexpected errors
        logger.error(f"Unexpected error during doctor registration: {str(e)}")
        print(f"\n❌ Unexpected Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during registration: {str(e)}"
        )


# ============================================
# PROTECTED ENDPOINTS - ALL AUTHENTICATED USERS
# ============================================

@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="Get All Doctors",
    description="Get list of all doctors with pagination"
)
async def get_all_doctors(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)  # ✅ Requires authentication
):
    """
    Get all doctors with pagination
    
    **Authentication:** Bearer token required
    
    **Parameters:**
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records (default: 100)
    """
    logger.info(f"Fetching doctors - User: {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Get total count
            cursor.execute("SELECT COUNT(*) as total FROM doctor")
            total_result = cursor.fetchone()
            total = total_result['total'] if total_result else 0
            
            # Get doctors with pagination
            cursor.execute(
                """SELECT 
                    d.doctor_id,
                    d.room_no,
                    d.medical_licence_no,
                    d.consultation_fee,
                    d.is_available,
                    u.full_name,
                    u.email,
                    u.gender,
                    e.branch_id,
                    e.is_active,
                    e.joined_date
                   FROM doctor d
                   JOIN employee e ON d.doctor_id = e.employee_id
                   JOIN user u ON d.doctor_id = u.user_id
                   WHERE e.is_active = TRUE
                   ORDER BY u.full_name
                   LIMIT %s OFFSET %s""",
                (limit, skip)
            )
            doctors = cursor.fetchall()
            
            return {
                "success": True,
                "total": total,
                "count": len(doctors),
                "skip": skip,
                "limit": limit,
                "doctors": doctors or []
            }
    except Exception as e:
        logger.error(f"Error fetching doctors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get(
    "/{doctor_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Doctor Details",
    description="Get detailed information about a specific doctor"
)
async def get_doctor_by_id(
    doctor_id: str,
    current_user: dict = Depends(get_current_user)  # ✅ Requires authentication
):
    """
    Get doctor details by ID
    
    **Authentication:** Bearer token required
    
    **Parameters:**
    - **doctor_id**: UUID of the doctor
    """
    logger.info(f"Fetching doctor {doctor_id} - User: {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Get doctor details
            cursor.execute(
                """SELECT 
                    d.*,
                    e.branch_id,
                    e.salary,
                    e.joined_date,
                    e.is_active,
                    u.full_name,
                    u.email,
                    u.NIC,
                    u.gender,
                    u.DOB,
                    u.contact_id,
                    u.address_id
                   FROM doctor d
                   JOIN employee e ON d.doctor_id = e.employee_id
                   JOIN user u ON d.doctor_id = u.user_id
                   WHERE d.doctor_id = %s""",
                (doctor_id,)
            )
            doctor = cursor.fetchone()
            
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            # Get specializations
            cursor.execute(
                """SELECT s.*, ds.certification_date
                   FROM specialization s
                   JOIN doctor_specialization ds ON s.specialization_id = ds.specialization_id
                   WHERE ds.doctor_id = %s
                   ORDER BY s.specialization_title""",
                (doctor_id,)
            )
            specializations = cursor.fetchall()
            
            return {
                "success": True,
                "doctor": doctor,
                "specializations": specializations or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get(
    "/{doctor_id}/time-slots",
    status_code=status.HTTP_200_OK,
    summary="Get Doctor Time Slots",
    description="Get all time slots for a specific doctor"
)
async def get_doctor_time_slots(
    doctor_id: str,
    available_only: bool = True,
    current_user: dict = Depends(get_current_user)  # ✅ Requires authentication
):
    """
    Get all time slots for a doctor
    
    **Authentication:** Bearer token required
    
    **Parameters:**
    - **doctor_id**: UUID of the doctor
    - **available_only**: Filter only available slots (default: true)
    """
    try:
        with get_db() as (cursor, connection):
            # Check if doctor exists
            cursor.execute("SELECT doctor_id FROM doctor WHERE doctor_id = %s", (doctor_id,))
            doctor = cursor.fetchone()
            
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            # Build query
            query = """
                SELECT 
                    time_slot_id,
                    doctor_id,
                    branch_id,
                    available_date,
                    start_time,
                    end_time,
                    is_booked
                FROM time_slot 
                WHERE doctor_id = %s
            """
            params = [doctor_id]
            
            if available_only:
                query += " AND is_booked = FALSE AND available_date >= CURDATE()"
            
            query += " ORDER BY available_date, start_time"
            
            cursor.execute(query, params)
            time_slots = cursor.fetchall()
            
            return {
                "success": True,
                "doctor_id": doctor_id,
                "total": len(time_slots),
                "time_slots": time_slots or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching time slots for doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get(
    "/specialization/{specialization_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Doctors by Specialization",
    description="Get all doctors with a specific specialization"
)
async def get_doctors_by_specialization(
    specialization_id: str,
    current_user: dict = Depends(get_current_user)  # ✅ Requires authentication
):
    """
    Get all doctors with a specific specialization
    
    **Authentication:** Bearer token required
    
    **Parameters:**
    - **specialization_id**: UUID of the specialization
    """
    try:
        with get_db() as (cursor, connection):
            # Check if specialization exists
            cursor.execute(
                "SELECT * FROM specialization WHERE specialization_id = %s",
                (specialization_id,)
            )
            specialization = cursor.fetchone()
            
            if not specialization:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Specialization with ID {specialization_id} not found"
                )
            
            # Get doctors with this specialization
            cursor.execute(
                """SELECT 
                    d.doctor_id,
                    d.room_no,
                    d.consultation_fee,
                    d.is_available,
                    u.full_name,
                    u.email,
                    e.branch_id,
                    e.is_active,
                    ds.certification_date
                   FROM doctor d
                   JOIN employee e ON d.doctor_id = e.employee_id
                   JOIN user u ON d.doctor_id = u.user_id
                   JOIN doctor_specialization ds ON d.doctor_id = ds.doctor_id
                   WHERE ds.specialization_id = %s AND e.is_active = TRUE
                   ORDER BY u.full_name""",
                (specialization_id,)
            )
            doctors = cursor.fetchall()
            
            return {
                "success": True,
                "specialization": specialization,
                "total": len(doctors),
                "doctors": doctors or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching doctors by specialization {specialization_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# SPECIALIZATION MANAGEMENT - ADMIN/MANAGER
# ============================================

@router.post(
    "/{doctor_id}/specializations",
    status_code=status.HTTP_201_CREATED,
    response_model=AddSpecializationResponse,
    summary="Add Doctor Specialization",
    description="Add a new specialization to a doctor (Admin/Manager only)"
)
async def add_doctor_specialization(
    doctor_id: str,
    specialization_data: AddSpecializationRequest,
    current_user: dict = Depends(require_roles(['admin', 'manager']))
):
    """
    Add a new specialization to a doctor
    
    **Required Role:** Admin or Manager
    
    **Process:**
    - Validates doctor and specialization exist
    - Checks for duplicates
    - Associates specialization with certification date
    
    **Authentication:** Bearer token required
    """
    logger.info(f"Adding specialization to doctor {doctor_id} by {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Set session variables for OUT parameters
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure
            call_sql = """
                CALL AddDoctorSpecialization(
                    %s, %s, %s,
                    @p_error_message, @p_success
                )
            """
            
            cursor.execute(call_sql, (
                doctor_id,
                specialization_data.specialization_id,
                specialization_data.certification_date
            ))
            
            # Get OUT parameters
            cursor.execute("SELECT @p_error_message as error_message, @p_success as success")
            result = cursor.fetchone()
            
            error_message = result['error_message']
            success = result['success']
            
            if success == 1 or success is True:
                logger.info(f"✅ Specialization added to doctor {doctor_id}")
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
        raise
    except Exception as e:
        logger.error(f"Error adding specialization to doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while adding specialization: {str(e)}"
        )


@router.get(
    "/{doctor_id}/specializations",
    status_code=status.HTTP_200_OK,
    summary="Get Doctor Specializations",
    description="Get all specializations for a specific doctor"
)
async def get_doctor_specializations(
    doctor_id: str,
    current_user: dict = Depends(get_current_user)  # ✅ Requires authentication
):
    """
    Get all specializations for a specific doctor
    
    **Authentication:** Bearer token required
    """
    try:
        with get_db() as (cursor, connection):
            # Check if doctor exists
            cursor.execute("SELECT doctor_id FROM doctor WHERE doctor_id = %s", (doctor_id,))
            doctor = cursor.fetchone()
            
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            # Get specializations with certification dates
            cursor.execute(
                """SELECT s.*, ds.certification_date
                   FROM specialization s
                   JOIN doctor_specialization ds ON s.specialization_id = ds.specialization_id
                   WHERE ds.doctor_id = %s
                   ORDER BY s.specialization_title""",
                (doctor_id,)
            )
            specializations = cursor.fetchall()
            
            return {
                "success": True,
                "doctor_id": doctor_id,
                "total": len(specializations),
                "specializations": specializations or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching specializations for doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.delete(
    "/{doctor_id}/specializations/{specialization_id}",
    status_code=status.HTTP_200_OK,
    summary="Remove Doctor Specialization",
    description="Remove a specialization from a doctor (Admin/Manager only)"
)
async def remove_doctor_specialization(
    doctor_id: str,
    specialization_id: str,
    current_user: dict = Depends(require_roles(['admin', 'manager']))
):
    """
    Remove a specialization from a doctor
    
    **Required Role:** Admin or Manager
    
    **Authentication:** Bearer token required
    """
    logger.info(f"Removing specialization {specialization_id} from doctor {doctor_id} by {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Check if the association exists
            cursor.execute(
                """SELECT * FROM doctor_specialization 
                   WHERE doctor_id = %s AND specialization_id = %s""",
                (doctor_id, specialization_id)
            )
            specialization = cursor.fetchone()
            
            if not specialization:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Specialization not found for this doctor"
                )
            
            # Delete the association
            cursor.execute(
                """DELETE FROM doctor_specialization 
                   WHERE doctor_id = %s AND specialization_id = %s""",
                (doctor_id, specialization_id)
            )
            
            connection.commit()
            
            logger.info(f"✅ Specialization {specialization_id} removed from doctor {doctor_id}")
            
            return {
                "success": True,
                "message": "Specialization removed successfully"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing specialization from doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while removing specialization: {str(e)}"
        )


# ============================================
# SPECIALIZATIONS - PUBLIC (AUTHENTICATED)
# ============================================

@router.get(
    "/specializations/all",
    status_code=status.HTTP_200_OK,
    summary="Get All Specializations",
    description="Get list of all specializations"
)
async def get_all_specializations(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    current_user: dict = Depends(get_current_user)  # ✅ Requires authentication
):
    """
    Get all available specializations
    
    **Authentication:** Bearer token required
    
    **Parameters:**
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    - **active_only**: If True, only return specializations with active doctors
    """
    try:
        with get_db() as (cursor, connection):
            # Get total count
            count_query = "SELECT COUNT(*) as total FROM specialization"
            cursor.execute(count_query)
            total_result = cursor.fetchone()
            total = total_result['total'] if total_result else 0
            
            # Build query based on filters
            if active_only:
                query = """
                    SELECT 
                        s.specialization_id,
                        s.specialization_title,
                        s.other_details,
                        s.created_at,
                        s.updated_at,
                        COUNT(DISTINCT ds.doctor_id) as doctor_count
                    FROM specialization s
                    INNER JOIN doctor_specialization ds ON s.specialization_id = ds.specialization_id
                    INNER JOIN employee e ON ds.doctor_id = e.employee_id
                    WHERE e.is_active = TRUE
                    GROUP BY s.specialization_id, s.specialization_title, s.other_details, s.created_at, s.updated_at
                    ORDER BY s.specialization_title
                    LIMIT %s OFFSET %s
                """
            else:
                query = """
                    SELECT 
                        s.specialization_id,
                        s.specialization_title,
                        s.other_details,
                        s.created_at,
                        s.updated_at,
                        COUNT(DISTINCT ds.doctor_id) as doctor_count
                    FROM specialization s
                    LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.specialization_id
                    GROUP BY s.specialization_id, s.specialization_title, s.other_details, s.created_at, s.updated_at
                    ORDER BY s.specialization_title
                    LIMIT %s OFFSET %s
                """
            
            cursor.execute(query, (limit, skip))
            specializations = cursor.fetchall()
            
            return {
                "success": True,
                "total": total,
                "count": len(specializations),
                "skip": skip,
                "limit": limit,
                "specializations": specializations or []
            }
            
    except Exception as e:
        logger.error(f"Error fetching specializations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch specializations: {str(e)}"
        )


@router.post(
    "/specializations",
    status_code=status.HTTP_201_CREATED,
    response_model=CreateSpecializationResponse,
    summary="Create Specialization",
    description="Create a new specialization (Admin/Manager only)"
)
async def create_specialization(
    specialization_data: CreateSpecializationRequest,
    current_user: dict = Depends(require_roles(['admin', 'manager']))
):
    """
    Create a new specialization
    
    **Required Role:** Admin or Manager
    
    **Authentication:** Bearer token required
    """
    logger.info(f"Creating specialization '{specialization_data.specialization_title}' by {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            import uuid
            
            # Check if specialization title already exists
            cursor.execute(
                "SELECT specialization_id FROM specialization WHERE specialization_title = %s",
                (specialization_data.specialization_title,)
            )
            existing = cursor.fetchone()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Specialization with title '{specialization_data.specialization_title}' already exists"
                )
            
            # Generate UUID for new specialization
            specialization_id = str(uuid.uuid4())
            
            # Insert new specialization
            cursor.execute(
                """INSERT INTO specialization 
                   (specialization_id, specialization_title, other_details)
                   VALUES (%s, %s, %s)""",
                (
                    specialization_id,
                    specialization_data.specialization_title,
                    specialization_data.other_details
                )
            )
            
            connection.commit();
            
            logger.info(f"✅ Created new specialization: {specialization_id} - {specialization_data.specialization_title}")
            
            return CreateSpecializationResponse(
                success=True,
                message="Specialization created successfully",
                specialization_id=specialization_id
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating specialization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create specialization: {str(e)}"
        )


@router.get(
    "/specializations/{specialization_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Specialization by ID",
    description="Get a specific specialization by ID"
)
def get_specialization_by_id(specialization_id: str):
    """
    Get a specific specialization by ID
    
    - **specialization_id**: UUID of the specialization
    
    Returns:
    - Specialization details
    - Number of doctors with this specialization
    """
    try:
        with get_db() as (cursor, connection):
            # Get specialization with doctor count
            cursor.execute(
                """SELECT 
                    s.specialization_id,
                    s.specialization_title,
                    s.other_details,
                    s.created_at,
                    s.updated_at,
                    COUNT(DISTINCT ds.doctor_id) as doctor_count
                FROM specialization s
                LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.specialization_id
                WHERE s.specialization_id = %s
                GROUP BY s.specialization_id, s.specialization_title, s.other_details, s.created_at, s.updated_at""",
                (specialization_id,)
            )
            specialization = cursor.fetchone()
            
            if not specialization:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Specialization with ID {specialization_id} not found"
                )
            
            logger.info(f"Retrieved specialization: {specialization_id}")
            
            return {
                "success": True,
                "specialization": specialization
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching specialization {specialization_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch specialization: {str(e)}"
        )

