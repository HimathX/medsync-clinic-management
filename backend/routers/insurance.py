from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
from datetime import date
from pydantic import BaseModel, Field
from core.database import get_db
import logging

router = APIRouter(tags=["insurance"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class InsurancePackageCreate(BaseModel):
    package_name: str = Field(..., max_length=100, description="Package name")
    annual_limit: float = Field(..., gt=0, description="Annual coverage limit")
    copayment_percentage: float = Field(..., ge=0, le=100, description="Copayment percentage (0-100)")
    description: Optional[str] = Field(None, description="Package description")
    is_active: bool = Field(True, description="Package active status")
    
    class Config:
        json_schema_extra = {
            "example": {
                "package_name": "Premium Health Plan",
                "annual_limit": 1500000.00,
                "copayment_percentage": 15.00,
                "description": "Comprehensive coverage for all medical needs",
                "is_active": True
            }
        }

class InsurancePackageUpdate(BaseModel):
    package_name: Optional[str] = Field(None, max_length=100)
    annual_limit: Optional[float] = Field(None, gt=0)
    copayment_percentage: Optional[float] = Field(None, ge=0, le=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PatientInsuranceCreate(BaseModel):
    patient_id: str = Field(..., description="Patient ID (UUID)")
    insurance_package_id: str = Field(..., description="Insurance package ID (UUID)")
    start_date: date = Field(..., description="Insurance start date")
    end_date: date = Field(..., description="Insurance end date")
    status: str = Field("Pending", pattern="^(Active|Inactive|Expired|Pending)$")
    
    class Config:
        json_schema_extra = {
            "example": {
                "patient_id": "patient-uuid-here",
                "insurance_package_id": "package-uuid-here",
                "start_date": "2025-10-15",
                "end_date": "2026-10-14",
                "status": "Active"
            }
        }

class PatientInsuranceUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(Active|Inactive|Expired|Pending)$")
    end_date: Optional[date] = None


# ============================================
# INSURANCE PACKAGE ENDPOINTS
# ============================================

@router.post("/packages", status_code=status.HTTP_201_CREATED)
def create_insurance_package(package_data: InsurancePackageCreate):
    """Create a new insurance package"""
    try:
        with get_db() as (cursor, connection):
            # Check for duplicate package name
            cursor.execute(
                "SELECT COUNT(*) as count FROM insurance_package WHERE package_name = %s",
                (package_data.package_name,)
            )
            if cursor.fetchone()['count'] > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insurance package with this name already exists"
                )
            
            # Generate UUID
            import uuid
            package_id = str(uuid.uuid4())
            
            # Insert package
            cursor.execute(
                """INSERT INTO insurance_package (
                    insurance_package_id, package_name, annual_limit, 
                    copayment_percentage, description, is_active
                ) VALUES (%s, %s, %s, %s, %s, %s)""",
                (
                    package_id,
                    package_data.package_name,
                    package_data.annual_limit,
                    package_data.copayment_percentage,
                    package_data.description,
                    package_data.is_active
                )
            )
            
            connection.commit()
            
            # Fetch created package
            cursor.execute(
                "SELECT * FROM insurance_package WHERE insurance_package_id = %s",
                (package_id,)
            )
            package = cursor.fetchone()
            
            logger.info(f"Insurance package created: {package_id}")
            
            return {
                "success": True,
                "message": "Insurance package created successfully",
                "package": package
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating insurance package: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


@router.get("/packages", status_code=status.HTTP_200_OK)
def get_all_insurance_packages(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    is_active: Optional[bool] = None
):
    """Get all insurance packages with optional filters"""
    try:
        with get_db() as (cursor, connection):
            query = "SELECT * FROM insurance_package WHERE 1=1"
            params = []
            
            if is_active is not None:
                query += " AND is_active = %s"
                params.append(is_active)
            
            # Get total count
            count_query = query.replace("SELECT *", "SELECT COUNT(*) as total")
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']
            
            # Add pagination
            query += " ORDER BY package_name LIMIT %s OFFSET %s"
            params.extend([limit, skip])
            
            cursor.execute(query, params)
            packages = cursor.fetchall()
            
            return {
                "total": total,
                "returned": len(packages),
                "packages": packages or []
            }
    except Exception as e:
        logger.error(f"Error fetching insurance packages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/packages/{package_id}", status_code=status.HTTP_200_OK)
def get_insurance_package_by_id(package_id: str):
    """Get insurance package details by ID"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute(
                "SELECT * FROM insurance_package WHERE insurance_package_id = %s",
                (package_id,)
            )
            package = cursor.fetchone()
            
            if not package:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Insurance package with ID {package_id} not found"
                )
            
            # Get count of active insurances using this package
            cursor.execute(
                """SELECT COUNT(*) as active_count 
                   FROM insurance 
                   WHERE insurance_package_id = %s AND status = 'Active'""",
                (package_id,)
            )
            active_count = cursor.fetchone()['active_count']
            
            return {
                "package": package,
                "active_insurances_count": active_count
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching insurance package {package_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.patch("/packages/{package_id}", status_code=status.HTTP_200_OK)
def update_insurance_package(package_id: str, update_data: InsurancePackageUpdate):
    """Update insurance package details"""
    try:
        with get_db() as (cursor, connection):
            # Check if package exists
            cursor.execute(
                "SELECT * FROM insurance_package WHERE insurance_package_id = %s",
                (package_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Insurance package with ID {package_id} not found"
                )
            
            # Build update query
            updates = []
            params = []
            
            if update_data.package_name is not None:
                updates.append("package_name = %s")
                params.append(update_data.package_name)
            
            if update_data.annual_limit is not None:
                updates.append("annual_limit = %s")
                params.append(update_data.annual_limit)
            
            if update_data.copayment_percentage is not None:
                updates.append("copayment_percentage = %s")
                params.append(update_data.copayment_percentage)
            
            if update_data.description is not None:
                updates.append("description = %s")
                params.append(update_data.description)
            
            if update_data.is_active is not None:
                updates.append("is_active = %s")
                params.append(update_data.is_active)
            
            if not updates:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            params.append(package_id)
            
            update_query = f"""
                UPDATE insurance_package 
                SET {', '.join(updates)}
                WHERE insurance_package_id = %s
            """
            
            cursor.execute(update_query, params)
            connection.commit()
            
            # Fetch updated package
            cursor.execute(
                "SELECT * FROM insurance_package WHERE insurance_package_id = %s",
                (package_id,)
            )
            updated_package = cursor.fetchone()
            
            logger.info(f"Insurance package {package_id} updated")
            
            return {
                "success": True,
                "message": "Insurance package updated successfully",
                "package": updated_package
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating insurance package {package_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


@router.delete("/packages/{package_id}", status_code=status.HTTP_200_OK)
def delete_insurance_package(package_id: str):
    """Delete (deactivate) an insurance package"""
    try:
        with get_db() as (cursor, connection):
            # Check if package exists
            cursor.execute(
                "SELECT * FROM insurance_package WHERE insurance_package_id = %s",
                (package_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Insurance package with ID {package_id} not found"
                )
            
            # Check if package has active insurances
            cursor.execute(
                """SELECT COUNT(*) as count 
                   FROM insurance 
                   WHERE insurance_package_id = %s AND status = 'Active'""",
                (package_id,)
            )
            active_count = cursor.fetchone()['count']
            
            if active_count > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot delete package with {active_count} active insurance(s)"
                )
            
            # Soft delete (deactivate)
            cursor.execute(
                "UPDATE insurance_package SET is_active = FALSE WHERE insurance_package_id = %s",
                (package_id,)
            )
            connection.commit()
            
            logger.info(f"Insurance package {package_id} deactivated")
            
            return {
                "success": True,
                "message": "Insurance package deactivated successfully"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting insurance package {package_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# PATIENT INSURANCE ENDPOINTS
# ============================================

@router.post("/patient-insurance", status_code=status.HTTP_201_CREATED)
def add_patient_insurance(insurance_data: PatientInsuranceCreate):
    """Add insurance to a patient using stored procedure"""
    try:
        with get_db() as (cursor, connection):
            # Set session variables for OUT parameters
            cursor.execute("SET @p_insurance_id = NULL")
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure
            call_sql = """
                CALL AddPatientInsurance(
                    %s, %s, %s, %s, %s,
                    @p_insurance_id, @p_error_message, @p_success
                )
            """
            
            cursor.execute(call_sql, (
                insurance_data.patient_id,
                insurance_data.insurance_package_id,
                insurance_data.start_date,
                insurance_data.end_date,
                insurance_data.status
            ))
            
            # Get OUT parameters
            cursor.execute("""
                SELECT 
                    @p_insurance_id as insurance_id,
                    @p_error_message as error_message,
                    @p_success as success
            """)
            result = cursor.fetchone()
            
            insurance_id = result['insurance_id']
            error_message = result['error_message']
            success = result['success']
            
            logger.info(f"Patient insurance result - Success: {success}, Insurance ID: {insurance_id}")
            
            if success == 1 or success is True:
                return {
                    "success": True,
                    "message": error_message or "Patient insurance added successfully",
                    "insurance_id": insurance_id
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_message or "Failed to add patient insurance"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding patient insurance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


@router.get("/patient-insurance", status_code=status.HTTP_200_OK)
def get_all_patient_insurances(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status_filter: Optional[str] = Query(None, pattern="^(Active|Inactive|Expired|Pending)$")
):
    """Get all patient insurances with optional filters"""
    try:
        with get_db() as (cursor, connection):
            # Build the count query separately
            count_query = """
                SELECT COUNT(*) as total
                FROM insurance i
                JOIN patient p ON i.patient_id = p.patient_id
                JOIN user u ON p.patient_id = u.user_id
                JOIN insurance_package ip ON i.insurance_package_id = ip.insurance_package_id
                WHERE 1=1
            """
            
            count_params = []
            
            if status_filter:
                count_query += " AND i.status = %s"
                count_params.append(status_filter)
            
            # Execute count query
            cursor.execute(count_query, count_params)
            total = cursor.fetchone()['total']
            
            # Build the main query
            query = """
                SELECT 
                    i.*,
                    u.full_name as patient_name,
                    u.email as patient_email,
                    ip.package_name,
                    ip.annual_limit,
                    ip.copayment_percentage
                FROM insurance i
                JOIN patient p ON i.patient_id = p.patient_id
                JOIN user u ON p.patient_id = u.user_id
                JOIN insurance_package ip ON i.insurance_package_id = ip.insurance_package_id
                WHERE 1=1
            """
            
            params = []
            
            if status_filter:
                query += " AND i.status = %s"
                params.append(status_filter)
            
            # Add pagination - Order by start_date instead of created_at
            query += " ORDER BY i.start_date DESC LIMIT %s OFFSET %s"
            params.extend([limit, skip])
            
            cursor.execute(query, params)
            insurances = cursor.fetchall()
            
            return {
                "total": total,
                "returned": len(insurances),
                "insurances": insurances or []
            }
    except Exception as e:
        logger.error(f"Error fetching patient insurances: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/patient-insurance/{insurance_id}", status_code=status.HTTP_200_OK)
def get_patient_insurance_by_id(insurance_id: str):
    """Get patient insurance details by ID"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute(
                """SELECT 
                    i.*,
                    u.full_name as patient_name,
                    u.email as patient_email,
                    u.NIC as patient_nic,
                    p.blood_group,
                    ip.package_name,
                    ip.annual_limit,
                    ip.copayment_percentage,
                    ip.description as package_description
                FROM insurance i
                JOIN patient p ON i.patient_id = p.patient_id
                JOIN user u ON p.patient_id = u.user_id
                JOIN insurance_package ip ON i.insurance_package_id = ip.insurance_package_id
                WHERE i.insurance_id = %s""",
                (insurance_id,)
            )
            insurance = cursor.fetchone()
            
            if not insurance:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Insurance with ID {insurance_id} not found"
                )
            
            return {"insurance": insurance}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching insurance {insurance_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/patient/{patient_id}/insurances", status_code=status.HTTP_200_OK)
def get_insurances_by_patient(patient_id: str):
    """Get all insurances for a specific patient"""
    try:
        with get_db() as (cursor, connection):
            # Check if patient exists
            cursor.execute("SELECT * FROM patient WHERE patient_id = %s", (patient_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            cursor.execute(
                """SELECT 
                    i.*,
                    ip.package_name,
                    ip.annual_limit,
                    ip.copayment_percentage,
                    ip.description as package_description
                FROM insurance i
                JOIN insurance_package ip ON i.insurance_package_id = ip.insurance_package_id
                WHERE i.patient_id = %s
                ORDER BY i.created_at DESC""",
                (patient_id,)
            )
            insurances = cursor.fetchall()
            
            return {
                "patient_id": patient_id,
                "total": len(insurances),
                "insurances": insurances or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching insurances for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/package/{package_id}/insurances", status_code=status.HTTP_200_OK)
def get_insurances_by_package(package_id: str):
    """Get all insurances for a specific package"""
    try:
        with get_db() as (cursor, connection):
            # Check if package exists
            cursor.execute(
                "SELECT * FROM insurance_package WHERE insurance_package_id = %s",
                (package_id,)
            )
            package = cursor.fetchone()
            
            if not package:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Insurance package with ID {package_id} not found"
                )
            
            cursor.execute(
                """SELECT 
                    i.*,
                    u.full_name as patient_name,
                    u.email as patient_email
                FROM insurance i
                JOIN patient p ON i.patient_id = p.patient_id
                JOIN user u ON p.patient_id = u.user_id
                WHERE i.insurance_package_id = %s
                ORDER BY i.created_at DESC""",
                (package_id,)
            )
            insurances = cursor.fetchall()
            
            return {
                "package_id": package_id,
                "package_name": package['package_name'],
                "total": len(insurances),
                "insurances": insurances or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching insurances for package {package_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.patch("/patient-insurance/{insurance_id}", status_code=status.HTTP_200_OK)
def update_patient_insurance(insurance_id: str, update_data: PatientInsuranceUpdate):
    """Update patient insurance details (status, end_date)"""
    try:
        with get_db() as (cursor, connection):
            # Check if insurance exists
            cursor.execute(
                "SELECT * FROM insurance WHERE insurance_id = %s",
                (insurance_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Insurance with ID {insurance_id} not found"
                )
            
            # Build update query
            updates = []
            params = []
            
            if update_data.status is not None:
                updates.append("status = %s")
                params.append(update_data.status)
            
            if update_data.end_date is not None:
                updates.append("end_date = %s")
                params.append(update_data.end_date)
            
            if not updates:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            params.append(insurance_id)
            
            update_query = f"""
                UPDATE insurance 
                SET {', '.join(updates)}
                WHERE insurance_id = %s
            """
            
            cursor.execute(update_query, params)
            connection.commit()
            
            # Fetch updated record
            cursor.execute(
                "SELECT * FROM insurance WHERE insurance_id = %s",
                (insurance_id,)
            )
            updated_insurance = cursor.fetchone()
            
            logger.info(f"Insurance {insurance_id} updated")
            
            return {
                "success": True,
                "message": "Insurance updated successfully",
                "insurance": updated_insurance
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating insurance {insurance_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


@router.delete("/patient-insurance/{insurance_id}", status_code=status.HTTP_200_OK)
def delete_patient_insurance(insurance_id: str):
    """Delete (mark as Inactive) patient insurance"""
    try:
        with get_db() as (cursor, connection):
            # Check if insurance exists
            cursor.execute(
                "SELECT * FROM insurance WHERE insurance_id = %s",
                (insurance_id,)
            )
            insurance = cursor.fetchone()
            
            if not insurance:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Insurance with ID {insurance_id} not found"
                )
            
            if insurance['status'] == 'Inactive':
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insurance is already inactive"
                )
            
            # Mark as inactive
            cursor.execute(
                "UPDATE insurance SET status = 'Inactive' WHERE insurance_id = %s",
                (insurance_id,)
            )
            connection.commit()
            
            logger.info(f"Insurance {insurance_id} deactivated")
            
            return {
                "success": True,
                "message": "Insurance deactivated successfully"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting insurance {insurance_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


# ============================================
# STATISTICS ENDPOINTS
# ============================================

@router.get("/statistics/summary", status_code=status.HTTP_200_OK)
def get_insurance_statistics():
    """Get overall insurance statistics"""
    try:
        with get_db() as (cursor, connection):
            stats = {}
            
            # Total packages
            cursor.execute("SELECT COUNT(*) as total FROM insurance_package WHERE is_active = TRUE")
            stats['total_active_packages'] = cursor.fetchone()['total']
            
            # Total insurances by status
            cursor.execute("""
                SELECT status, COUNT(*) as count 
                FROM insurance 
                GROUP BY status
            """)
            status_counts = cursor.fetchall()
            stats['insurances_by_status'] = {row['status']: row['count'] for row in status_counts}
            
            # Expiring soon (next 30 days)
            cursor.execute("""
                SELECT COUNT(*) as count 
                FROM insurance 
                WHERE status = 'Active' 
                AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            """)
            stats['expiring_soon'] = cursor.fetchone()['count']
            
            # Most popular package
            cursor.execute("""
                SELECT ip.package_name, COUNT(i.insurance_id) as count
                FROM insurance i
                JOIN insurance_package ip ON i.insurance_package_id = ip.insurance_package_id
                WHERE i.status = 'Active'
                GROUP BY ip.package_name
                ORDER BY count DESC
                LIMIT 1
            """)
            popular = cursor.fetchone()
            stats['most_popular_package'] = popular if popular else None
            
            return {"statistics": stats}
            
    except Exception as e:
        logger.error(f"Error fetching insurance statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )