from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from core.database import get_db
from schemas import PatientRegistrationRequest, PatientRegistrationResponse
import hashlib
import logging

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
                patient_data.country or 'Sri Lanka',  # 6 IN (handle None)
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
    """Get all patients with pagination"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute("SELECT COUNT(*) as total FROM patient")
            result = cursor.fetchone()
            total = result['total'] if result else 0
            
            cursor.execute(
                "SELECT * FROM patient LIMIT %s OFFSET %s",
                (limit, skip)
            )
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