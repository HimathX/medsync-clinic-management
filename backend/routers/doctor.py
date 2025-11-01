from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import date, timedelta
from decimal import Decimal
from core.database import get_db
import hashlib
import json
import logging

router = APIRouter(tags=["doctor"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PASSWORD HASHING (SAME AS STAFF.PY)
# ============================================

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(plain_password) == hashed_password


# ============================================
# PYDANTIC SCHEMAS FOR LOGIN
# ============================================

class DoctorLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Doctor email address")
    password: str = Field(..., min_length=6, description="Doctor password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "dr.john@clinic.com",
                "password": "SecureDoc123!"
            }
        }

class DoctorLoginResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[str] = None
    user_type: str = "doctor"  # Always 'doctor' for this endpoint
    full_name: Optional[str] = None
    email: Optional[str] = None
    doctor_id: Optional[str] = None
    room_no: Optional[str] = None
    consultation_fee: Optional[Decimal] = None
    specializations: Optional[List[str]] = None
    branch_id: Optional[str] = None
    branch_name: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Login successful",
                "user_id": "296351fe-aad4-11f0-afdd-005056c00001",
                "user_type": "doctor",
                "full_name": "Dr. John Smith",
                "email": "dr.john@clinic.com",
                "doctor_id": "296351fe-aad4-11f0-afdd-005056c00001",
                "room_no": "R101",
                "consultation_fee": 2500.00,
                "specializations": ["Cardiology", "General Medicine"],
                "branch_name": "Main Branch"
            }
        }


# ============================================
# DOCTOR LOGIN ENDPOINT
# ============================================

@router.post("/login", status_code=status.HTTP_200_OK, response_model=DoctorLoginResponse)
def doctor_login(credentials: DoctorLoginRequest):
    """
    Doctor login endpoint
    
    - Authenticates doctors using email and password
    - Uses SHA-256 password hashing
    - Returns doctor details including specializations and room info
    - Handles both user_type='doctor' and user_type='employee' with role='doctor'
    """
    try:
        logger.info(f"🔑 Doctor login attempt for email: {credentials.email}")
        
        with get_db() as (cursor, connection):
            # Get user data - check for both user_type='doctor' AND user_type='employee' with role='doctor'
            cursor.execute(
                """SELECT u.user_id, u.email, u.full_name, u.user_type, u.password_hash
                   FROM user u
                   WHERE LOWER(TRIM(u.email)) = %s 
                   AND (u.user_type = 'doctor' OR u.user_type = 'employee')""",
                (credentials.email.lower().strip(),)
            )
            user_data = cursor.fetchone()
            
            if not user_data:
                logger.warning(f"❌ Doctor login failed - user not found: {credentials.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            logger.info(f"✅ User found: {user_data['email']} (type: {user_data['user_type']})")
            
            # Hash the provided password and verify
            provided_hash = hashlib.sha256(credentials.password.encode('utf-8')).hexdigest()
            
            # Verify password
            if provided_hash != user_data['password_hash']:
                logger.warning(f"❌ Doctor login failed - invalid password for: {credentials.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            logger.info(f"✅ Password verified")
            
            # If user_type is 'employee', verify role is 'doctor'
            if user_data['user_type'] == 'employee':
                cursor.execute(
                    """SELECT role, branch_id, is_active FROM employee WHERE employee_id = %s""",
                    (user_data['user_id'],)
                )
                employee_data = cursor.fetchone()
                
                if not employee_data:
                    logger.error(f"❌ Employee record not found for user: {user_data['user_id']}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Account not properly configured"
                    )
                
                # Verify that employee is a doctor
                if employee_data['role'] != 'doctor':
                    logger.warning(f"❌ Employee role is not doctor, role is: {employee_data['role']}")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="This account is not authorized as a doctor"
                    )
                
                # Check if doctor is active
                if not employee_data['is_active']:
                    logger.warning(f"❌ Inactive employee attempted login: {credentials.email}")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Doctor account is inactive"
                    )
                
                logger.info(f"✅ Employee verified as active doctor, role: {employee_data['role']}")
            
            elif user_data['user_type'] == 'doctor':
                # For direct doctor user_type, just log it
                logger.info(f"✅ User type is 'doctor', proceeding with login")
            
            # Get doctor-specific details
            cursor.execute(
                """SELECT d.doctor_id, d.room_no, d.consultation_fee, d.is_available,
                          b.branch_id, b.branch_name
                   FROM doctor d
                   LEFT JOIN employee e ON d.doctor_id = e.employee_id
                   LEFT JOIN branch b ON e.branch_id = b.branch_id
                   WHERE d.doctor_id = %s""",
                (user_data['user_id'],)
            )
            doctor_data = cursor.fetchone()
            
            if not doctor_data:
                logger.error(f"❌ Doctor record not found for user: {user_data['user_id']}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Doctor account not properly configured"
                )
            
            logger.info(f"✅ Doctor details retrieved - Room: {doctor_data['room_no']}, Available: {doctor_data['is_available']}")
            
            # Get doctor specializations
            cursor.execute(
                """SELECT s.specialization_title
                   FROM specialization s
                   JOIN doctor_specialization ds ON s.specialization_id = ds.specialization_id
                   WHERE ds.doctor_id = %s
                   ORDER BY s.specialization_title""",
                (user_data['user_id'],)
            )
            specializations_data = cursor.fetchall()
            specializations = [spec['specialization_title'] for spec in specializations_data] if specializations_data else []
            
            logger.info(f"✅✅✅ Doctor login SUCCESSFUL - {credentials.email}")
            logger.info(f"    Doctor ID: {doctor_data['doctor_id']}")
            logger.info(f"    User Type: {user_data['user_type']}")
            logger.info(f"    Specializations: {', '.join(specializations)}")
            
            return DoctorLoginResponse(
                success=True,
                message="Login successful",
                user_id=user_data['user_id'],
                user_type="doctor",
                full_name=user_data['full_name'],
                email=user_data['email'],
                doctor_id=doctor_data['doctor_id'],
                room_no=doctor_data['room_no'],
                consultation_fee=doctor_data['consultation_fee'],
                specializations=specializations,
                branch_id=doctor_data['branch_id'],
                branch_name=doctor_data['branch_name']
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

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
    
    class Config:
        json_schema_extra = {
            "example": {
                "address_line1": "789 Doctor Street",
                "address_line2": "Colombo 07",
                "city": "Colombo",
                "province": "Western",
                "postal_code": "00700",
                "country": "Sri Lanka",
                "contact_num1": "+94115556677",
                "contact_num2": "+94771112233",
                "full_name": "Dr. John Smith",
                "NIC": "197501234567",
                "email": "dr.john@clinic.com",
                "gender": "Male",
                "DOB": "1975-05-15",
                "password": "SecureDoc123!",
                "branch_name": "Main Branch",
                "salary": 120000.00,
                "joined_date": "2025-01-01",
                "room_no": "R101",
                "medical_licence_no": "LK-MED-12345",
                "consultation_fee": 2500.00,
                "specialization_ids": ["spec-uuid-1", "spec-uuid-2"]
            }
        }

class DoctorRegistrationResponse(BaseModel):
    success: bool
    message: str
    doctor_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Doctor registered successfully",
                "doctor_id": "uuid-of-new-doctor"
            }
        }

class AddSpecializationRequest(BaseModel):
    specialization_id: str = Field(..., description="Specialization ID (UUID)")
    certification_date: date = Field(..., description="Date of certification (YYYY-MM-DD)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "specialization_id": "spec-uuid-here",
                "certification_date": "2024-01-15"
            }
        }

class AddSpecializationResponse(BaseModel):
    success: bool
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Doctor specialization added successfully"
            }
        }


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=DoctorRegistrationResponse)
def register_doctor(doctor_data: DoctorRegistrationRequest):
    """
    Register a new doctor using stored procedure
    
    - Creates user account
    - Creates employee record
    - Creates doctor record with medical licence
    - Associates specializations
    """
    try:
        with get_db() as (cursor, connection):
            # Hash the password using SHA-256
            password_hash = hash_password(doctor_data.password)
            
            # Convert specialization IDs to JSON array for MySQL
            specialization_json = json.dumps(doctor_data.specialization_ids) if doctor_data.specialization_ids else None
            
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
            
            logger.info(f"Doctor registration result - Success: {success}, User ID: {user_id}, Error: {error_message}")
            
            if success == 1 or success is True:
                return DoctorRegistrationResponse(
                    success=True,
                    message=error_message or "Doctor registered successfully",
                    doctor_id=user_id
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_message or "Failed to register doctor"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during doctor registration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during registration: {str(e)}"
        )

# ============================================
# GET ENDPOINTS
# ============================================

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_doctors(skip: int = 0, limit: int = 100):
    """Get all doctors with pagination"""
    try:
        with get_db() as (cursor, connection):
            # Get total count
            cursor.execute("SELECT COUNT(*) as total FROM doctor")
            total_result = cursor.fetchone()
            total = total_result['total'] if total_result else 0
            
            # Get doctors with pagination
            cursor.execute(
                """SELECT d.*, e.*, u.full_name, u.email, u.contact_id
                   FROM doctor d
                   JOIN employee e ON d.doctor_id = e.employee_id
                   JOIN user u ON d.doctor_id = u.user_id
                   WHERE e.is_active = TRUE
                   LIMIT %s OFFSET %s""",
                (limit, skip)
            )
            doctors = cursor.fetchall()
            
            return {
                "total": total,
                "doctors": doctors or []
            }
    except Exception as e:
        logger.error(f"Error fetching doctors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# SYSTEM-WIDE REPORTS (MUST BE BEFORE /{doctor_id})
# ============================================

@router.get("/performance-report", status_code=status.HTTP_200_OK)
def get_all_doctors_performance_report(
    period: str = Query("monthly", description="Period: daily, weekly, monthly, yearly"),
    top_count: int = Query(10, description="Number of top/bottom performers to return"),
    sort_by: str = Query("revenue", description="Sort by: revenue, completion_rate, no_show_rate, consultations")
):
    """
    Get comprehensive performance report comparing all doctors
    
    Parameters:
    - period: daily, weekly, monthly, yearly
    - top_count: Number of top performers to display
    - sort_by: Sort criteria (revenue, completion_rate, no_show_rate, consultations)
    
    Returns:
    - List of all doctors with performance metrics
    - Top performers
    - Bottom performers
    - Average metrics across all doctors
    - Trends
    """
    try:
        with get_db() as (cursor, connection):
            # Get all active doctors with their metrics
            cursor.execute(
                """SELECT 
                    d.doctor_id,
                    u.full_name,
                    d.consultation_fee,
                    e.branch_id,
                    b.branch_name,
                    COUNT(DISTINCT a.appointment_id) as total_consultations,
                    COUNT(DISTINCT CASE WHEN a.status = 'Completed' THEN a.appointment_id END) as completed,
                    COUNT(DISTINCT CASE WHEN a.status = 'No-Show' THEN a.appointment_id END) as no_shows,
                    COUNT(DISTINCT CASE WHEN a.status = 'Cancelled' THEN a.appointment_id END) as cancelled,
                    COUNT(DISTINCT a.patient_id) as unique_patients,
                    COALESCE(SUM(i.sub_total + COALESCE(i.tax_amount, 0)), 0) as total_revenue
                FROM doctor d
                JOIN user u ON d.doctor_id = u.user_id
                JOIN employee e ON d.doctor_id = e.employee_id
                LEFT JOIN branch b ON e.branch_id = b.branch_id
                LEFT JOIN time_slot ts ON d.doctor_id = ts.doctor_id
                LEFT JOIN appointment a ON ts.time_slot_id = a.time_slot_id
                LEFT JOIN consultation_record cr ON a.appointment_id = cr.appointment_id
                LEFT JOIN invoice i ON cr.consultation_rec_id = i.consultation_rec_id
                WHERE e.is_active = TRUE
                GROUP BY d.doctor_id, u.full_name, d.consultation_fee, e.branch_id, b.branch_name
                ORDER BY total_revenue DESC"""
            )
            doctors_data = cursor.fetchall()
            
            # Process doctors data to calculate additional metrics
            doctors_metrics = []
            for doctor in doctors_data:
                total_consults = doctor['total_consultations'] or 0
                completed = doctor['completed'] or 0
                no_shows = doctor['no_shows'] or 0
                
                completion_rate = (completed / total_consults * 100) if total_consults > 0 else 0
                no_show_rate = (no_shows / total_consults * 100) if total_consults > 0 else 0
                avg_revenue = (doctor['total_revenue'] / completed) if completed > 0 else 0
                
                doctors_metrics.append({
                    "doctor_id": doctor['doctor_id'],
                    "doctor_name": doctor['full_name'],
                    "branch_name": doctor['branch_name'],
                    "consultation_fee": float(doctor['consultation_fee']) if doctor['consultation_fee'] else 0.0,
                    "total_consultations": total_consults,
                    "completed_consultations": completed,
                    "no_shows": no_shows,
                    "cancelled": doctor['cancelled'] or 0,
                    "unique_patients": doctor['unique_patients'] or 0,
                    "completion_rate": round(completion_rate, 2),
                    "no_show_rate": round(no_show_rate, 2),
                    "total_revenue": round(doctor['total_revenue'], 2),
                    "avg_revenue_per_consultation": round(avg_revenue, 2)
                })
            
            # Sort based on criteria
            if sort_by == "revenue":
                doctors_metrics.sort(key=lambda x: x['total_revenue'], reverse=True)
            elif sort_by == "completion_rate":
                doctors_metrics.sort(key=lambda x: x['completion_rate'], reverse=True)
            elif sort_by == "no_show_rate":
                doctors_metrics.sort(key=lambda x: x['no_show_rate'], reverse=False)
            else:  # consultations
                doctors_metrics.sort(key=lambda x: x['total_consultations'], reverse=True)
            
            # Calculate averages
            if doctors_metrics:
                avg_consultations = sum(d['total_consultations'] for d in doctors_metrics) / len(doctors_metrics)
                avg_completion_rate = sum(d['completion_rate'] for d in doctors_metrics) / len(doctors_metrics)
                avg_no_show_rate = sum(d['no_show_rate'] for d in doctors_metrics) / len(doctors_metrics)
                avg_revenue = sum(d['total_revenue'] for d in doctors_metrics) / len(doctors_metrics)
            else:
                avg_consultations = avg_completion_rate = avg_no_show_rate = avg_revenue = 0
            
            logger.info(f"Retrieved performance report for {len(doctors_metrics)} doctors")
            
            return {
                "success": True,
                "total_doctors": len(doctors_metrics),
                "period": period,
                "sort_by": sort_by,
                "summary": {
                    "average_consultations": round(avg_consultations, 2),
                    "average_completion_rate": round(avg_completion_rate, 2),
                    "average_no_show_rate": round(avg_no_show_rate, 2),
                    "average_revenue": round(avg_revenue, 2)
                },
                "top_performers": doctors_metrics[:top_count],
                "bottom_performers": doctors_metrics[-top_count:] if len(doctors_metrics) > top_count else [],
                "all_doctors": doctors_metrics
            }
            
    except Exception as e:
        logger.error(f"Error fetching performance report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch performance report: {str(e)}"
        )


@router.get("/availability-report", status_code=status.HTTP_200_OK)
def get_availability_report(branch_id: Optional[str] = None):
    """
    Get availability report across all doctors (optionally filtered by branch)
    
    Parameters:
    - branch_id: Optional branch UUID to filter doctors
    
    Returns:
    - Doctor availability status
    - Schedule coverage gaps
    - Availability by specialization
    - Branch-wise coverage
    """
    try:
        with get_db() as (cursor, connection):
            # Build query
            query = """SELECT 
                d.doctor_id,
                u.full_name,
                d.is_available,
                e.branch_id,
                b.branch_name,
                COUNT(DISTINCT CASE WHEN ts.available_date >= CURDATE() AND ts.is_booked = FALSE THEN ts.time_slot_id END) as available_slots,
                COUNT(DISTINCT CASE WHEN ts.available_date >= CURDATE() AND ts.is_booked = TRUE THEN ts.time_slot_id END) as booked_slots,
                GROUP_CONCAT(DISTINCT s.specialization_title SEPARATOR ', ') as specializations
            FROM doctor d
            JOIN user u ON d.doctor_id = u.user_id
            JOIN employee e ON d.doctor_id = e.employee_id
            LEFT JOIN branch b ON e.branch_id = b.branch_id
            LEFT JOIN time_slot ts ON d.doctor_id = ts.doctor_id
            LEFT JOIN doctor_specialization ds ON d.doctor_id = ds.doctor_id
            LEFT JOIN specialization s ON ds.specialization_id = s.specialization_id
            WHERE e.is_active = TRUE"""
            
            params = []
            if branch_id:
                query += " AND e.branch_id = %s"
                params.append(branch_id)
            
            query += """ GROUP BY d.doctor_id, u.full_name, d.is_available, e.branch_id, b.branch_name
                        ORDER BY b.branch_name, u.full_name"""
            
            cursor.execute(query, params)
            availability_data = cursor.fetchall()
            
            # Group by branch
            by_branch = {}
            for doctor in availability_data:
                branch_key = doctor['branch_name'] or 'Unassigned'
                if branch_key not in by_branch:
                    by_branch[branch_key] = []
                
                total_slots = (doctor['available_slots'] or 0) + (doctor['booked_slots'] or 0)
                utilization = ((doctor['booked_slots'] or 0) / total_slots * 100) if total_slots > 0 else 0
                
                by_branch[branch_key].append({
                    "doctor_id": doctor['doctor_id'],
                    "doctor_name": doctor['full_name'],
                    "is_available": doctor['is_available'],
                    "specializations": doctor['specializations'],
                    "available_slots": doctor['available_slots'] or 0,
                    "booked_slots": doctor['booked_slots'] or 0,
                    "total_slots": total_slots,
                    "utilization_rate": round(utilization, 2)
                })
            
            logger.info(f"Retrieved availability report for {len(availability_data)} doctors")
            
            return {
                "success": True,
                "total_doctors": len(availability_data),
                "branch_filter": branch_id,
                "availability_by_branch": by_branch
            }
            
    except Exception as e:
        logger.error(f"Error fetching availability report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch availability report: {str(e)}"
        )


@router.get("/{doctor_id}", status_code=status.HTTP_200_OK)
def get_doctor_by_id(doctor_id: str):
    """Get doctor details by ID"""
    try:
        with get_db() as (cursor, connection):
            # Get doctor details
            cursor.execute(
                """SELECT d.*, e.*, u.full_name, u.email, u.NIC, u.gender, u.DOB
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
                   WHERE ds.doctor_id = %s""",
                (doctor_id,)
            )
            specializations = cursor.fetchall()
            
            return {
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

@router.get("/{doctor_id}/time-slots", status_code=status.HTTP_200_OK)
def get_doctor_time_slots(doctor_id: str, available_only: bool = True):
    """Get all time slots for a doctor"""
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
            query = "SELECT * FROM time_slot WHERE doctor_id = %s"
            params = [doctor_id]
            
            if available_only:
                query += " AND is_booked = FALSE AND available_date >= CURDATE()"
            
            query += " ORDER BY available_date, start_time"
            
            cursor.execute(query, params)
            time_slots = cursor.fetchall()
            
            return {
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

@router.get("/specialization/{specialization_id}", status_code=status.HTTP_200_OK)
def get_doctors_by_specialization(specialization_id: str):
    """Get all doctors with a specific specialization"""
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
                """SELECT d.*, e.*, u.full_name, u.email
                   FROM doctor d
                   JOIN employee e ON d.doctor_id = e.employee_id
                   JOIN user u ON d.doctor_id = u.user_id
                   JOIN doctor_specialization ds ON d.doctor_id = ds.doctor_id
                   WHERE ds.specialization_id = %s AND e.is_active = TRUE""",
                (specialization_id,)
            )
            doctors = cursor.fetchall()
            
            return {
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

@router.post("/{doctor_id}/specializations", status_code=status.HTTP_201_CREATED, response_model=AddSpecializationResponse)
def add_doctor_specialization(doctor_id: str, specialization_data: AddSpecializationRequest):
    """
    Add a new specialization to a doctor
    
    - Validates doctor and specialization exist
    - Checks for duplicates
    - Associates specialization with certification date
    """
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
                logger.info(f"Specialization added to doctor {doctor_id}")
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

@router.get("/{doctor_id}/specializations", status_code=status.HTTP_200_OK)
def get_doctor_specializations(doctor_id: str):
    """Get all specializations for a specific doctor"""
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
                   WHERE ds.doctor_id = %s""",
                (doctor_id,)
            )
            specializations = cursor.fetchall()
            
            return {
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

@router.delete("/{doctor_id}/specializations/{specialization_id}", status_code=status.HTTP_200_OK)
def remove_doctor_specialization(doctor_id: str, specialization_id: str):
    """Remove a specialization from a doctor"""
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
            
            logger.info(f"Specialization {specialization_id} removed from doctor {doctor_id}")
            
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

@router.get("/specializations/all", status_code=status.HTTP_200_OK)
def get_all_specializations(
    skip: int = 0, 
    limit: int = 100,
    active_only: bool = False
):
    """
    Get all available specializations
    
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    - **active_only**: If True, only return specializations with active doctors
    
    Returns list of all specializations with details
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
                    SELECT DISTINCT 
                        s.specialization_id,
                        s.specialization_title,
                        s.other_details,
                        s.created_at,
                        s.updated_at,
                        COUNT(DISTINCT ds.doctor_id) as doctor_count
                    FROM specialization s
                    INNER JOIN doctor_specialization ds ON s.specialization_id = ds.specialization_id
                    INNER JOIN doctor d ON ds.doctor_id = d.doctor_id
                    INNER JOIN employee e ON d.doctor_id = e.employee_id
                    WHERE e.is_active = TRUE AND d.is_available = TRUE
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
            
            logger.info(f"Retrieved {len(specializations)} specializations")
            
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


@router.get("/specializations/{specialization_id}/details", status_code=status.HTTP_200_OK)
def get_specialization_details(specialization_id: str):
    """
    Get detailed information about a specific specialization
    
    - **specialization_id**: UUID of the specialization
    
    Returns:
    - Specialization details
    - List of doctors with this specialization
    - Statistics
    """
    try:
        with get_db() as (cursor, connection):
            # Get specialization details
            cursor.execute(
                """SELECT * FROM specialization WHERE specialization_id = %s""",
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
                    u.full_name,
                    u.email,
                    d.room_no,
                    d.consultation_fee,
                    d.is_available,
                    e.branch_id,
                    b.branch_name,
                    ds.certification_date
                FROM doctor d
                JOIN user u ON d.doctor_id = u.user_id
                JOIN employee e ON d.doctor_id = e.employee_id
                JOIN doctor_specialization ds ON d.doctor_id = ds.doctor_id
                LEFT JOIN branch b ON e.branch_id = b.branch_id
                WHERE ds.specialization_id = %s AND e.is_active = TRUE
                ORDER BY u.full_name""",
                (specialization_id,)
            )
            doctors = cursor.fetchall()
            
            # Get statistics
            cursor.execute(
                """SELECT 
                    COUNT(DISTINCT ds.doctor_id) as total_doctors,
                    COUNT(DISTINCT CASE WHEN d.is_available = TRUE THEN ds.doctor_id END) as available_doctors,
                    COUNT(DISTINCT ts.time_slot_id) as total_time_slots,
                    COUNT(DISTINCT CASE WHEN ts.is_booked = FALSE AND ts.available_date >= CURDATE() THEN ts.time_slot_id END) as available_slots
                FROM doctor_specialization ds
                LEFT JOIN doctor d ON ds.doctor_id = d.doctor_id
                LEFT JOIN time_slot ts ON d.doctor_id = ts.doctor_id
                WHERE ds.specialization_id = %s""",
                (specialization_id,)
            )
            stats = cursor.fetchone()
            
            logger.info(f"Retrieved details for specialization {specialization_id}")
            
            return {
                "success": True,
                "specialization": specialization,
                "doctors": doctors or [],
                "statistics": stats or {
                    "total_doctors": 0,
                    "available_doctors": 0,
                    "total_time_slots": 0,
                    "available_slots": 0
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching specialization details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch specialization details: {str(e)}"
        )


@router.get("/specializations/search/{search_term}", status_code=status.HTTP_200_OK)
def search_specializations(search_term: str):
    """
    Search specializations by title or description
    
    - **search_term**: Search keyword
    
    Returns matching specializations
    """
    try:
        with get_db() as (cursor, connection):
            search_pattern = f"%{search_term}%"
            
            cursor.execute(
                """SELECT 
                    s.specialization_id,
                    s.specialization_title,
                    s.other_details,
                    COUNT(DISTINCT ds.doctor_id) as doctor_count
                FROM specialization s
                LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.specialization_id
                WHERE s.specialization_title LIKE %s 
                   OR s.other_details LIKE %s
                GROUP BY s.specialization_id, s.specialization_title, s.other_details
                ORDER BY s.specialization_title""",
                (search_pattern, search_pattern)
            )
            specializations = cursor.fetchall()
            
            logger.info(f"Search for '{search_term}' returned {len(specializations)} results")
            
            return {
                "success": True,
                "search_term": search_term,
                "count": len(specializations),
                "specializations": specializations or []
            }
            
    except Exception as e:
        logger.error(f"Error searching specializations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search specializations: {str(e)}"
        )


# ============================================
# DOCTOR DASHBOARD ENDPOINTS
# ============================================

@router.get("/{doctor_id}/dashboard/stats", status_code=status.HTTP_200_OK)
def get_doctor_dashboard_stats(doctor_id: str):
    """
    Get doctor dashboard statistics
    
    Returns:
    - today_appointments: Number of appointments today
    - pending_consultations: Consultations not yet completed
    - completed_today: Completed consultations today
    - patients_seen: Unique patients seen today
    - upcoming_appointments: Appointments in next 7 days
    - total_patients: Total unique patients all-time
    """
    try:
        with get_db() as (cursor, connection):
            # Verify doctor exists
            cursor.execute("SELECT doctor_id FROM doctor WHERE doctor_id = %s", (doctor_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            # Today's appointments count
            cursor.execute(
                """SELECT COUNT(*) as count FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE ts.doctor_id = %s 
                   AND ts.available_date = CURDATE()""",
                (doctor_id,)
            )
            today_result = cursor.fetchone()
            today_appointments = today_result['count'] if today_result else 0
            
            # Pending consultations (appointments with status Scheduled or Checked-in)
            cursor.execute(
                """SELECT COUNT(*) as count FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE ts.doctor_id = %s 
                   AND a.status IN ('Scheduled', 'Checked-in')""",
                (doctor_id,)
            )
            pending_result = cursor.fetchone()
            pending_consultations = pending_result['count'] if pending_result else 0
            
            # Completed today
            cursor.execute(
                """SELECT COUNT(*) as count FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE ts.doctor_id = %s 
                   AND ts.available_date = CURDATE()
                   AND a.status = 'Completed'""",
                (doctor_id,)
            )
            completed_result = cursor.fetchone()
            completed_today = completed_result['count'] if completed_result else 0
            
            # Patients seen today (unique)
            cursor.execute(
                """SELECT COUNT(DISTINCT a.patient_id) as count FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE ts.doctor_id = %s 
                   AND ts.available_date = CURDATE()""",
                (doctor_id,)
            )
            patients_today_result = cursor.fetchone()
            patients_seen = patients_today_result['count'] if patients_today_result else 0
            
            # Upcoming appointments (next 7 days, excluding today)
            cursor.execute(
                """SELECT COUNT(*) as count FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE ts.doctor_id = %s 
                   AND ts.available_date > CURDATE()
                   AND ts.available_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                   AND a.status NOT IN ('Cancelled', 'No-Show')""",
                (doctor_id,)
            )
            upcoming_result = cursor.fetchone()
            upcoming_appointments = upcoming_result['count'] if upcoming_result else 0
            
            # Total unique patients all-time
            cursor.execute(
                """SELECT COUNT(DISTINCT a.patient_id) as count FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE ts.doctor_id = %s""",
                (doctor_id,)
            )
            total_patients_result = cursor.fetchone()
            total_patients = total_patients_result['count'] if total_patients_result else 0
            
            return {
                "today_appointments": today_appointments,
                "pending_consultations": pending_consultations,
                "completed_today": completed_today,
                "patients_seen": patients_seen,
                "upcoming_appointments": upcoming_appointments,
                "total_patients": total_patients
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching dashboard stats for doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard stats: {str(e)}"
        )


@router.get("/{doctor_id}/dashboard/today-appointments", status_code=status.HTTP_200_OK)
def get_doctor_today_appointments(doctor_id: str):
    """
    Get today's appointments for a doctor with patient details
    """
    try:
        with get_db() as (cursor, connection):
            # Verify doctor exists
            cursor.execute("SELECT doctor_id FROM doctor WHERE doctor_id = %s", (doctor_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            # Get today's appointments with patient info
            cursor.execute(
                """SELECT 
                    a.appointment_id,
                    a.patient_id,
                    a.status,
                    a.notes,
                    ts.start_time,
                    ts.end_time,
                    ts.available_date,
                    u.full_name as patient_name,
                    p.chronic_conditions,
                    p.allergies
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u ON p.patient_id = u.user_id
                WHERE ts.doctor_id = %s 
                AND ts.available_date = CURDATE()
                ORDER BY ts.start_time""",
                (doctor_id,)
            )
            appointments = cursor.fetchall()
            
            return {
                "appointments": appointments or []
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching today's appointments for doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch today's appointments: {str(e)}"
        )


@router.get("/{doctor_id}/dashboard/upcoming", status_code=status.HTTP_200_OK)
def get_doctor_upcoming_appointments(doctor_id: str, days: int = 7):
    """
    Get upcoming appointments for a doctor (excluding today)
    
    - **days**: Number of days to look ahead (default 7)
    """
    try:
        with get_db() as (cursor, connection):
            # Verify doctor exists
            cursor.execute("SELECT doctor_id FROM doctor WHERE doctor_id = %s", (doctor_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            # Get upcoming appointments
            cursor.execute(
                """SELECT 
                    a.appointment_id,
                    a.patient_id,
                    a.status,
                    ts.start_time,
                    ts.end_time,
                    ts.available_date,
                    u.full_name as patient_name
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u ON p.patient_id = u.user_id
                WHERE ts.doctor_id = %s 
                AND ts.available_date > CURDATE()
                AND ts.available_date <= DATE_ADD(CURDATE(), INTERVAL %s DAY)
                AND a.status NOT IN ('Cancelled', 'No-Show')
                ORDER BY ts.available_date, ts.start_time""",
                (doctor_id, days)
            )
            appointments = cursor.fetchall()
            
            return {
                "appointments": appointments or []
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching upcoming appointments for doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch upcoming appointments: {str(e)}"
        )


# ============================================
# 1. PERFORMANCE METRICS ENDPOINTS (SYSTEM-WIDE)
# ============================================

@router.get("/{doctor_id}/metrics", status_code=status.HTTP_200_OK)
def get_doctor_performance_metrics(doctor_id: str):
    """
    Get comprehensive performance metrics for a specific doctor
    
    Returns:
    - Total consultations
    - Average consultation rating
    - Patient satisfaction score
    - Appointment completion rate
    - No-show rate
    - Average revenue per consultation
    - Total revenue generated
    - Performance trend
    """
    try:
        with get_db() as (cursor, connection):
            # Verify doctor exists
            cursor.execute("SELECT doctor_id, is_available FROM doctor WHERE doctor_id = %s", (doctor_id,))
            doctor = cursor.fetchone()
            
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            # Total consultations
            cursor.execute(
                """SELECT COUNT(*) as total FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE ts.doctor_id = %s""",
                (doctor_id,)
            )
            total_consultations = cursor.fetchone()['total'] or 0
            
            # Completed consultations
            cursor.execute(
                """SELECT COUNT(*) as total FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE ts.doctor_id = %s AND a.status = 'Completed'""",
                (doctor_id,)
            )
            completed_consultations = cursor.fetchone()['total'] or 0
            
            # No-show appointments
            cursor.execute(
                """SELECT COUNT(*) as total FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE ts.doctor_id = %s AND a.status = 'No-Show'""",
                (doctor_id,)
            )
            no_shows = cursor.fetchone()['total'] or 0
            
            # Cancelled appointments
            cursor.execute(
                """SELECT COUNT(*) as total FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE ts.doctor_id = %s AND a.status = 'Cancelled'""",
                (doctor_id,)
            )
            cancelled = cursor.fetchone()['total'] or 0
            
            # Unique patients
            cursor.execute(
                """SELECT COUNT(DISTINCT a.patient_id) as total FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE ts.doctor_id = %s""",
                (doctor_id,)
            )
            unique_patients = cursor.fetchone()['total'] or 0
            
            # Total revenue (from invoices linked to consultations)
            cursor.execute(
                """SELECT SUM(i.sub_total + COALESCE(i.tax_amount, 0)) as total_revenue
                   FROM invoice i
                   JOIN consultation_record cr ON i.consultation_rec_id = cr.consultation_rec_id
                   JOIN appointment a ON cr.appointment_id = a.appointment_id
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE ts.doctor_id = %s""",
                (doctor_id,)
            )
            revenue_result = cursor.fetchone()
            total_revenue = float(revenue_result['total_revenue']) if revenue_result['total_revenue'] else 0.0
            
            # Average consultation fee
            cursor.execute(
                """SELECT d.consultation_fee FROM doctor d WHERE d.doctor_id = %s""",
                (doctor_id,)
            )
            fee_result = cursor.fetchone()
            avg_fee = float(fee_result['consultation_fee']) if fee_result and fee_result['consultation_fee'] else 0.0
            
            # Calculate metrics
            completion_rate = (completed_consultations / total_consultations * 100) if total_consultations > 0 else 0
            no_show_rate = (no_shows / total_consultations * 100) if total_consultations > 0 else 0
            avg_revenue_per_consultation = (total_revenue / completed_consultations) if completed_consultations > 0 else 0
            
            logger.info(f"Retrieved metrics for doctor {doctor_id}")
            
            return {
                "success": True,
                "doctor_id": doctor_id,
                "total_consultations": total_consultations,
                "completed_consultations": completed_consultations,
                "cancelled_appointments": cancelled,
                "no_shows": no_shows,
                "unique_patients": unique_patients,
                "completion_rate": round(completion_rate, 2),
                "no_show_rate": round(no_show_rate, 2),
                "consultation_fee": avg_fee,
                "total_revenue": round(total_revenue, 2),
                "avg_revenue_per_consultation": round(avg_revenue_per_consultation, 2),
                "is_available": doctor['is_available']
            }
            
    except HTTPException:
        raise
    except Exception as e:
            logger.error(f"Error fetching doctor metrics for {doctor_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch metrics: {str(e)}"
            )
@router.get("/{doctor_id}/consultation-analytics", status_code=status.HTTP_200_OK)
def get_doctor_consultation_analytics(
    doctor_id: str,
    days: int = Query(30, description="Number of days to analyze")
):
    """
    Get detailed consultation analytics for a doctor
    
    Parameters:
    - doctor_id: Doctor UUID
    - days: Number of days to analyze (default 30)
    
    Returns:
    - Consultations per day/week
    - Peak hours and days
    - Most common conditions treated
    - Patient demographics
    - Trend analysis
    """
    try:
        with get_db() as (cursor, connection):
            # Verify doctor exists
            cursor.execute("SELECT doctor_id FROM doctor WHERE doctor_id = %s", (doctor_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            # Consultations per day in the last N days
            cursor.execute(
                f"""SELECT 
                    ts.available_date as consultation_date,
                    COUNT(*) as total_consultations,
                    COUNT(CASE WHEN a.status = 'Completed' THEN 1 END) as completed,
                    COUNT(CASE WHEN a.status = 'No-Show' THEN 1 END) as no_shows
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE ts.doctor_id = %s 
                AND ts.available_date >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
                GROUP BY ts.available_date
                ORDER BY ts.available_date DESC""",
                (doctor_id, days)
            )
            daily_analytics = cursor.fetchall()
            
            # Peak hours analysis
            cursor.execute(
                """SELECT 
                    HOUR(ts.start_time) as hour,
                    COUNT(*) as total_consultations,
                    COUNT(CASE WHEN a.status = 'Completed' THEN 1 END) as completed
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE ts.doctor_id = %s 
                AND ts.available_date >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
                GROUP BY HOUR(ts.start_time)
                ORDER BY total_consultations DESC
                LIMIT 5""",
                (doctor_id, days)
            )
            peak_hours = cursor.fetchall()
            
            # Most treated conditions
            cursor.execute(
                """SELECT 
                    c.condition_name,
                    cc.category_name,
                    COUNT(*) as frequency
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN patient_condition pc ON p.patient_id = pc.patient_id
                JOIN conditions c ON pc.condition_id = c.condition_id
                JOIN conditions_category cc ON c.condition_category_id = cc.condition_category_id
                WHERE ts.doctor_id = %s 
                AND ts.available_date >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
                GROUP BY c.condition_id, cc.category_name
                ORDER BY frequency DESC
                LIMIT 10""",
                (doctor_id, days)
            )
            conditions = cursor.fetchall()
            
            # Patient demographics
            cursor.execute(
                """SELECT 
                    u.gender,
                    COUNT(DISTINCT a.patient_id) as patient_count,
                    AVG(TIMESTAMPDIFF(YEAR, u.DOB, CURDATE())) as avg_age
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u ON p.patient_id = u.user_id
                WHERE ts.doctor_id = %s 
                AND ts.available_date >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
                GROUP BY u.gender""",
                (doctor_id, days)
            )
            demographics = cursor.fetchall()
            
            logger.info(f"Retrieved consultation analytics for doctor {doctor_id}")
            
            return {
                "success": True,
                "doctor_id": doctor_id,
                "analysis_period_days": days,
                "daily_analytics": daily_analytics or [],
                "peak_hours": peak_hours or [],
                "most_treated_conditions": conditions or [],
                "patient_demographics": demographics or []
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching consultation analytics for {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch analytics: {str(e)}"
        )


# ============================================
# 2. SCHEDULE MANAGEMENT ENDPOINTS
# ============================================

@router.get("/{doctor_id}/schedule", status_code=status.HTTP_200_OK)
def get_doctor_schedule(
    doctor_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    include_booked: bool = True
):
    """
    Get doctor's complete schedule overview
    
    Parameters:
    - doctor_id: Doctor UUID
    - start_date: Start date for schedule (default: today)
    - end_date: End date for schedule (default: 30 days from start)
    - include_booked: Include booked slots (default: true)
    
    Returns:
    - Full schedule with time slots
    - Booked vs available slots
    - Availability status
    - Break times
    """
    try:
        with get_db() as (cursor, connection):
            # Verify doctor exists
            cursor.execute("SELECT doctor_id FROM doctor WHERE doctor_id = %s", (doctor_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            # Set default dates
            if not start_date:
                start_date = date.today()
            if not end_date:
                end_date = start_date + timedelta(days=30)
            
            # Get time slots
            query = """SELECT 
                ts.time_slot_id,
                ts.available_date,
                ts.start_time,
                ts.end_time,
                ts.is_booked,
                ts.branch_id,
                b.branch_name,
                a.appointment_id,
                a.patient_id,
                u.full_name as patient_name,
                a.status as appointment_status
            FROM time_slot ts
            LEFT JOIN branch b ON ts.branch_id = b.branch_id
            LEFT JOIN appointment a ON ts.time_slot_id = a.time_slot_id
            LEFT JOIN patient p ON a.patient_id = p.patient_id
            LEFT JOIN user u ON p.patient_id = u.user_id
            WHERE ts.doctor_id = %s 
            AND ts.available_date BETWEEN %s AND %s"""
            
            if not include_booked:
                query += " AND ts.is_booked = FALSE"
            
            query += " ORDER BY ts.available_date, ts.start_time"
            
            cursor.execute(query, (doctor_id, start_date, end_date))
            time_slots = cursor.fetchall()
            
            # Calculate statistics
            total_slots = len(time_slots)
            booked_slots = len([ts for ts in time_slots if ts['is_booked']])
            available_slots = total_slots - booked_slots
            
            # Group by date
            schedule_by_date = {}
            for slot in time_slots:
                date_key = str(slot['available_date'])
                if date_key not in schedule_by_date:
                    schedule_by_date[date_key] = []
                schedule_by_date[date_key].append(slot)
            
            logger.info(f"Retrieved schedule for doctor {doctor_id}")
            
            return {
                "success": True,
                "doctor_id": doctor_id,
                "start_date": str(start_date),
                "end_date": str(end_date),
                "statistics": {
                    "total_slots": total_slots,
                    "booked_slots": booked_slots,
                    "available_slots": available_slots,
                    "utilization_rate": round((booked_slots / total_slots * 100) if total_slots > 0 else 0, 2)
                },
                "schedule_by_date": schedule_by_date
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching schedule for doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch schedule: {str(e)}"
        )





