from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from core.database import get_db
import logging
import uuid

router = APIRouter(tags=["medication"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class MedicationCreate(BaseModel):
    generic_name: str = Field(..., min_length=1, max_length=50, description="Generic name of medication")
    manufacturer: str = Field(..., min_length=1, max_length=50, description="Manufacturer name")
    form: str = Field(..., pattern="^(Tablet|Capsule|Injection|Syrup|Other)$", description="Medication form")
    contraindications: Optional[str] = Field(None, description="Contraindications")
    side_effects: Optional[str] = Field(None, description="Known side effects")
    
    @validator('generic_name', 'manufacturer')
    def validate_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty or whitespace')
        return v.strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "generic_name": "Paracetamol",
                "manufacturer": "PharmaCorp",
                "form": "Tablet",
                "contraindications": "Severe liver disease, chronic alcoholism",
                "side_effects": "Nausea, rash, liver damage (overdose)"
            }
        }

class BulkMedicationCreate(BaseModel):
    medications: List[MedicationCreate] = Field(..., min_items=1, max_items=100, description="List of medications to add")
    
    class Config:
        json_schema_extra = {
            "example": {
                "medications": [
                    {
                        "generic_name": "Paracetamol",
                        "manufacturer": "PharmaCorp",
                        "form": "Tablet",
                        "contraindications": "Severe liver disease",
                        "side_effects": "Nausea, rash"
                    },
                    {
                        "generic_name": "Ibuprofen",
                        "manufacturer": "MediLabs",
                        "form": "Capsule",
                        "contraindications": "Peptic ulcer, asthma",
                        "side_effects": "Stomach upset, dizziness"
                    }
                ]
            }
        }

class MedicationUpdate(BaseModel):
    generic_name: Optional[str] = Field(None, min_length=1, max_length=50)
    manufacturer: Optional[str] = Field(None, min_length=1, max_length=50)
    form: Optional[str] = Field(None, pattern="^(Tablet|Capsule|Injection|Syrup|Other)$")
    contraindications: Optional[str] = None
    side_effects: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "contraindications": "Updated contraindications",
                "side_effects": "Updated side effects"
            }
        }

class MedicationResponse(BaseModel):
    success: bool
    message: str
    medication_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Medication added successfully",
                "medication_id": "medication-uuid-here"
            }
        }

class BulkMedicationResult(BaseModel):
    generic_name: str
    manufacturer: str
    form: str
    success: bool
    medication_id: Optional[str] = None
    error_message: Optional[str] = None

class BulkMedicationResponse(BaseModel):
    total_attempted: int
    successful: int
    failed: int
    results: List[BulkMedicationResult]


# ============================================
# CREATE SINGLE MEDICATIONs
# ============================================

@router.post("/bulk", status_code=status.HTTP_201_CREATED, response_model=BulkMedicationResponse)
def create_medications_bulk(bulk_data: BulkMedicationCreate):
    """
    Add multiple medications at once
    
    - Processes each medication individually
    - Returns success/failure for each item
    - Continues processing even if some fail
    - Uses transactions for data integrity
    """
    try:
        logger.info(f"Attempting to add {len(bulk_data.medications)} medications in bulk")
        
        results = []
        successful = 0
        failed = 0
        
        with get_db() as (cursor, connection):
            for med_data in bulk_data.medications:
                try:
                    # Set session variables for OUT parameters
                    cursor.execute("SET @p_medication_id = NULL")
                    cursor.execute("SET @p_error_message = NULL")
                    cursor.execute("SET @p_success = NULL")
                    
                    # Call stored procedure
                    call_sql = """
                        CALL AddMedication(
                            %s, %s, %s, %s, %s,
                            @p_medication_id, @p_error_message, @p_success
                        )
                    """
                    
                    cursor.execute(call_sql, (
                        med_data.generic_name,
                        med_data.manufacturer,
                        med_data.form,
                        med_data.contraindications,
                        med_data.side_effects
                    ))
                    
                    # Get OUT parameters
                    cursor.execute("""
                        SELECT 
                            @p_medication_id as medication_id,
                            @p_error_message as error_message,
                            @p_success as success
                    """)
                    result = cursor.fetchone()
                    
                    if result and (result['success'] == 1 or result['success'] is True):
                        results.append(BulkMedicationResult(
                            generic_name=med_data.generic_name,
                            manufacturer=med_data.manufacturer,
                            form=med_data.form,
                            success=True,
                            medication_id=result['medication_id'],
                            error_message=None
                        ))
                        successful += 1
                        logger.info(f"✅ Added: {med_data.generic_name} - {med_data.manufacturer}")
                    else:
                        error_msg = result['error_message'] if result else "Unknown error"
                        results.append(BulkMedicationResult(
                            generic_name=med_data.generic_name,
                            manufacturer=med_data.manufacturer,
                            form=med_data.form,
                            success=False,
                            medication_id=None,
                            error_message=error_msg
                        ))
                        failed += 1
                        logger.warning(f"❌ Failed: {med_data.generic_name} - {error_msg}")
                
                except Exception as e:
                    results.append(BulkMedicationResult(
                        generic_name=med_data.generic_name,
                        manufacturer=med_data.manufacturer,
                        form=med_data.form,
                        success=False,
                        medication_id=None,
                        error_message=str(e)
                    ))
                    failed += 1
                    logger.error(f"❌ Error processing {med_data.generic_name}: {str(e)}")
        
        logger.info(f"Bulk add complete - Success: {successful}, Failed: {failed}")
        
        return BulkMedicationResponse(
            total_attempted=len(bulk_data.medications),
            successful=successful,
            failed=failed,
            results=results
        )
                
    except Exception as e:
        logger.error(f"Unexpected error in bulk add: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


# ============================================
# GET ALL MEDICATIONS
# ============================================

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_medications(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    form_filter: Optional[str] = Query(None, pattern="^(Tablet|Capsule|Injection|Syrup|Other)$"),
    search: Optional[str] = Query(None, min_length=1, description="Search by generic name or manufacturer")
):
    """Get all medications with optional filters"""
    try:
        with get_db() as (cursor, connection):
            # Build WHERE clause
            where_conditions = []
            params = []
            
            if form_filter:
                where_conditions.append("form = %s")
                params.append(form_filter)
            
            if search:
                where_conditions.append("(generic_name LIKE %s OR manufacturer LIKE %s)")
                search_param = f"%{search}%"
                params.extend([search_param, search_param])
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            # Get total count
            count_query = f"SELECT COUNT(*) as total FROM medication WHERE {where_clause}"
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']
            
            # Get medications
            query = f"""
                SELECT * FROM medication 
                WHERE {where_clause}
                ORDER BY generic_name, manufacturer
                LIMIT %s OFFSET %s
            """
            params.extend([limit, skip])
            
            cursor.execute(query, params)
            medications = cursor.fetchall()
            
            return {
                "total": total,
                "returned": len(medications),
                "medications": medications or []
            }
    except Exception as e:
        logger.error(f"Error fetching medications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET MEDICATION BY ID
# ============================================

@router.get("/{medication_id}", status_code=status.HTTP_200_OK)
def get_medication_by_id(medication_id: str):
    """Get medication details by ID"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(medication_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid medication ID format: {medication_id}"
            )
        
        with get_db() as (cursor, connection):
            cursor.execute(
                "SELECT * FROM medication WHERE medication_id = %s",
                (medication_id,)
            )
            medication = cursor.fetchone()
            
            if not medication:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Medication with ID {medication_id} not found"
                )
            
            # Get prescription count
            cursor.execute(
                """SELECT COUNT(*) as prescription_count 
                   FROM prescription_item 
                   WHERE medication_id = %s""",
                (medication_id,)
            )
            usage_stats = cursor.fetchone()
            
            return {
                "medication": medication,
                "usage_stats": {
                    "total_prescriptions": usage_stats['prescription_count']
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching medication {medication_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# UPDATE MEDICATION
# ============================================

@router.patch("/{medication_id}", status_code=status.HTTP_200_OK)
def update_medication(medication_id: str, update_data: MedicationUpdate):
    """Update medication details"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(medication_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid medication ID format: {medication_id}"
            )
        
        with get_db() as (cursor, connection):
            # Check if medication exists
            cursor.execute(
                "SELECT * FROM medication WHERE medication_id = %s",
                (medication_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Medication with ID {medication_id} not found"
                )
            
            # Build update query
            updates = []
            params = []
            
            if update_data.generic_name is not None:
                updates.append("generic_name = %s")
                params.append(update_data.generic_name.strip())
            
            if update_data.manufacturer is not None:
                updates.append("manufacturer = %s")
                params.append(update_data.manufacturer.strip())
            
            if update_data.form is not None:
                updates.append("form = %s")
                params.append(update_data.form)
            
            if update_data.contraindications is not None:
                updates.append("contraindications = %s")
                params.append(update_data.contraindications)
            
            if update_data.side_effects is not None:
                updates.append("side_effects = %s")
                params.append(update_data.side_effects)
            
            if not updates:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            params.append(medication_id)
            
            update_query = f"""
                UPDATE medication 
                SET {', '.join(updates)}
                WHERE medication_id = %s
            """
            
            cursor.execute(update_query, params)
            connection.commit()
            
            # Fetch updated medication
            cursor.execute(
                "SELECT * FROM medication WHERE medication_id = %s",
                (medication_id,)
            )
            updated_medication = cursor.fetchone()
            
            logger.info(f"Medication {medication_id} updated")
            
            return {
                "success": True,
                "message": "Medication updated successfully",
                "medication": updated_medication
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating medication {medication_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# DELETE MEDICATION
# ============================================

@router.delete("/{medication_id}", status_code=status.HTTP_200_OK)
def delete_medication(medication_id: str, force: bool = False):
    """Delete a medication (checks for dependencies)"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(medication_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid medication ID format: {medication_id}"
            )
        
        with get_db() as (cursor, connection):
            # Check if medication exists
            cursor.execute(
                "SELECT * FROM medication WHERE medication_id = %s",
                (medication_id,)
            )
            medication = cursor.fetchone()
            
            if not medication:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Medication with ID {medication_id} not found"
                )
            
            # Check for prescription dependencies
            cursor.execute(
                "SELECT COUNT(*) as count FROM prescription_item WHERE medication_id = %s",
                (medication_id,)
            )
            prescription_count = cursor.fetchone()['count']
            
            if prescription_count > 0 and not force:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": f"Cannot delete medication with {prescription_count} prescription(s)",
                        "prescription_count": prescription_count,
                        "hint": "Add ?force=true to delete anyway (not recommended)"
                    }
                )
            
            # Delete medication
            cursor.execute(
                "DELETE FROM medication WHERE medication_id = %s",
                (medication_id,)
            )
            connection.commit()
            
            logger.info(f"✅ Medication {medication_id} deleted (force={force})")
            
            return {
                "success": True,
                "message": "Medication deleted successfully",
                "medication_id": medication_id,
                "was_forced": force,
                "had_prescriptions": prescription_count > 0
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting medication {medication_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# GET MEDICATIONS BY FORM
# ============================================

@router.get("/by-form/{form}", status_code=status.HTTP_200_OK)
def get_medications_by_form(form: str):
    """Get all medications of a specific form"""
    valid_forms = ['Tablet', 'Capsule', 'Injection', 'Syrup', 'Other']
    
    if form not in valid_forms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid form. Must be one of: {', '.join(valid_forms)}"
        )
    
    try:
        with get_db() as (cursor, connection):
            cursor.execute(
                "SELECT * FROM medication WHERE form = %s ORDER BY generic_name",
                (form,)
            )
            medications = cursor.fetchall()
            
            return {
                "form": form,
                "count": len(medications),
                "medications": medications or []
            }
    except Exception as e:
        logger.error(f"Error fetching medications by form {form}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# SEARCH MEDICATIONS
# ============================================

@router.get("/search/advanced", status_code=status.HTTP_200_OK)
def search_medications(
    query: str = Query(..., min_length=1, description="Search term for medication name or manufacturer"),
    form: Optional[str] = Query(None, pattern="^(Tablet|Capsule|Injection|Syrup|Other)$", description="Filter by medication form"),
    limit: int = Query(50, ge=1, le=200, description="Maximum results to return"),
    include_stats: bool = Query(False, description="Include usage statistics")
):
    """
    Advanced search for medications
    
    - Searches generic_name and manufacturer
    - Case-insensitive partial matching
    - Optional filtering by form
    - Optional usage statistics
    - Returns sorted by relevance (exact matches first)
    
    **Example queries:**
    - `?query=paracetamol` - Find all paracetamol medications
    - `?query=pharma&form=Tablet` - Find tablets from PharmaCorp
    - `?query=ibu&include_stats=true` - Search with usage statistics
    """
    try:
        logger.info(f"Searching medications with query: '{query}', form: {form}")
        
        with get_db() as (cursor, connection):
            # Build search query
            search_pattern = f"%{query}%"
            
            base_query = """
                SELECT 
                    m.*,
                    CASE 
                        WHEN LOWER(m.generic_name) = LOWER(%s) THEN 1
                        WHEN LOWER(m.generic_name) LIKE LOWER(%s) THEN 2
                        WHEN LOWER(m.manufacturer) = LOWER(%s) THEN 3
                        WHEN LOWER(m.manufacturer) LIKE LOWER(%s) THEN 4
                        ELSE 5
                    END as relevance_score
                FROM medication m
                WHERE (
                    LOWER(m.generic_name) LIKE LOWER(%s) OR 
                    LOWER(m.manufacturer) LIKE LOWER(%s)
                )
            """
            
            params = [query, f"{query}%", query, f"{query}%", search_pattern, search_pattern]
            
            # Add form filter if provided
            if form:
                base_query += " AND m.form = %s"
                params.append(form)
            
            # Order by relevance and limit
            base_query += """
                ORDER BY relevance_score ASC, m.generic_name ASC
                LIMIT %s
            """
            params.append(limit)
            
            cursor.execute(base_query, params)
            medications = cursor.fetchall()
            
            # Add usage statistics if requested
            if include_stats and medications:
                medication_ids = [med['medication_id'] for med in medications]
                placeholders = ','.join(['%s'] * len(medication_ids))
                
                stats_query = f"""
                    SELECT 
                        medication_id,
                        COUNT(*) as prescription_count,
                        COUNT(DISTINCT pi.prescription_id) as unique_prescriptions
                    FROM prescription_item pi
                    WHERE medication_id IN ({placeholders})
                    GROUP BY medication_id
                """
                
                cursor.execute(stats_query, medication_ids)
                stats_data = {row['medication_id']: row for row in cursor.fetchall()}
                
                # Merge stats with medications
                for med in medications:
                    med_id = med['medication_id']
                    if med_id in stats_data:
                        med['usage_stats'] = {
                            'prescription_count': stats_data[med_id]['prescription_count'],
                            'unique_prescriptions': stats_data[med_id]['unique_prescriptions']
                        }
                    else:
                        med['usage_stats'] = {
                            'prescription_count': 0,
                            'unique_prescriptions': 0
                        }
                    
                    # Remove relevance_score from response
                    if 'relevance_score' in med:
                        del med['relevance_score']
            else:
                # Remove relevance_score from response
                for med in medications:
                    if 'relevance_score' in med:
                        del med['relevance_score']
            
            logger.info(f"Found {len(medications)} medications for query '{query}'")
            
            return {
                "query": query,
                "form_filter": form,
                "total_found": len(medications),
                "medications": medications or [],
                "search_tips": {
                    "tip1": "Use partial names for broader results (e.g., 'para' for 'Paracetamol')",
                    "tip2": "Add form filter to narrow down results",
                    "tip3": "Set include_stats=true to see prescription counts"
                } if len(medications) == 0 else None
            }
            
    except Exception as e:
        logger.error(f"Error searching medications with query '{query}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search error: {str(e)}"
        )


