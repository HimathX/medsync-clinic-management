from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from core.database import get_db
import logging
import uuid
import json

router = APIRouter(tags=["prescription"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class PrescriptionItemCreate(BaseModel):
    medication_id: str = Field(..., description="Medication UUID")
    dosage: str = Field(..., min_length=1, max_length=50, description="Dosage (e.g., '500mg', '2 tablets')")
    frequency: str = Field(..., pattern="^(Once daily|Twice daily|Three times daily|As needed)$")
    duration_days: int = Field(..., gt=0, le=365, description="Duration in days")
    instructions: Optional[str] = Field(None, max_length=500, description="Special instructions")
    
    @validator('medication_id')
    def validate_medication_uuid(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError(f"Invalid medication ID format: {v}")
    
    class Config:
        json_schema_extra = {
            "example": {
                "medication_id": "med-uuid-here",
                "dosage": "500mg",
                "frequency": "Twice daily",
                "duration_days": 7,
                "instructions": "Take with food"
            }
        }

class PrescriptionCreate(BaseModel):
    consultation_rec_id: str = Field(..., description="Consultation record UUID")
    items: List[PrescriptionItemCreate] = Field(..., min_items=1, max_items=20)
    
    @validator('consultation_rec_id')
    def validate_consultation_uuid(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError(f"Invalid consultation record ID format: {v}")
    
    class Config:
        json_schema_extra = {
            "example": {
                "consultation_rec_id": "consultation-uuid-here",
                "items": [
                    {
                        "medication_id": "med-uuid-1",
                        "dosage": "500mg",
                        "frequency": "Twice daily",
                        "duration_days": 7,
                        "instructions": "Take with food"
                    },
                    {
                        "medication_id": "med-uuid-2",
                        "dosage": "10mg",
                        "frequency": "Once daily",
                        "duration_days": 30,
                        "instructions": "Take at bedtime"
                    }
                ]
            }
        }

class PrescriptionItemUpdate(BaseModel):
    dosage: Optional[str] = Field(None, max_length=50)
    frequency: Optional[str] = Field(None, pattern="^(Once daily|Twice daily|Three times daily|As needed)$")
    duration_days: Optional[int] = Field(None, gt=0, le=365)
    instructions: Optional[str] = Field(None, max_length=500)

class PrescriptionResponse(BaseModel):
    success: bool
    message: str
    items_added: Optional[int] = None


# ============================================
# CREATE PRESCRIPTION WITH ITEMS
# ============================================

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=PrescriptionResponse)
def create_prescription(prescription_data: PrescriptionCreate):
    """
    Add prescription with multiple items using stored procedure
    
    - Validates consultation record exists
    - Validates all medications exist
    - Creates all prescription items in one transaction
    """
    try:
        logger.info(f"Creating prescription for consultation: {prescription_data.consultation_rec_id}")
        
        # Convert items to JSON format for stored procedure
        items_json = json.dumps([
            {
                "medication_id": item.medication_id,
                "dosage": item.dosage,
                "frequency": item.frequency,
                "duration_days": item.duration_days,
                "instructions": item.instructions or ""
            }
            for item in prescription_data.items
        ])
        
        with get_db() as (cursor, connection):
            # Set session variables for OUT parameters
            cursor.execute("SET @p_items_added = NULL")
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure
            call_sql = """
                CALL AddPrescriptionWithItems(
                    %s, %s,
                    @p_items_added, @p_error_message, @p_success
                )
            """
            
            cursor.execute(call_sql, (
                prescription_data.consultation_rec_id,
                items_json
            ))
            
            # Get OUT parameters
            cursor.execute("""
                SELECT 
                    @p_items_added as items_added,
                    @p_error_message as error_message,
                    @p_success as success
            """)
            result = cursor.fetchone()
            
            if not result:
                logger.error("No result from stored procedure")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="No response from prescription procedure"
                )
            
            items_added = result['items_added']
            error_message = result['error_message']
            success = result['success']
            
            logger.info(f"Procedure result - Success: {success}, Items: {items_added}, Message: {error_message}")
            
            # Process result
            if success == 1 or success is True:
                logger.info(f"✅ Prescription created successfully with {items_added} items")
                return PrescriptionResponse(
                    success=True,
                    message=error_message or f"Prescription added successfully with {items_added} items",
                    items_added=items_added
                )
            else:
                logger.warning(f"❌ Prescription creation failed: {error_message}")
                
                # Map specific error messages to status codes
                if error_message:
                    if "not found" in error_message.lower():
                        status_code = status.HTTP_404_NOT_FOUND
                    elif "required" in error_message.lower():
                        status_code = status.HTTP_400_BAD_REQUEST
                    else:
                        status_code = status.HTTP_400_BAD_REQUEST
                else:
                    status_code = status.HTTP_400_BAD_REQUEST
                    error_message = "Failed to create prescription"
                
                raise HTTPException(
                    status_code=status_code,
                    detail=error_message
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating prescription: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


# ============================================
# GET PRESCRIPTION BY CONSULTATION
# ============================================

@router.get("/consultation/{consultation_rec_id}", status_code=status.HTTP_200_OK)
def get_prescription_by_consultation(consultation_rec_id: str):
    """Get all prescription items for a specific consultation"""
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
            
            # Get prescription items with medication details
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
            items = cursor.fetchall()
            
            return {
                "consultation_rec_id": consultation_rec_id,
                "consultation_date": str(consultation['created_at']),
                "total_items": len(items),
                "prescription_items": items or []
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prescription for consultation {consultation_rec_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET PRESCRIPTION ITEM BY ID
# ============================================

@router.get("/item/{prescription_item_id}", status_code=status.HTTP_200_OK)
def get_prescription_item(prescription_item_id: str):
    """Get a specific prescription item by ID"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(prescription_item_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid prescription item ID format: {prescription_item_id}"
            )
        
        with get_db() as (cursor, connection):
            cursor.execute(
                """SELECT 
                    pi.*,
                    m.generic_name,
                    m.manufacturer,
                    m.form,
                    m.contraindications,
                    m.side_effects,
                    cr.appointment_id,
                    cr.symptoms,
                    cr.diagnoses
                FROM prescription_item pi
                JOIN medication m ON pi.medication_id = m.medication_id
                JOIN consultation_record cr ON pi.consultation_rec_id = cr.consultation_rec_id
                WHERE pi.prescription_item_id = %s""",
                (prescription_item_id,)
            )
            item = cursor.fetchone()
            
            if not item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Prescription item with ID {prescription_item_id} not found"
                )
            
            return {"prescription_item": item}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prescription item {prescription_item_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET ALL PRESCRIPTIONS (WITH FILTERS)
# ============================================

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_prescriptions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    medication_id: Optional[str] = None
):
    """Get all prescription items with optional filters"""
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
            
            if medication_id:
                where_conditions.append("pi.medication_id = %s")
                params.append(medication_id)
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            # Get total count
            count_query = f"""
                SELECT COUNT(*) as total
                FROM prescription_item pi
                JOIN consultation_record cr ON pi.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE {where_clause}
            """
            
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']
            
            # Main query
            query = f"""
                SELECT 
                    pi.*,
                    m.generic_name,
                    m.manufacturer,
                    m.form,
                    cr.consultation_rec_id,
                    cr.symptoms,
                    cr.diagnoses,
                    a.appointment_id,
                    a.patient_id,
                    ts.doctor_id,
                    ts.available_date as prescription_date
                FROM prescription_item pi
                JOIN medication m ON pi.medication_id = m.medication_id
                JOIN consultation_record cr ON pi.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE {where_clause}
                ORDER BY pi.created_at DESC
                LIMIT %s OFFSET %s
            """
            
            params.extend([limit, skip])
            cursor.execute(query, params)
            items = cursor.fetchall()
            
            return {
                "total": total,
                "returned": len(items),
                "prescription_items": items or []
            }
    except Exception as e:
        logger.error(f"Error fetching prescriptions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# UPDATE PRESCRIPTION ITEM
# ============================================

@router.patch("/item/{prescription_item_id}", status_code=status.HTTP_200_OK)
def update_prescription_item(prescription_item_id: str, update_data: PrescriptionItemUpdate):
    """Update a prescription item (dosage, frequency, duration, or instructions)"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(prescription_item_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid prescription item ID format: {prescription_item_id}"
            )
        
        with get_db() as (cursor, connection):
            # Check if item exists
            cursor.execute(
                "SELECT * FROM prescription_item WHERE prescription_item_id = %s",
                (prescription_item_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Prescription item with ID {prescription_item_id} not found"
                )
            
            # Build update query
            updates = []
            params = []
            
            if update_data.dosage is not None:
                updates.append("dosage = %s")
                params.append(update_data.dosage)
            
            if update_data.frequency is not None:
                updates.append("frequency = %s")
                params.append(update_data.frequency)
            
            if update_data.duration_days is not None:
                updates.append("duration_days = %s")
                params.append(update_data.duration_days)
            
            if update_data.instructions is not None:
                updates.append("instructions = %s")
                params.append(update_data.instructions)
            
            if not updates:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            params.append(prescription_item_id)
            
            update_query = f"""
                UPDATE prescription_item 
                SET {', '.join(updates)}
                WHERE prescription_item_id = %s
            """
            
            cursor.execute(update_query, params)
            connection.commit()
            
            # Fetch updated item
            cursor.execute(
                """SELECT pi.*, m.generic_name, m.manufacturer, m.form
                   FROM prescription_item pi
                   JOIN medication m ON pi.medication_id = m.medication_id
                   WHERE pi.prescription_item_id = %s""",
                (prescription_item_id,)
            )
            updated_item = cursor.fetchone()
            
            logger.info(f"Prescription item {prescription_item_id} updated")
            
            return {
                "success": True,
                "message": "Prescription item updated successfully",
                "prescription_item": updated_item
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating prescription item {prescription_item_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# DELETE PRESCRIPTION ITEM
# ============================================

@router.delete("/item/{prescription_item_id}", status_code=status.HTTP_200_OK)
def delete_prescription_item(prescription_item_id: str):
    """Delete a prescription item"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(prescription_item_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid prescription item ID format: {prescription_item_id}"
            )
        
        with get_db() as (cursor, connection):
            # Check if item exists
            cursor.execute(
                "SELECT * FROM prescription_item WHERE prescription_item_id = %s",
                (prescription_item_id,)
            )
            item = cursor.fetchone()
            
            if not item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Prescription item with ID {prescription_item_id} not found"
                )
            
            # Delete item
            cursor.execute(
                "DELETE FROM prescription_item WHERE prescription_item_id = %s",
                (prescription_item_id,)
            )
            connection.commit()
            
            logger.info(f"✅ Prescription item {prescription_item_id} deleted")
            
            return {
                "success": True,
                "message": "Prescription item deleted successfully",
                "prescription_item_id": prescription_item_id
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting prescription item {prescription_item_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# GET PATIENT PRESCRIPTION HISTORY
# ============================================

@router.get("/patient/{patient_id}/history", status_code=status.HTTP_200_OK)
def get_patient_prescription_history(patient_id: str):
    """Get complete prescription history for a patient"""
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
            
            # Get prescription history
            cursor.execute(
                """SELECT 
                    pi.*,
                    m.generic_name,
                    m.manufacturer,
                    m.form,
                    cr.consultation_rec_id,
                    cr.symptoms,
                    cr.diagnoses,
                    cr.created_at as consultation_date,
                    a.appointment_id,
                    ts.available_date,
                    u.full_name as doctor_name
                FROM prescription_item pi
                JOIN medication m ON pi.medication_id = m.medication_id
                JOIN consultation_record cr ON pi.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u ON d.doctor_id = u.user_id
                WHERE a.patient_id = %s
                ORDER BY cr.created_at DESC, pi.created_at DESC""",
                (patient_id,)
            )
            history = cursor.fetchall()
            
            # Group by consultation
            consultations = {}
            for item in history:
                consultation_id = item['consultation_rec_id']
                if consultation_id not in consultations:
                    consultations[consultation_id] = {
                        "consultation_rec_id": consultation_id,
                        "consultation_date": str(item['consultation_date']),
                        "available_date": str(item['available_date']),
                        "doctor_name": item['doctor_name'],
                        "symptoms": item['symptoms'],
                        "diagnoses": item['diagnoses'],
                        "medications": []
                    }
                
                consultations[consultation_id]["medications"].append({
                    "prescription_item_id": item['prescription_item_id'],
                    "generic_name": item['generic_name'],
                    "manufacturer": item['manufacturer'],
                    "form": item['form'],
                    "dosage": item['dosage'],
                    "frequency": item['frequency'],
                    "duration_days": item['duration_days'],
                    "instructions": item['instructions']
                })
            
            return {
                "patient_id": patient_id,
                "total_consultations": len(consultations),
                "total_prescriptions": len(history),
                "history": list(consultations.values())
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prescription history for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET MEDICATION USAGE STATISTICS
# ============================================

@router.get("/statistics/medication-usage", status_code=status.HTTP_200_OK)
def get_medication_usage_statistics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100)
):
    """Get most prescribed medications"""
    try:
        with get_db() as (cursor, connection):
            where_clause = "1=1"
            params = []
            
            if start_date:
                where_clause += " AND pi.created_at >= %s"
                params.append(start_date)
            
            if end_date:
                where_clause += " AND pi.created_at <= %s"
                params.append(end_date)
            
            params.append(limit)
            
            query = f"""
                SELECT 
                    m.medication_id,
                    m.generic_name,
                    m.manufacturer,
                    m.form,
                    COUNT(pi.prescription_item_id) as prescription_count,
                    COUNT(DISTINCT pi.consultation_rec_id) as consultation_count,
                    AVG(pi.duration_days) as avg_duration_days
                FROM medication m
                JOIN prescription_item pi ON m.medication_id = pi.medication_id
                WHERE {where_clause}
                GROUP BY m.medication_id, m.generic_name, m.manufacturer, m.form
                ORDER BY prescription_count DESC
                LIMIT %s
            """
            
            cursor.execute(query, params)
            stats = cursor.fetchall()
            
            return {
                "period": {
                    "start_date": start_date,
                    "end_date": end_date
                },
                "top_medications": stats or []
            }
            
    except Exception as e:
        logger.error(f"Error fetching medication usage statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET ALL PRESCRIPTIONS FOR A PATIENT
# ============================================

@router.get("/patient/{patient_id}", status_code=status.HTTP_200_OK)
def get_patient_prescriptions(
    patient_id: str,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of records to return"),
    sort_by: str = Query("recent", description="Sort by: recent, oldest, medication")
):
    """
    Get all prescriptions for a specific patient
    
    Parameters:
    - patient_id: Patient UUID
    - skip: Pagination offset (default: 0)
    - limit: Maximum records to return (default: 10, max: 100)
    - sort_by: Sorting option - recent (newest first), oldest (oldest first), medication (by medication name)
    
    Returns:
    - List of prescriptions with medication details
    - Consultation information
    - Prescription dates and status
    """
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
                "SELECT patient_id, blood_group FROM patient WHERE patient_id = %s",
                (patient_id,)
            )
            patient = cursor.fetchone()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            # Build query with sorting
            sort_order = ""
            if sort_by == "oldest":
                sort_order = "ORDER BY pi.created_at ASC"
            elif sort_by == "medication":
                sort_order = "ORDER BY m.generic_name ASC"
            else:  # recent (default)
                sort_order = "ORDER BY pi.created_at DESC"
            
            # Get total count of prescriptions for the patient
            cursor.execute(
                """SELECT COUNT(DISTINCT pi.prescription_item_id) as total
                FROM prescription_item pi
                JOIN consultation_record cr ON pi.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                WHERE a.patient_id = %s""",
                (patient_id,)
            )
            count_result = cursor.fetchone()
            total_count = count_result['total'] if count_result else 0
            
            # Get prescriptions with medication and consultation details
            query = f"""SELECT 
                    pi.prescription_item_id,
                    pi.consultation_rec_id,
                    pi.medication_id,
                    pi.dosage,
                    pi.frequency,
                    pi.duration_days,
                    pi.instructions,
                    pi.created_at as prescribed_date,
                    m.generic_name,
                    m.manufacturer,
                    m.form,
                    m.contraindications,
                    m.side_effects,
                    cr.appointment_id,
                    cr.symptoms,
                    cr.diagnoses,
                    cr.follow_up_required,
                    cr.follow_up_date,
                    cr.created_at as consultation_date,
                    a.status as appointment_status,
                    d.doctor_id,
                    u.full_name as doctor_name
                FROM prescription_item pi
                JOIN medication m ON pi.medication_id = m.medication_id
                JOIN consultation_record cr ON pi.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u ON d.doctor_id = u.user_id
                WHERE a.patient_id = %s
                {sort_order}
                LIMIT %s OFFSET %s"""
            
            cursor.execute(query, (patient_id, limit, skip))
            prescriptions = cursor.fetchall()
            
            # Group prescriptions by consultation for better organization
            prescriptions_grouped = {}
            for prescription in prescriptions:
                consultation_id = prescription['consultation_rec_id']
                if consultation_id not in prescriptions_grouped:
                    prescriptions_grouped[consultation_id] = {
                        "consultation_rec_id": consultation_id,
                        "appointment_id": prescription['appointment_id'],
                        "appointment_status": prescription['appointment_status'],
                        "consultation_date": str(prescription['consultation_date']),
                        "symptoms": prescription['symptoms'],
                        "diagnoses": prescription['diagnoses'],
                        "follow_up_required": prescription['follow_up_required'],
                        "follow_up_date": str(prescription['follow_up_date']) if prescription['follow_up_date'] else None,
                        "doctor_id": prescription['doctor_id'],
                        "doctor_name": prescription['doctor_name'],
                        "medications": []
                    }
                
                prescriptions_grouped[consultation_id]["medications"].append({
                    "prescription_item_id": prescription['prescription_item_id'],
                    "medication_id": prescription['medication_id'],
                    "generic_name": prescription['generic_name'],
                    "manufacturer": prescription['manufacturer'],
                    "form": prescription['form'],
                    "dosage": prescription['dosage'],
                    "frequency": prescription['frequency'],
                    "duration_days": prescription['duration_days'],
                    "instructions": prescription['instructions'],
                    "contraindications": prescription['contraindications'],
                    "side_effects": prescription['side_effects'],
                    "prescribed_date": str(prescription['prescribed_date'])
                })
            
            logger.info(f"Retrieved {len(prescriptions_grouped)} consultations with prescriptions for patient {patient_id}")
            
            return {
                "success": True,
                "patient_id": patient_id,
                "patient_blood_group": patient['blood_group'],
                "pagination": {
                    "skip": skip,
                    "limit": limit,
                    "total": total_count,
                    "returned": len(prescriptions)
                },
                "sort_by": sort_by,
                "consultations_with_prescriptions": list(prescriptions_grouped.values())
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prescriptions for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

