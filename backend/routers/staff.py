from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import date
from decimal import Decimal
from core.database import get_db
import logging
import hashlib

router = APIRouter(tags=["staff"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PASSWORD HASHING (SAME AS PATIENT.PY)
# ============================================

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(plain_password) == hashed_password


# ============================================
# PYDANTIC SCHEMAS
# ============================================

class StaffRegistrationRequest(BaseModel):
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
    role: str = Field(..., pattern="^(nurse|admin|receptionist|manager|pharmacist|lab_technician|doctor)$")
    salary: Decimal = Field(..., gt=0, description="Monthly salary")
    joined_date: date = Field(..., description="Date of joining")
    
    class Config:
        json_schema_extra = {
            "example": {
                "address_line1": "123 Hospital Road",
                "address_line2": "Near City Center",
                "city": "Colombo",
                "province": "Western",
                "postal_code": "00100",
                "country": "Sri Lanka",
                "contact_num1": "+94112345678",
                "contact_num2": "+94771234567",
                "full_name": "Sarah Johnson",
                "NIC": "199012345678",
                "email": "sarah.johnson@clinic.com",
                "gender": "Female",
                "DOB": "1990-05-15",
                "password": "SecureStaff123!",
                "branch_name": "Main Branch",
                "role": "nurse",
                "salary": 65000.00,
                "joined_date": "2025-01-15"
            }
        }

class StaffRegistrationResponse(BaseModel):
    success: bool
    message: str
    staff_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Staff member registered successfully",
                "staff_id": "uuid-of-new-staff"
            }
        }

class StaffLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Staff email address")
    password: str = Field(..., min_length=6, description="Staff password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "johndoe5@gmail.com",
                "password": "admin1234"
            }
        }

class StaffLoginResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[str] = None
    user_type: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Login successful",
                "user_id": "296351fe-aad4-11f0-afdd-005056c00001",
                "user_type": "doctor",
                "full_name": "Dr. Kasun Rajapaksha",
                "email": "kasun.rajapaksha@medsync.lk",
                "role": "doctor"
            }
        }

class UpdateSalaryRequest(BaseModel):
    new_salary: Decimal = Field(..., gt=0, description="New monthly salary")
    
    class Config:
        json_schema_extra = {
            "example": {
                "new_salary": 75000.00
            }
        }

class UpdateSalaryResponse(BaseModel):
    success: bool
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Salary updated successfully"
            }
        }


# ============================================
# STAFF LOGIN (SAME PATTERN AS PATIENT)
# ============================================

@router.post("/login", status_code=status.HTTP_200_OK, response_model=StaffLoginResponse)
def staff_login(credentials: StaffLoginRequest):
    """
    Staff-specific login endpoint (same pattern as patient login)
    
    - Authenticates doctors, nurses, admins, managers, receptionists
    - Uses SHA-256 password hashing
    - Returns employee role and details
    """
    try:
        logger.info(f"Staff login attempt for email: {credentials.email}")
        
        with get_db() as (cursor, connection):
            # Hash the password (same as patient login)
            password_hash = hash_password(credentials.password)
            logger.info(f"Password hash length: {len(password_hash)}")
            
            # Get user with matching email and password hash
            cursor.execute(
                """SELECT u.user_id, u.email, u.full_name, u.user_type
                   FROM user u
                   WHERE LOWER(TRIM(u.email)) = %s 
                   AND u.password_hash = %s 
                   AND u.user_type = 'employee'""",
                (credentials.email.lower().strip(), password_hash)
            )
            user_data = cursor.fetchone()
            
            if not user_data:
                logger.warning(f"Staff login failed - invalid credentials for: {credentials.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            logger.info(f"✅ User authenticated: {user_data['email']}")
            
            # Get employee role and status
            cursor.execute(
                """SELECT role, branch_id, is_active FROM employee WHERE employee_id = %s""",
                (user_data['user_id'],)
            )
            employee_data = cursor.fetchone()
            
            if not employee_data:
                logger.error(f"Employee record not found for user: {user_data['user_id']}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Staff account not properly configured"
                )
            
            if not employee_data['is_active']:
                logger.warning(f"Inactive employee attempted login: {credentials.email}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Staff account is inactive. Please contact administrator."
                )
            
            employee_role = employee_data['role']
            
            # Map role to user_type for frontend
            if employee_role == 'doctor':
                user_type = 'doctor'
            elif employee_role == 'admin':
                user_type = 'admin'
            elif employee_role == 'manager':
                user_type = 'staff'
            else:
                user_type = 'employee'  # nurse, receptionist, etc.
            
            logger.info(f"✅ Staff login successful - {credentials.email} (role: {employee_role}, type: {user_type})")
            
            return StaffLoginResponse(
                success=True,
                message="Login successful",
                user_id=user_data['user_id'],
                user_type=user_type,
                full_name=user_data['full_name'],
                email=user_data['email'],
                role=employee_role
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during staff login: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during authentication"
        )


# ============================================
# STAFF REGISTRATION (USING STORED PROCEDURE)
# ============================================

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=StaffRegistrationResponse)
def register_staff(staff_data: StaffRegistrationRequest):
    """
    Register a new staff member using stored procedure (same pattern as patient)
    
    - Creates user account with SHA-256 password
    - Creates employee record
    - Validates branch and role
    """
    try:
        logger.info(f"Staff registration attempt for email: {staff_data.email}, role: {staff_data.role}")
        
        with get_db() as (cursor, connection):
            # Hash the password (same as patient registration)
            password_hash = hash_password(staff_data.password)
            logger.info(f"Password hash length: {len(password_hash)}")
            
            # Set session variables for OUT parameters BEFORE calling procedure
            cursor.execute("SET @p_user_id = NULL")
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure with only IN parameters
            call_sql = """
                CALL RegisterStaff(
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    @p_user_id, @p_error_message, @p_success
                )
            """
            
            args = (
                staff_data.address_line1,           # 1 IN
                staff_data.address_line2 or '',     # 2 IN
                staff_data.city,                    # 3 IN
                staff_data.province,                # 4 IN
                staff_data.postal_code,             # 5 IN
                staff_data.country or 'Sri Lanka',  # 6 IN
                staff_data.contact_num1,            # 7 IN
                staff_data.contact_num2 or '',      # 8 IN
                staff_data.full_name,               # 9 IN
                staff_data.NIC,                     # 10 IN
                staff_data.email,                   # 11 IN
                staff_data.gender,                  # 12 IN
                staff_data.DOB,                     # 13 IN
                password_hash,                      # 14 IN
                staff_data.branch_name,             # 15 IN
                staff_data.role,                    # 16 IN
                float(staff_data.salary),           # 17 IN
                staff_data.joined_date,             # 18 IN
            )
            
            logger.info(f"Calling RegisterStaff procedure for branch: {staff_data.branch_name}, role: {staff_data.role}")
            
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
                logger.info(f"✅ Staff member registered successfully with ID: {user_id}")
                return StaffRegistrationResponse(
                    success=True,
                    message=error_message or "Staff member registered successfully",
                    staff_id=user_id
                )
            else:
                logger.warning(f"Registration failed: {error_message}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_message or "Failed to register staff member"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during staff registration: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during registration: {str(e)}"
        )


# ============================================
# GET STAFF ENDPOINTS
# ============================================

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_staff(
    branch_name: str = Query(..., description="Branch name (required)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    role: Optional[str] = Query(None, pattern="^(nurse|admin|receptionist|manager|pharmacist|lab_technician|doctor)$"),
    active_only: bool = Query(True, description="Get only active staff")
):
    """
    Get all staff members by branch name with optional filters
    
    - **branch_name**: Name of the branch (required)
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **role**: Filter by specific role (optional)
    - **active_only**: Get only active staff members (default: True)
    """
    try:
        with get_db() as (cursor, connection):
            # Call stored procedure
            call_sql = "CALL GetStaffByBranch(%s, %s, %s, %s, %s)"
            
            cursor.execute(call_sql, (
                branch_name,
                role if role else None,
                active_only,
                limit,
                skip
            ))
            
            # Get the result set
            staff_data = cursor.fetchall()
            
            if not staff_data or len(staff_data) == 0:
                return {
                    "success": True,
                    "branch_name": branch_name,
                    "total": 0,
                    "returned": 0,
                    "staff": []
                }
            
            # Check if first row contains error
            first_row = staff_data[0]
            if 'success' in first_row and not first_row['success']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=first_row.get('error_message', 'Failed to retrieve staff')
                )
            
            # Get total count from first row
            total_count = first_row.get('total_count', 0)
            
            # Extract staff data (remove metadata columns)
            staff_list = []
            for row in staff_data:
                if row.get('employee_id'):  # Only include rows with actual data
                    staff_record = {k: v for k, v in row.items() 
                                  if k not in ['success', 'error_message', 'total_count']}
                    staff_list.append(staff_record)
            
            logger.info(f"Retrieved {len(staff_list)} staff members from branch: {branch_name}")
            
            return {
                "success": True,
                "branch_name": branch_name,
                "total": total_count,
                "returned": len(staff_list),
                "staff": staff_list
            }
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching staff for branch {branch_name}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{staff_id}", status_code=status.HTTP_200_OK)
def get_staff_by_id(staff_id: str):
    """Get staff member details by ID"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute(
                """SELECT e.*, u.full_name, u.email, u.NIC, u.gender, u.DOB,
                          b.branch_name, b.branch_id,
                          a.address_line1, a.address_line2, a.city, a.province, a.postal_code, a.country,
                          c.contact_num1, c.contact_num2
                   FROM employee e
                   JOIN user u ON e.employee_id = u.user_id
                   JOIN branch b ON e.branch_id = b.branch_id
                   LEFT JOIN address a ON u.address_id = a.address_id
                   LEFT JOIN contact c ON u.contact_id = c.contact_id
                   WHERE e.employee_id = %s""",
                (staff_id,)
            )
            staff = cursor.fetchone()
            
            if not staff:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Staff member with ID {staff_id} not found"
                )
            
            return {"staff": staff}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching staff {staff_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/role/{role}", status_code=status.HTTP_200_OK)
def get_staff_by_role(role: str):
    """Get all staff members with a specific role"""
    try:
        # Validate role
        valid_roles = ['nurse', 'admin', 'receptionist', 'manager', 'pharmacist', 'lab_technician', 'doctor']
        if role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        
        with get_db() as (cursor, connection):
            cursor.execute(
                """SELECT e.*, u.full_name, u.email, b.branch_name
                   FROM employee e
                   JOIN user u ON e.employee_id = u.user_id
                   JOIN branch b ON e.branch_id = b.branch_id
                   WHERE e.role = %s AND e.is_active = TRUE
                   ORDER BY u.full_name""",
                (role,)
            )
            staff = cursor.fetchall()
            
            return {
                "role": role,
                "total": len(staff),
                "staff": staff or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching staff by role {role}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# UPDATE STAFF ENDPOINTS
# ============================================

@router.patch("/{staff_id}/salary", status_code=status.HTTP_200_OK, response_model=UpdateSalaryResponse)
def update_staff_salary(staff_id: str, salary_data: UpdateSalaryRequest):
    """Update staff member's salary"""
    try:
        with get_db() as (cursor, connection):
            # Set session variables for OUT parameters
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure
            call_sql = """
                CALL UpdateStaffSalary(
                    %s, %s,
                    @p_error_message, @p_success
                )
            """
            
            cursor.execute(call_sql, (staff_id, float(salary_data.new_salary)))
            
            # Get OUT parameters
            cursor.execute("SELECT @p_error_message as error_message, @p_success as success")
            result = cursor.fetchone()
            
            error_message = result['error_message']
            success = result['success']
            
            if success == 1 or success is True:
                logger.info(f"Salary updated for staff {staff_id}")
                return UpdateSalaryResponse(
                    success=True,
                    message=error_message or "Salary updated successfully"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_message or "Failed to update salary"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating salary for staff {staff_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating salary: {str(e)}"
        )


@router.patch("/{staff_id}/deactivate", status_code=status.HTTP_200_OK)
def deactivate_staff(staff_id: str):
    """Deactivate a staff member"""
    try:
        with get_db() as (cursor, connection):
            # Set session variables for OUT parameters
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure
            call_sql = """
                CALL DeactivateStaff(
                    %s,
                    @p_error_message, @p_success
                )
            """
            
            cursor.execute(call_sql, (staff_id,))
            
            # Get OUT parameters
            cursor.execute("SELECT @p_error_message as error_message, @p_success as success")
            result = cursor.fetchone()
            
            error_message = result['error_message']
            success = result['success']
            
            if success == 1 or success is True:
                logger.info(f"Staff {staff_id} deactivated")
                return {
                    "success": True,
                    "message": error_message or "Staff member deactivated successfully"
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_message or "Failed to deactivate staff member"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deactivating staff {staff_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deactivating staff: {str(e)}"
        )


@router.patch("/{staff_id}/reactivate", status_code=status.HTTP_200_OK)
def reactivate_staff(staff_id: str):
    """Reactivate a deactivated staff member"""
    try:
        with get_db() as (cursor, connection):
            # Check if staff exists
            cursor.execute(
                "SELECT * FROM employee WHERE employee_id = %s",
                (staff_id,)
            )
            staff = cursor.fetchone()
            
            if not staff:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Staff member with ID {staff_id} not found"
                )
            
            if staff['is_active']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Staff member is already active"
                )
            
            # Reactivate
            cursor.execute(
                "UPDATE employee SET is_active = TRUE WHERE employee_id = %s",
                (staff_id,)
            )
            
            connection.commit()
            
            logger.info(f"Staff {staff_id} reactivated")
            
            return {
                "success": True,
                "message": "Staff member reactivated successfully"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reactivating staff {staff_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while reactivating staff: {str(e)}"
        )