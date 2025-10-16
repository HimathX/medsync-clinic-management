from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from core.database import get_db
import logging
import uuid
from datetime import time

router = APIRouter(tags=["treatment_catalogue"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class TreatmentCatalogueCreate(BaseModel):
    treatment_name: str = Field(..., min_length=1, max_length=100, description="Treatment name")
    base_price: float = Field(..., gt=0, description="Base price in currency")
    duration: str = Field(..., pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$", description="Duration in HH:MM:SS format")
    description: Optional[str] = Field(None, description="Treatment description")
    
    @validator('treatment_name')
    def validate_treatment_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Treatment name cannot be empty')
        return v.strip()
    
    @validator('duration')
    def validate_duration(cls, v):
        # Validate time format HH:MM:SS
        try:
            hours, minutes, seconds = map(int, v.split(':'))
            if hours < 0 or hours > 23:
                raise ValueError('Hours must be between 0 and 23')
            if minutes < 0 or minutes > 59:
                raise ValueError('Minutes must be between 0 and 59')
            if seconds < 0 or seconds > 59:
                raise ValueError('Seconds must be between 0 and 59')
            if hours == 0 and minutes == 0 and seconds == 0:
                raise ValueError('Duration cannot be 00:00:00')
        except ValueError as e:
            raise ValueError(f'Invalid duration format: {str(e)}')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "treatment_name": "Blood Test - Full Panel",
                "base_price": 2500.00,
                "duration": "00:30:00",
                "description": "Comprehensive blood analysis including CBC, lipid profile, and liver function"
            }
        }

class TreatmentCatalogueUpdate(BaseModel):
    treatment_name: Optional[str] = Field(None, min_length=1, max_length=100)
    base_price: Optional[float] = Field(None, gt=0)
    duration: Optional[str] = Field(None, pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$")
    description: Optional[str] = None
    
    @validator('treatment_name')
    def validate_treatment_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Treatment name cannot be empty')
        return v.strip() if v else v
    
    @validator('duration')
    def validate_duration(cls, v):
        if v is not None:
            try:
                hours, minutes, seconds = map(int, v.split(':'))
                if hours < 0 or hours > 23 or minutes < 0 or minutes > 59 or seconds < 0 or seconds > 59:
                    raise ValueError('Invalid time values')
                if hours == 0 and minutes == 0 and seconds == 0:
                    raise ValueError('Duration cannot be 00:00:00')
            except ValueError as e:
                raise ValueError(f'Invalid duration format: {str(e)}')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "base_price": 2800.00,
                "description": "Updated description"
            }
        }

class TreatmentCatalogueResponse(BaseModel):
    success: bool
    message: str
    treatment_service_code: Optional[str] = None

class BulkTreatmentCreate(BaseModel):
    treatments: List[TreatmentCatalogueCreate] = Field(..., min_items=1, max_items=50)
    
    class Config:
        json_schema_extra = {
            "example": {
                "treatments": [
                    {
                        "treatment_name": "X-Ray Chest",
                        "base_price": 1500.00,
                        "duration": "00:20:00",
                        "description": "Chest X-ray examination"
                    },
                    {
                        "treatment_name": "ECG Test",
                        "base_price": 1000.00,
                        "duration": "00:15:00",
                        "description": "Electrocardiogram test"
                    }
                ]
            }
        }

class BulkTreatmentResult(BaseModel):
    treatment_name: str
    success: bool
    treatment_service_code: Optional[str] = None
    error_message: Optional[str] = None

class BulkTreatmentResponse(BaseModel):
    total_attempted: int
    successful: int
    failed: int
    results: List[BulkTreatmentResult]


# ============================================
# CREATE TREATMENT (SINGLE)
# ============================================

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=TreatmentCatalogueResponse)
def create_treatment(treatment_data: TreatmentCatalogueCreate):
    """
    Add a new treatment to the catalogue
    
    - Validates treatment name uniqueness
    - Validates price and duration
    - Creates treatment record
    """
    try:
        logger.info(f"Creating treatment: {treatment_data.treatment_name}")
        
        with get_db() as (cursor, connection):
            # Check for duplicate treatment name
            cursor.execute(
                "SELECT COUNT(*) as count FROM treatment_catalogue WHERE treatment_name = %s",
                (treatment_data.treatment_name,)
            )
            if cursor.fetchone()['count'] > 0:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Treatment '{treatment_data.treatment_name}' already exists"
                )
            
            # Generate UUID
            treatment_service_code = str(uuid.uuid4())
            
            # Insert treatment
            cursor.execute(
                """INSERT INTO treatment_catalogue (
                    treatment_service_code, treatment_name, base_price, 
                    duration, description
                ) VALUES (%s, %s, %s, %s, %s)""",
                (
                    treatment_service_code,
                    treatment_data.treatment_name,
                    treatment_data.base_price,
                    treatment_data.duration,
                    treatment_data.description
                )
            )
            connection.commit()
            
            logger.info(f"✅ Treatment created successfully: {treatment_service_code}")
            
            return TreatmentCatalogueResponse(
                success=True,
                message="Treatment added successfully",
                treatment_service_code=treatment_service_code
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating treatment: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


# ============================================
# CREATE TREATMENTS (BULK)
# ============================================

@router.post("/bulk", status_code=status.HTTP_201_CREATED, response_model=BulkTreatmentResponse)
def create_treatments_bulk(bulk_data: BulkTreatmentCreate):
    """
    Add multiple treatments at once
    
    - Processes each treatment individually
    - Returns success/failure for each item
    - Continues processing even if some fail
    """
    try:
        logger.info(f"Attempting to add {len(bulk_data.treatments)} treatments in bulk")
        
        results = []
        successful = 0
        failed = 0
        
        with get_db() as (cursor, connection):
            for treatment_data in bulk_data.treatments:
                try:
                    # Check for duplicate
                    cursor.execute(
                        "SELECT COUNT(*) as count FROM treatment_catalogue WHERE treatment_name = %s",
                        (treatment_data.treatment_name,)
                    )
                    if cursor.fetchone()['count'] > 0:
                        results.append(BulkTreatmentResult(
                            treatment_name=treatment_data.treatment_name,
                            success=False,
                            error_message="Treatment already exists"
                        ))
                        failed += 1
                        continue
                    
                    # Generate UUID
                    treatment_service_code = str(uuid.uuid4())
                    
                    # Insert treatment
                    cursor.execute(
                        """INSERT INTO treatment_catalogue (
                            treatment_service_code, treatment_name, base_price, 
                            duration, description
                        ) VALUES (%s, %s, %s, %s, %s)""",
                        (
                            treatment_service_code,
                            treatment_data.treatment_name,
                            treatment_data.base_price,
                            treatment_data.duration,
                            treatment_data.description
                        )
                    )
                    connection.commit()
                    
                    results.append(BulkTreatmentResult(
                        treatment_name=treatment_data.treatment_name,
                        success=True,
                        treatment_service_code=treatment_service_code
                    ))
                    successful += 1
                    logger.info(f"✅ Added: {treatment_data.treatment_name}")
                    
                except Exception as e:
                    results.append(BulkTreatmentResult(
                        treatment_name=treatment_data.treatment_name,
                        success=False,
                        error_message=str(e)
                    ))
                    failed += 1
                    logger.error(f"❌ Failed: {treatment_data.treatment_name} - {str(e)}")
        
        logger.info(f"Bulk add complete - Success: {successful}, Failed: {failed}")
        
        return BulkTreatmentResponse(
            total_attempted=len(bulk_data.treatments),
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
# GET ALL TREATMENTS
# ============================================

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_treatments(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    search: Optional[str] = Query(None, min_length=1, description="Search by treatment name"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter")
):
    """Get all treatments with optional filters"""
    try:
        with get_db() as (cursor, connection):
            # Build WHERE clause
            where_conditions = []
            params = []
            
            if search:
                where_conditions.append("treatment_name LIKE %s")
                params.append(f"%{search}%")
            
            if min_price is not None:
                where_conditions.append("base_price >= %s")
                params.append(min_price)
            
            if max_price is not None:
                where_conditions.append("base_price <= %s")
                params.append(max_price)
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            # Get total count
            count_query = f"SELECT COUNT(*) as total FROM treatment_catalogue WHERE {where_clause}"
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']
            
            # Get treatments
            query = f"""
                SELECT * FROM treatment_catalogue 
                WHERE {where_clause}
                ORDER BY treatment_name
                LIMIT %s OFFSET %s
            """
            params.extend([limit, skip])
            
            cursor.execute(query, params)
            treatments = cursor.fetchall()
            
            return {
                "total": total,
                "returned": len(treatments),
                "treatments": treatments or []
            }
    except Exception as e:
        logger.error(f"Error fetching treatments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET TREATMENT BY ID
# ============================================

@router.get("/{treatment_service_code}", status_code=status.HTTP_200_OK)
def get_treatment_by_id(treatment_service_code: str):
    """Get treatment details by service code"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(treatment_service_code)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid treatment service code format: {treatment_service_code}"
            )
        
        with get_db() as (cursor, connection):
            cursor.execute(
                "SELECT * FROM treatment_catalogue WHERE treatment_service_code = %s",
                (treatment_service_code,)
            )
            treatment = cursor.fetchone()
            
            if not treatment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Treatment with code {treatment_service_code} not found"
                )
            
            # Get usage statistics
            cursor.execute(
                """SELECT COUNT(*) as usage_count 
                   FROM treatment 
                   WHERE treatment_service_code = %s""",
                (treatment_service_code,)
            )
            usage_stats = cursor.fetchone()
            
            return {
                "treatment": treatment,
                "usage_stats": {
                    "total_treatments_performed": usage_stats['usage_count']
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching treatment {treatment_service_code}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# UPDATE TREATMENT
# ============================================

@router.patch("/{treatment_service_code}", status_code=status.HTTP_200_OK)
def update_treatment(treatment_service_code: str, update_data: TreatmentCatalogueUpdate):
    """Update treatment details"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(treatment_service_code)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid treatment service code format: {treatment_service_code}"
            )
        
        with get_db() as (cursor, connection):
            # Check if treatment exists
            cursor.execute(
                "SELECT * FROM treatment_catalogue WHERE treatment_service_code = %s",
                (treatment_service_code,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Treatment with code {treatment_service_code} not found"
                )
            
            # Build update query
            updates = []
            params = []
            
            if update_data.treatment_name is not None:
                # Check for duplicate name
                cursor.execute(
                    """SELECT COUNT(*) as count FROM treatment_catalogue 
                       WHERE treatment_name = %s AND treatment_service_code != %s""",
                    (update_data.treatment_name, treatment_service_code)
                )
                if cursor.fetchone()['count'] > 0:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Treatment name '{update_data.treatment_name}' already exists"
                    )
                updates.append("treatment_name = %s")
                params.append(update_data.treatment_name)
            
            if update_data.base_price is not None:
                updates.append("base_price = %s")
                params.append(update_data.base_price)
            
            if update_data.duration is not None:
                updates.append("duration = %s")
                params.append(update_data.duration)
            
            if update_data.description is not None:
                updates.append("description = %s")
                params.append(update_data.description)
            
            if not updates:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            params.append(treatment_service_code)
            
            update_query = f"""
                UPDATE treatment_catalogue 
                SET {', '.join(updates)}
                WHERE treatment_service_code = %s
            """
            
            cursor.execute(update_query, params)
            connection.commit()
            
            # Fetch updated treatment
            cursor.execute(
                "SELECT * FROM treatment_catalogue WHERE treatment_service_code = %s",
                (treatment_service_code,)
            )
            updated_treatment = cursor.fetchone()
            
            logger.info(f"Treatment {treatment_service_code} updated")
            
            return {
                "success": True,
                "message": "Treatment updated successfully",
                "treatment": updated_treatment
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating treatment {treatment_service_code}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# DELETE TREATMENT
# ============================================

@router.delete("/{treatment_service_code}", status_code=status.HTTP_200_OK)
def delete_treatment(treatment_service_code: str, force: bool = False):
    """Delete a treatment (checks for dependencies)"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(treatment_service_code)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid treatment service code format: {treatment_service_code}"
            )
        
        with get_db() as (cursor, connection):
            # Check if treatment exists
            cursor.execute(
                "SELECT * FROM treatment_catalogue WHERE treatment_service_code = %s",
                (treatment_service_code,)
            )
            treatment = cursor.fetchone()
            
            if not treatment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Treatment with code {treatment_service_code} not found"
                )
            
            # Check for treatment dependencies
            cursor.execute(
                "SELECT COUNT(*) as count FROM treatment WHERE treatment_service_code = %s",
                (treatment_service_code,)
            )
            treatment_count = cursor.fetchone()['count']
            
            if treatment_count > 0 and not force:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": f"Cannot delete treatment with {treatment_count} treatment record(s)",
                        "treatment_count": treatment_count,
                        "hint": "Add ?force=true to delete anyway (not recommended)"
                    }
                )
            
            # Delete treatment
            cursor.execute(
                "DELETE FROM treatment_catalogue WHERE treatment_service_code = %s",
                (treatment_service_code,)
            )
            connection.commit()
            
            logger.info(f"✅ Treatment {treatment_service_code} deleted (force={force})")
            
            return {
                "success": True,
                "message": "Treatment deleted successfully",
                "treatment_service_code": treatment_service_code,
                "was_forced": force,
                "had_treatments": treatment_count > 0
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting treatment {treatment_service_code}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# GET TREATMENT STATISTICS
# ============================================

@router.get("/statistics/usage", status_code=status.HTTP_200_OK)
def get_treatment_statistics(
    limit: int = Query(10, ge=1, le=100, description="Number of top treatments to return")
):
    """Get most performed treatments"""
    try:
        with get_db() as (cursor, connection):
            query = """
                SELECT 
                    tc.treatment_service_code,
                    tc.treatment_name,
                    tc.base_price,
                    tc.duration,
                    COUNT(t.treatment_id) as times_performed,
                    SUM(tc.base_price) as total_revenue
                FROM treatment_catalogue tc
                LEFT JOIN treatment t ON tc.treatment_service_code = t.treatment_service_code
                GROUP BY tc.treatment_service_code, tc.treatment_name, tc.base_price, tc.duration
                ORDER BY times_performed DESC
                LIMIT %s
            """
            
            cursor.execute(query, (limit,))
            stats = cursor.fetchall()
            
            return {
                "top_treatments": stats or []
            }
            
    except Exception as e:
        logger.error(f"Error fetching treatment statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# GET TREATMENTS BY PRICE RANGE
# ============================================

@router.get("/price-range/{min_price}/{max_price}", status_code=status.HTTP_200_OK)
def get_treatments_by_price_range(
    min_price: float = Query(..., ge=0),
    max_price: float = Query(..., ge=0)
):
    """Get all treatments within a price range"""
    if max_price < min_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum price must be greater than or equal to minimum price"
        )
    
    try:
        with get_db() as (cursor, connection):
            cursor.execute(
                """SELECT * FROM treatment_catalogue 
                   WHERE base_price BETWEEN %s AND %s 
                   ORDER BY base_price""",
                (min_price, max_price)
            )
            treatments = cursor.fetchall()
            
            return {
                "price_range": {
                    "min": min_price,
                    "max": max_price
                },
                "count": len(treatments),
                "treatments": treatments or []
            }
    except Exception as e:
        logger.error(f"Error fetching treatments by price range: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )