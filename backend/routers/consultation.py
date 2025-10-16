from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from core.database import get_db
import logging
import uuid
import json
from datetime import date

router = APIRouter(tags=["consultation"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class PrescriptionItemInput(BaseModel):
    medication_id: str = Field(..., description="Medication UUID")
    dosage: str = Field(..., min_length=1, max_length=50)
    frequency: str = Field(..., pattern="^(Once daily|Twice daily|Three times daily|As needed)$")
    duration_days: int = Field(..., gt=0, le=365)
    instructions: Optional[str] = Field(None, max_length=500)
    
    @validator('medication_id')
    def validate_medication_uuid(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError(f"Invalid medication ID format: {v}")

class TreatmentInput(BaseModel):
    treatment_service_code: str = Field(..., description="Treatment service code UUID")
    notes: Optional[str] = Field(None, description="Treatment notes")
    
    @validator('treatment_service_code')
    def validate_treatment_uuid(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError(f"Invalid treatment service code format: {v}")

class ConsultationCreate(BaseModel):
    appointment_id: str = Field(..., description="Appointment UUID")
    symptoms: str = Field(..., min_length=1, description="Patient symptoms")
    diagnoses: str = Field(..., min_length=1, description="Doctor's diagnoses")
    follow_up_required: bool = Field(default=False)
    follow_up_date: Optional[date] = None
    prescription_items: Optional[List[PrescriptionItemInput]] = Field(default=[], max_items=20)
    treatments: Optional[List[TreatmentInput]] = Field(default=[], max_items=10)
    
    @validator('appointment_id')
    def validate_appointment_uuid(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError(f"Invalid appointment ID format: {v}")
    
    @validator('follow_up_date')
    def validate_follow_up_date(cls, v, values):
        if values.get('follow_up_required') and v is None:
            raise ValueError('Follow-up date is required when follow-up is needed')
        if v and v <= date.today():
            raise ValueError('Follow-up date must be in the future')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "appointment_id": "appointment-uuid-here",
                "symptoms": "Fever, headache, and sore throat for 3 days",
                "diagnoses": "Upper respiratory tract infection (URTI)",
                "follow_up_required": True,
                "follow_up_date": "2025-10-25",
                "prescription_items": [
                    {
                        "medication_id": "med-uuid-1",
                        "dosage": "500mg",
                        "frequency": "Twice daily",
                        "duration_days": 7,
                        "instructions": "Take with food"
                    }
                ],
                "treatments": [
                    {
                        "treatment_service_code": "treatment-uuid-1",
                        "notes": "Blood test ordered"
                    }
                ]
            }
        }

class ConsultationUpdate(BaseModel):
    symptoms: Optional[str] = Field(None, min_length=1)
    diagnoses: Optional[str] = Field(None, min_length=1)
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[date] = None

class ConsultationResponse(BaseModel):
    success: bool
    message: str
    consultation_rec_id: Optional[str] = None
    items_added: Optional[int] = None
    treatments_added: Optional[int] = None


# ============================================
# CREATE CONSULTATION WITH DETAILS
# ============================================

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ConsultationResponse)
def create_consultation(consultation_data: ConsultationCreate):
    """
    Create comprehensive consultation record with prescription and treatments
    
    - Creates consultation record
    - Adds prescription items
    - Adds treatments
    - Updates appointment status to 'Completed'
    - All in one atomic transaction
    """
    try:
        logger.info(f"Creating consultation for appointment: {consultation_data.appointment_id}")
        
        # Convert prescription items to JSON
        prescription_json = json.dumps([
            {
                "medication_id": item.medication_id,
                "dosage": item.dosage,
                "frequency": item.frequency,
                "duration_days": item.duration_days,
                "instructions": item.instructions or ""
            }
            for item in (consultation_data.prescription_items or [])
        ]) if consultation_data.prescription_items else None
        
        # Convert treatments to JSON
        treatments_json = json.dumps([
            {
                "treatment_service_code": treatment.treatment_service_code,
                "notes": treatment.notes or ""
            }
            for treatment in (consultation_data.treatments or [])
        ]) if consultation_data.treatments else None
        
        with get_db() as (cursor, connection):
            # Set session variables for OUT parameters
            cursor.execute("SET @p_consultation_rec_id = NULL")
            cursor.execute("SET @p_items_added = NULL")
            cursor.execute("SET @p_treatments_added = NULL")
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure
            call_sql = """
                CALL CreateConsultationWithDetails(
                    %s, %s, %s, %s, %s, %s, %s,
                    @p_consultation_rec_id, @p_items_added, @p_treatments_added,
                    @p_error_message, @p_success
                )
            """
            
            cursor.execute(call_sql, (
                consultation_data.appointment_id,
                consultation_data.symptoms,
                consultation_data.diagnoses,
                consultation_data.follow_up_required,
                consultation_data.follow_up_date,
                prescription_json,
                treatments_json
            ))
            
            # Get OUT parameters
            cursor.execute("""
                SELECT 
                    @p_consultation_rec_id as consultation_rec_id,
                    @p_items_added as items_added,
                    @p_treatments_added as treatments_added,
                    @p_error_message as error_message,
                    @p_success as success
            """)
            result = cursor.fetchone()
            
            if not result:
                logger.error("No result from stored procedure")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="No response from consultation procedure"
                )
            
            consultation_id = result['consultation_rec_id']
            items_added = result['items_added']
            treatments_added = result['treatments_added']
            error_message = result['error_message']
            success = result['success']
            
            logger.info(f"Procedure result - Success: {success}, ID: {consultation_id}, Items: {items_added}, Treatments: {treatments_added}")
            
            # Process result
            if success == 1 or success is True:
                logger.info(f"✅ Consultation created successfully: {consultation_id}")
                return ConsultationResponse(
                    success=True,
                    message=error_message or "Consultation created successfully",
                    consultation_rec_id=consultation_id,
                    items_added=items_added,
                    treatments_added=treatments_added
                )
            else:
                logger.warning(f"❌ Consultation creation failed: {error_message}")
                
                # Map specific error messages to status codes
                if error_message:
                    if "not found" in error_message.lower():
                        status_code = status.HTTP_404_NOT_FOUND
                    elif "already exists" in error_message.lower():
                        status_code = status.HTTP_409_CONFLICT
                    elif "cancelled" in error_message.lower():
                        status_code = status.HTTP_400_BAD_REQUEST
                    elif "required" in error_message.lower():
                        status_code = status.HTTP_400_BAD_REQUEST
                    else:
                        status_code = status.HTTP_400_BAD_REQUEST
                else:
                    status_code = status.HTTP_400_BAD_REQUEST
                    error_message = "Failed to create consultation"
                
                raise HTTPException(
                    status_code=status_code,
                    detail=error_message
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating consultation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


# ============================================
# GET CONSULTATION BY ID
# ============================================

@router.get("/{consultation_rec_id}", status_code=status.HTTP_200_OK)
def get_consultation_by_id(consultation_rec_id: str):
    """Get complete consultation details including prescriptions and treatments"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(consultation_rec_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid consultation record ID format: {consultation_rec_id}"
            )
        
        with get_db() as (cursor, connection):
            # Get consultation record with appointment details
            cursor.execute(
                """SELECT 
                    cr.*,
                    a.appointment_id,
                    a.patient_id,
                    a.status as appointment_status,
                    a.notes as appointment_notes,
                    ts.doctor_id,
                    ts.available_date,
                    ts.start_time,
                    ts.end_time,
                    u_patient.full_name as patient_name,
                    u_patient.email as patient_email,
                    u_doctor.full_name as doctor_name,
                    u_doctor.email as doctor_email,
                    d.consultation_fee,
                    b.branch_name
                FROM consultation_record cr
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u_patient ON p.patient_id = u_patient.user_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u_doctor ON d.doctor_id = u_doctor.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE cr.consultation_rec_id = %s""",
                (consultation_rec_id,)
            )
            consultation = cursor.fetchone()
            
            if not consultation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Consultation record with ID {consultation_rec_id} not found"
                )
            
            # Get prescription items
            cursor.execute(
                """SELECT 
                    pi.*,
                    m.generic_name,
                    m.manufacturer,
                    m.form,
                    m.contraindications,
                    m.side_effects
                FROM prescription_item pi
                JOIN medication m ON pi.medication_id = m.medication_id
                WHERE pi.consultation_rec_id = %s
                ORDER BY pi.created_at""",
                (consultation_rec_id,)
            )
            prescription_items = cursor.fetchall()
            
            # Get treatments
            cursor.execute(
                """SELECT 
                    t.*,
                    tc.treatment_name,
                    tc.base_price,
                    tc.duration,
                    tc.description as treatment_description
                FROM treatment t
                JOIN treatment_catalogue tc ON t.treatment_service_code = tc.treatment_service_code
                WHERE t.consultation_rec_id = %s
                ORDER BY t.created_at""",
                (consultation_rec_id,)
            )
            treatments = cursor.fetchall()
            
            return {
                "consultation": consultation,
                "prescription_items": prescription_items or [],
                "treatments": treatments or [],
                "summary": {
                    "total_prescriptions": len(prescription_items),
                    "total_treatments": len(treatments)
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching consultation {consultation_rec_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET ALL CONSULTATIONS
# ============================================

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_consultations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    follow_up_required: Optional[bool] = None
):
    """Get all consultations with optional filters"""
    try:
        with get_db() as (cursor, connection):
            # Build WHERE clause
            where_conditions = []
            params = []
            
            if patient_id:
                where_conditions.append("a.patient_id = %s")
                params.append(patient_id)
            
            if doctor_id:
                where_conditions.append("ts.doctor_id = %s")
                params.append(doctor_id)
            
            if start_date:
                where_conditions.append("DATE(cr.created_at) >= %s")
                params.append(start_date)
            
            if end_date:
                where_conditions.append("DATE(cr.created_at) <= %s")
                params.append(end_date)
            
            if follow_up_required is not None:
                where_conditions.append("cr.follow_up_required = %s")
                params.append(follow_up_required)
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            # Get total count
            count_query = f"""
                SELECT COUNT(*) as total
                FROM consultation_record cr
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE {where_clause}
            """
            
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']
            
            # Main query
            query = f"""
                SELECT 
                    cr.*,
                    a.patient_id,
                    ts.doctor_id,
                    ts.available_date,
                    u_patient.full_name as patient_name,
                    u_doctor.full_name as doctor_name,
                    b.branch_name,
                    (SELECT COUNT(*) FROM prescription_item pi WHERE pi.consultation_rec_id = cr.consultation_rec_id) as prescription_count,
                    (SELECT COUNT(*) FROM treatment t WHERE t.consultation_rec_id = cr.consultation_rec_id) as treatment_count
                FROM consultation_record cr
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u_patient ON p.patient_id = u_patient.user_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u_doctor ON d.doctor_id = u_doctor.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE {where_clause}
                ORDER BY cr.created_at DESC
                LIMIT %s OFFSET %s
            """
            
            params.extend([limit, skip])
            cursor.execute(query, params)
            consultations = cursor.fetchall()
            
            return {
                "total": total,
                "returned": len(consultations),
                "consultations": consultations or []
            }
    except Exception as e:
        logger.error(f"Error fetching consultations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET CONSULTATION BY APPOINTMENT
# ============================================

@router.get("/appointment/{appointment_id}", status_code=status.HTTP_200_OK)
def get_consultation_by_appointment(appointment_id: str):
    """Get consultation record for a specific appointment"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(appointment_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid appointment ID format: {appointment_id}"
            )
        
        with get_db() as (cursor, connection):
            cursor.execute(
                """SELECT 
                    cr.*,
                    a.patient_id,
                    a.status as appointment_status,
                    ts.doctor_id,
                    ts.available_date,
                    u_patient.full_name as patient_name,
                    u_doctor.full_name as doctor_name
                FROM consultation_record cr
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u_patient ON p.patient_id = u_patient.user_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u_doctor ON d.doctor_id = u_doctor.user_id
                WHERE cr.appointment_id = %s""",
                (appointment_id,)
            )
            consultation = cursor.fetchone()
            
            if not consultation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No consultation record found for appointment {appointment_id}"
                )
            
            # Get prescription items
            cursor.execute(
                """SELECT pi.*, m.generic_name, m.manufacturer, m.form
                   FROM prescription_item pi
                   JOIN medication m ON pi.medication_id = m.medication_id
                   WHERE pi.consultation_rec_id = %s""",
                (consultation['consultation_rec_id'],)
            )
            prescription_items = cursor.fetchall()
            
            # Get treatments
            cursor.execute(
                """SELECT t.*, tc.treatment_name, tc.base_price
                   FROM treatment t
                   JOIN treatment_catalogue tc ON t.treatment_service_code = tc.treatment_service_code
                   WHERE t.consultation_rec_id = %s""",
                (consultation['consultation_rec_id'],)
            )
            treatments = cursor.fetchall()
            
            return {
                "consultation": consultation,
                "prescription_items": prescription_items or [],
                "treatments": treatments or []
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching consultation for appointment {appointment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# UPDATE CONSULTATION
# ============================================

@router.patch("/{consultation_rec_id}", status_code=status.HTTP_200_OK)
def update_consultation(consultation_rec_id: str, update_data: ConsultationUpdate):
    """Update consultation record details"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(consultation_rec_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid consultation record ID format: {consultation_rec_id}"
            )
        
        with get_db() as (cursor, connection):
            # Check if consultation exists
            cursor.execute(
                "SELECT * FROM consultation_record WHERE consultation_rec_id = %s",
                (consultation_rec_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Consultation record with ID {consultation_rec_id} not found"
                )
            
            # Build update query
            updates = []
            params = []
            
            if update_data.symptoms is not None:
                updates.append("symptoms = %s")
                params.append(update_data.symptoms)
            
            if update_data.diagnoses is not None:
                updates.append("diagnoses = %s")
                params.append(update_data.diagnoses)
            
            if update_data.follow_up_required is not None:
                updates.append("follow_up_required = %s")
                params.append(update_data.follow_up_required)
            
            if update_data.follow_up_date is not None:
                updates.append("follow_up_date = %s")
                params.append(update_data.follow_up_date)
            
            if not updates:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            params.append(consultation_rec_id)
            
            update_query = f"""
                UPDATE consultation_record 
                SET {', '.join(updates)}
                WHERE consultation_rec_id = %s
            """
            
            cursor.execute(update_query, params)
            connection.commit()
            
            # Fetch updated consultation
            cursor.execute(
                "SELECT * FROM consultation_record WHERE consultation_rec_id = %s",
                (consultation_rec_id,)
            )
            updated_consultation = cursor.fetchone()
            
            logger.info(f"Consultation {consultation_rec_id} updated")
            
            return {
                "success": True,
                "message": "Consultation updated successfully",
                "consultation": updated_consultation
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating consultation {consultation_rec_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# DELETE CONSULTATION
# ============================================

@router.delete("/{consultation_rec_id}", status_code=status.HTTP_200_OK)
def delete_consultation(consultation_rec_id: str, force: bool = False):
    """Delete a consultation record (checks for dependencies)"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(consultation_rec_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid consultation record ID format: {consultation_rec_id}"
            )
        
        with get_db() as (cursor, connection):
            # Check if consultation exists
            cursor.execute(
                "SELECT * FROM consultation_record WHERE consultation_rec_id = %s",
                (consultation_rec_id,)
            )
            consultation = cursor.fetchone()
            
            if not consultation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Consultation record with ID {consultation_rec_id} not found"
                )
            
            # Check for prescription items
            cursor.execute(
                "SELECT COUNT(*) as count FROM prescription_item WHERE consultation_rec_id = %s",
                (consultation_rec_id,)
            )
            prescription_count = cursor.fetchone()['count']
            
            # Check for treatments
            cursor.execute(
                "SELECT COUNT(*) as count FROM treatment WHERE consultation_rec_id = %s",
                (consultation_rec_id,)
            )
            treatment_count = cursor.fetchone()['count']
            
            if (prescription_count > 0 or treatment_count > 0) and not force:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": f"Cannot delete consultation with {prescription_count} prescription(s) and {treatment_count} treatment(s)",
                        "prescription_count": prescription_count,
                        "treatment_count": treatment_count,
                        "hint": "Add ?force=true to delete anyway (not recommended)"
                    }
                )
            
            # Delete consultation (cascade will handle prescription items and treatments)
            cursor.execute(
                "DELETE FROM consultation_record WHERE consultation_rec_id = %s",
                (consultation_rec_id,)
            )
            connection.commit()
            
            logger.info(f"✅ Consultation {consultation_rec_id} deleted (force={force})")
            
            return {
                "success": True,
                "message": "Consultation deleted successfully",
                "consultation_rec_id": consultation_rec_id,
                "was_forced": force,
                "had_prescriptions": prescription_count > 0,
                "had_treatments": treatment_count > 0
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting consultation {consultation_rec_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# GET PATIENT CONSULTATION HISTORY
# ============================================

@router.get("/patient/{patient_id}/history", status_code=status.HTTP_200_OK)
def get_patient_consultation_history(patient_id: str):
    """Get complete consultation history for a patient"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(patient_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid patient ID format: {patient_id}"
            )
        
        with get_db() as (cursor, connection):
            # Check if patient exists
            cursor.execute(
                "SELECT * FROM patient WHERE patient_id = %s",
                (patient_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            # Get consultation history
            cursor.execute(
                """SELECT 
                    cr.*,
                    ts.available_date,
                    ts.start_time,
                    u_doctor.full_name as doctor_name,
                    b.branch_name,
                    (SELECT COUNT(*) FROM prescription_item pi WHERE pi.consultation_rec_id = cr.consultation_rec_id) as prescription_count,
                    (SELECT COUNT(*) FROM treatment t WHERE t.consultation_rec_id = cr.consultation_rec_id) as treatment_count
                FROM consultation_record cr
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u_doctor ON d.doctor_id = u_doctor.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE a.patient_id = %s
                ORDER BY cr.created_at DESC""",
                (patient_id,)
            )
            history = cursor.fetchall()
            
            return {
                "patient_id": patient_id,
                "total_consultations": len(history),
                "consultations": history or []
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching consultation history for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET CONSULTATION STATISTICS
# ============================================

@router.get("/statistics/summary", status_code=status.HTTP_200_OK)
def get_consultation_statistics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    doctor_id: Optional[str] = None,
    branch_id: Optional[str] = None
):
    """Get consultation statistics and analytics"""
    try:
        with get_db() as (cursor, connection):
            where_conditions = ["1=1"]
            params = []
            
            if start_date:
                where_conditions.append("DATE(cr.created_at) >= %s")
                params.append(start_date)
            
            if end_date:
                where_conditions.append("DATE(cr.created_at) <= %s")
                params.append(end_date)
            
            if doctor_id:
                where_conditions.append("ts.doctor_id = %s")
                params.append(doctor_id)
            
            if branch_id:
                where_conditions.append("ts.branch_id = %s")
                params.append(branch_id)
            
            where_clause = " AND ".join(where_conditions)
            
            # Total consultations
            cursor.execute(f"""
                SELECT COUNT(*) as total
                FROM consultation_record cr
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE {where_clause}
            """, params)
            total_consultations = cursor.fetchone()['total']
            
            # Consultations requiring follow-up
            cursor.execute(f"""
                SELECT COUNT(*) as count
                FROM consultation_record cr
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE {where_clause} AND cr.follow_up_required = TRUE
            """, params)
            follow_up_required = cursor.fetchone()['count']
            
            # Top doctors by consultation count
            cursor.execute(f"""
                SELECT 
                    u.full_name as doctor_name,
                    COUNT(*) as consultation_count
                FROM consultation_record cr
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u ON d.doctor_id = u.user_id
                WHERE {where_clause}
                GROUP BY ts.doctor_id, u.full_name
                ORDER BY consultation_count DESC
                LIMIT 10
            """, params)
            top_doctors = cursor.fetchall()
            
            # Most common diagnoses
            cursor.execute(f"""
                SELECT 
                    diagnoses,
                    COUNT(*) as frequency
                FROM consultation_record cr
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE {where_clause}
                GROUP BY diagnoses
                ORDER BY frequency DESC
                LIMIT 10
            """, params)
            common_diagnoses = cursor.fetchall()
            
            return {
                "period": {
                    "start_date": start_date,
                    "end_date": end_date
                },
                "summary": {
                    "total_consultations": total_consultations,
                    "follow_up_required": follow_up_required,
                    "follow_up_percentage": round((follow_up_required / total_consultations * 100), 2) if total_consultations > 0 else 0
                },
                "top_doctors": top_doctors or [],
                "common_diagnoses": common_diagnoses or []
            }
            
    except Exception as e:
        logger.error(f"Error fetching consultation statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )