from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import Optional
from datetime import date, time
from pydantic import BaseModel, Field
from core.database import get_db
from core.auth import get_current_user  # ✅ Import authentication
import logging

router = APIRouter(
    prefix="/api/timeslots",
    tags=["Time Slots"]
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
        allowed_roles: List of allowed roles (e.g., ['admin', 'manager', 'doctor'])
    
    Returns:
        Dependency function
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        print(f"\n🔐 [AUTH] Role check for time slot operation:")
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


# ============================================
# PYDANTIC SCHEMAS
# ============================================

class TimeSlotCreateRequest(BaseModel):
    doctor_id: str = Field(..., description="Doctor ID (UUID)")
    branch_id: str = Field(..., description="Branch ID (UUID)")
    available_date: date = Field(..., description="Available date (YYYY-MM-DD)")
    start_time: time = Field(..., description="Start time (HH:MM:SS)")
    end_time: time = Field(..., description="End time (HH:MM:SS)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "doctor_id": "550e8400-e29b-41d4-a716-446655440000",
                "branch_id": "660e8400-e29b-41d4-a716-446655440000",
                "available_date": "2025-10-20",
                "start_time": "09:00:00",
                "end_time": "09:30:00"
            }
        }


class SingleTimeSlot(BaseModel):
    available_date: date = Field(..., description="Available date (YYYY-MM-DD)")
    start_time: time = Field(..., description="Start time (HH:MM:SS)")
    end_time: time = Field(..., description="End time (HH:MM:SS)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "available_date": "2025-10-20",
                "start_time": "09:00:00",
                "end_time": "09:30:00"
            }
        }


class BulkTimeSlotsRequest(BaseModel):
    doctor_id: str = Field(..., description="Doctor ID (UUID)")
    branch_id: str = Field(..., description="Branch ID (UUID)")
    time_slots: list[SingleTimeSlot] = Field(..., description="Array of time slots to create")
    
    class Config:
        json_schema_extra = {
            "example": {
                "doctor_id": "550e8400-e29b-41d4-a716-446655440000",
                "branch_id": "660e8400-e29b-41d4-a716-446655440000",
                "time_slots": [
                    {
                        "available_date": "2025-10-20",
                        "start_time": "09:00:00",
                        "end_time": "09:30:00"
                    },
                    {
                        "available_date": "2025-10-20",
                        "start_time": "09:30:00",
                        "end_time": "10:00:00"
                    }
                ]
            }
        }


# ============================================
# CREATE TIME SLOTS - ADMIN/MANAGER/DOCTOR ONLY
# ============================================

@router.post(
    "/create",
    status_code=status.HTTP_201_CREATED,
    summary="Create Single Time Slot",
    description="Create a single time slot (Admin/Manager/Docotor only)"
)
async def create_time_slot(
    slot_data: TimeSlotCreateRequest,
    current_user: dict = Depends(require_roles(['admin', 'manager', 'doctor']))
):
    """
    Create a single time slot
    
    **Required Role:** Admin or Manager
    
    **Process:**
    - Validates doctor and branch exist
    - Checks for time conflicts
    - Creates time slot record
    
    **Authentication:** Bearer token required
    """
    logger.info(f"Time slot creation initiated by {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Set session variables for OUT parameters
            cursor.execute("SET @p_time_slot_id = NULL")
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure
            call_sql = """
                CALL CreateTimeSlot(
                    %s, %s, %s, %s, %s,
                    @p_time_slot_id, @p_error_message, @p_success
                )
            """
            
            cursor.execute(call_sql, (
                slot_data.doctor_id,
                slot_data.branch_id,
                slot_data.available_date,
                slot_data.start_time,
                slot_data.end_time
            ))
            
            # Get OUT parameters
            cursor.execute("""
                SELECT 
                    @p_time_slot_id as time_slot_id,
                    @p_error_message as error_message,
                    @p_success as success
            """)
            result = cursor.fetchone()
            
            if result['success'] == 1 or result['success'] is True:
                logger.info(f"✅ Time slot created by {current_user.get('email')}: {result['time_slot_id']}")
                return {
                    "success": True,
                    "message": result['error_message'] or "Time slot created successfully",
                    "time_slot_id": result['time_slot_id']
                }
            else:
                error_msg = result['error_message'] or "Failed to create time slot"
                logger.error(f"❌ Time slot creation failed: {error_msg}")
                
                # Determine appropriate status code
                if "not found" in error_msg.lower():
                    status_code = status.HTTP_404_NOT_FOUND
                elif "conflict" in error_msg.lower() or "already" in error_msg.lower():
                    status_code = status.HTTP_409_CONFLICT
                else:
                    status_code = status.HTTP_400_BAD_REQUEST
                
                raise HTTPException(
                    status_code=status_code,
                    detail=error_msg
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating time slot: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating time slot: {str(e)}"
        )


@router.post(
    "/create-bulk",
    status_code=status.HTTP_201_CREATED,
    summary="Create Multiple Time Slots",
    description="Create multiple time slots in bulk (Admin/Manager/Doctor only)"
)
async def create_bulk_time_slots(
    bulk_data: BulkTimeSlotsRequest,
    current_user: dict = Depends(require_roles(['admin', 'manager', 'doctor']))
):
    """
    Create multiple time slots from an array (bulk create)
    
    **Required Role:** Admin or Manager
    
    **Process:**
    - Validates doctor and branch exist
    - Creates multiple time slots in a single operation
    - Returns summary of created and failed slots
    
    **Authentication:** Bearer token required
    """
    logger.info(f"Bulk time slot creation initiated by {current_user.get('email')} - {len(bulk_data.time_slots)} slots")
    
    try:
        with get_db() as (cursor, connection):
            created_slots = []
            failed_slots = []
            
            for idx, slot in enumerate(bulk_data.time_slots):
                try:
                    # Set session variables for OUT parameters
                    cursor.execute("SET @p_time_slot_id = NULL")
                    cursor.execute("SET @p_error_message = NULL")
                    cursor.execute("SET @p_success = NULL")
                    
                    # Call stored procedure for each slot
                    call_sql = """
                        CALL CreateTimeSlot(
                            %s, %s, %s, %s, %s,
                            @p_time_slot_id, @p_error_message, @p_success
                        )
                    """
                    
                    cursor.execute(call_sql, (
                        bulk_data.doctor_id,
                        bulk_data.branch_id,
                        slot.available_date,
                        slot.start_time,
                        slot.end_time
                    ))
                    
                    # Get OUT parameters
                    cursor.execute("""
                        SELECT 
                            @p_time_slot_id as time_slot_id,
                            @p_error_message as error_message,
                            @p_success as success
                    """)
                    result = cursor.fetchone()
                    
                    if result['success'] == 1 or result['success'] is True:
                        created_slots.append({
                            "time_slot_id": result['time_slot_id'],
                            "available_date": str(slot.available_date),
                            "start_time": str(slot.start_time),
                            "end_time": str(slot.end_time)
                        })
                        logger.info(f"Slot {idx + 1}: Created - ID: {result['time_slot_id']}")
                    else:
                        failed_slots.append({
                            "available_date": str(slot.available_date),
                            "start_time": str(slot.start_time),
                            "end_time": str(slot.end_time),
                            "error": result['error_message'] or "Failed to create time slot"
                        })
                        logger.warning(f"Slot {idx + 1}: Failed - {result['error_message']}")
                        
                except Exception as slot_error:
                    failed_slots.append({
                        "available_date": str(slot.available_date),
                        "start_time": str(slot.start_time),
                        "end_time": str(slot.end_time),
                        "error": str(slot_error)
                    })
                    logger.error(f"Slot {idx + 1}: Error - {str(slot_error)}")
            
            # Summary
            total_requested = len(bulk_data.time_slots)
            total_created = len(created_slots)
            total_failed = len(failed_slots)
            
            logger.info(f"Bulk creation by {current_user.get('email')} - Created: {total_created}, Failed: {total_failed}")
            
            if failed_slots:
                return {
                    "success": total_created > 0,
                    "message": f"Created {total_created} out of {total_requested} time slots",
                    "summary": {
                        "total_requested": total_requested,
                        "total_created": total_created,
                        "total_failed": total_failed
                    },
                    "created_slots": created_slots,
                    "failed_slots": failed_slots
                }
            
            return {
                "success": True,
                "message": f"All {total_created} time slots created successfully",
                "summary": {
                    "total_requested": total_requested,
                    "total_created": total_created,
                    "total_failed": 0
                },
                "created_slots": created_slots
            }
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in bulk time slot creation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating bulk time slots: {str(e)}"
        )


# ============================================
# GET TIME SLOTS - ALL AUTHENTICATED USERS
# ============================================

@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="Get All Time Slots",
    description="Get all time slots with pagination and filters"
)
async def get_all_time_slots(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    is_booked: Optional[bool] = None,
    date_filter: Optional[date] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all time slots with optional filters
    
    **Authentication:** Bearer token required
    
    **Parameters:**
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    - **is_booked**: Filter by booking status (optional)
    - **date_filter**: Filter by specific date (optional)
    """
    logger.info(f"Fetching time slots - User: {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Build base query for data
            query = """
                SELECT 
                    ts.time_slot_id,
                    ts.doctor_id,
                    ts.branch_id,
                    ts.available_date,
                    ts.start_time,
                    ts.end_time,
                    ts.is_booked,
                    ts.created_at,
                    ts.updated_at,
                    u.full_name as doctor_name,
                    b.branch_name
                FROM time_slot ts
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u ON d.doctor_id = u.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE 1=1
            """
            
            params = []
            
            # Add filters
            if is_booked is not None:
                query += " AND ts.is_booked = %s"
                params.append(is_booked)
            
            if date_filter:
                query += " AND ts.available_date = %s"
                params.append(date_filter)
            
            # ✅ FIX: Get total count with proper query
            count_query = """
                SELECT COUNT(*) as total
                FROM time_slot ts
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u ON d.doctor_id = u.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE 1=1
            """
            
            count_params = []
            
            if is_booked is not None:
                count_query += " AND ts.is_booked = %s"
                count_params.append(is_booked)
            
            if date_filter:
                count_query += " AND ts.available_date = %s"
                count_params.append(date_filter)
            
            # Execute count query
            cursor.execute(count_query, count_params)
            count_result = cursor.fetchone()
            
            # ✅ FIX: Handle result properly
            total = 0
            if count_result:
                # Try different ways to access the count
                if isinstance(count_result, dict):
                    total = count_result.get('total', 0)
                elif isinstance(count_result, tuple):
                    total = count_result[0] if count_result else 0
                else:
                    total = int(count_result) if count_result else 0
            
            print(f"\n📊 Count Query Result:")
            print(f"   Result Type: {type(count_result)}")
            print(f"   Result Value: {count_result}")
            print(f"   Total: {total}")
            
            # Add pagination to main query
            query += " ORDER BY ts.available_date, ts.start_time LIMIT %s OFFSET %s"
            params.extend([limit, skip])
            
            # Execute main query
            cursor.execute(query, params)
            time_slots = cursor.fetchall()
            
            # Convert datetime objects to strings for JSON serialization
            result_slots = []
            if time_slots:
                for slot in time_slots:
                    result_slot = dict(slot) if isinstance(slot, dict) else {}
                    
                    # Convert date and time objects to strings
                    if 'available_date' in result_slot and result_slot['available_date']:
                        result_slot['available_date'] = str(result_slot['available_date'])
                    if 'start_time' in result_slot and result_slot['start_time']:
                        result_slot['start_time'] = str(result_slot['start_time'])
                    if 'end_time' in result_slot and result_slot['end_time']:
                        result_slot['end_time'] = str(result_slot['end_time'])
                    if 'created_at' in result_slot and result_slot['created_at']:
                        result_slot['created_at'] = str(result_slot['created_at'])
                    if 'updated_at' in result_slot and result_slot['updated_at']:
                        result_slot['updated_at'] = str(result_slot['updated_at'])
                    
                    result_slots.append(result_slot)
            
            logger.info(f"✅ Fetched {len(result_slots)} time slots (total: {total})")
            
            return {
                "success": True,
                "total": total,
                "count": len(result_slots),
                "skip": skip,
                "limit": limit,
                "time_slots": result_slots
            }
            
    except Exception as e:
        logger.error(f"Error fetching time slots: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get(
    "/{time_slot_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Time Slot Details",
    description="Get detailed information about a specific time slot"
)
async def get_time_slot_by_id(
    time_slot_id: str,
    current_user: dict = Depends(get_current_user)  # ✅ Requires authentication
):
    """
    Get time slot details by ID
    
    **Authentication:** Bearer token required
    
    **Parameters:**
    - **time_slot_id**: UUID of the time slot
    """
    logger.info(f"Fetching time slot {time_slot_id} - User: {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            cursor.execute(
                """SELECT 
                    ts.*,
                    u.full_name as doctor_name,
                    u.email as doctor_email,
                    d.medical_licence_no,
                    d.consultation_fee,
                    b.branch_name
                FROM time_slot ts
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u ON d.doctor_id = u.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE ts.time_slot_id = %s""",
                (time_slot_id,)
            )
            time_slot = cursor.fetchone()
            
            if not time_slot:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Time slot with ID {time_slot_id} not found"
                )
            
            return {
                "success": True,
                "time_slot": time_slot
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching time slot {time_slot_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get(
    "/doctor/{doctor_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Doctor Time Slots",
    description="Get all time slots for a specific doctor"
)
async def get_time_slots_by_doctor(
    doctor_id: str,
    include_past: bool = False,
    is_booked: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)  # ✅ Requires authentication
):
    """
    Get all time slots for a specific doctor
    
    **Authentication:** Bearer token required
    
    **Parameters:**
    - **doctor_id**: UUID of the doctor
    - **include_past**: Include past dates (default: false)
    - **is_booked**: Filter by booking status (optional)
    """
    logger.info(f"Fetching time slots for doctor {doctor_id} - User: {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Check if doctor exists
            cursor.execute("SELECT * FROM doctor WHERE doctor_id = %s", (doctor_id,))
            doctor = cursor.fetchone()
            
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            query = """
                SELECT 
                    ts.*,
                    b.branch_name
                FROM time_slot ts
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE ts.doctor_id = %s
            """
            
            params = [doctor_id]
            
            if not include_past:
                query += " AND ts.available_date >= CURDATE()"
            
            if is_booked is not None:
                query += " AND ts.is_booked = %s"
                params.append(is_booked)
            
            query += " ORDER BY ts.available_date, ts.start_time"
            
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
    "/branch/{branch_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Branch Time Slots",
    description="Get all time slots for a specific branch"
)
async def get_time_slots_by_branch(
    branch_id: str,
    include_past: bool = False,
    is_booked: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)  # ✅ Requires authentication
):
    """
    Get all time slots for a specific branch
    
    **Authentication:** Bearer token required
    
    **Parameters:**
    - **branch_id**: UUID of the branch
    - **include_past**: Include past dates (default: false)
    - **is_booked**: Filter by booking status (optional)
    """
    logger.info(f"Fetching time slots for branch {branch_id} - User: {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Check if branch exists
            cursor.execute("SELECT * FROM branch WHERE branch_id = %s", (branch_id,))
            branch = cursor.fetchone()
            
            if not branch:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Branch with ID {branch_id} not found"
                )
            
            query = """
                SELECT 
                    ts.*,
                    u.full_name as doctor_name
                FROM time_slot ts
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u ON d.doctor_id = u.user_id
                WHERE ts.branch_id = %s
            """
            
            params = [branch_id]
            
            if not include_past:
                query += " AND ts.available_date >= CURDATE()"
            
            if is_booked is not None:
                query += " AND ts.is_booked = %s"
                params.append(is_booked)
            
            query += " ORDER BY ts.available_date, ts.start_time"
            
            cursor.execute(query, params)
            time_slots = cursor.fetchall()
            
            return {
                "success": True,
                "branch_id": branch_id,
                "branch_name": branch['branch_name'],
                "total": len(time_slots),
                "time_slots": time_slots or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching time slots for branch {branch_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get(
    "/available/doctor/{doctor_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Available Doctor Slots",
    description="Get available (not booked) time slots for a doctor"
)
async def get_available_slots_by_doctor(
    doctor_id: str,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: dict = Depends(get_current_user)  # ✅ Requires authentication
):
    """
    Get available (not booked) time slots for a doctor
    
    **Authentication:** Bearer token required
    
    **Parameters:**
    - **doctor_id**: UUID of the doctor
    - **date_from**: Start date for filtering (optional)
    - **date_to**: End date for filtering (optional)
    """
    logger.info(f"Fetching available slots for doctor {doctor_id} - User: {current_user.get('email')}")
    
    try:
        with get_db() as (cursor, connection):
            # Check if doctor exists
            cursor.execute("SELECT * FROM doctor WHERE doctor_id = %s", (doctor_id,))
            doctor = cursor.fetchone()
            
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            query = """
                SELECT 
                    ts.*,
                    b.branch_name
                FROM time_slot ts
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE ts.doctor_id = %s 
                AND ts.is_booked = FALSE
                AND ts.available_date >= CURDATE()
            """
            
            params = [doctor_id]
            
            if date_from:
                query += " AND ts.available_date >= %s"
                params.append(date_from)
            
            if date_to:
                query += " AND ts.available_date <= %s"
                params.append(date_to)
            
            query += " ORDER BY ts.available_date, ts.start_time"
            
            cursor.execute(query, params)
            time_slots = cursor.fetchall()
            
            return {
                "success": True,
                "doctor_id": doctor_id,
                "total_available": len(time_slots),
                "time_slots": time_slots or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching available time slots for doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# DELETE TIME SLOT - ADMIN/MANAGER ONLY
# ============================================

@router.delete(
    "/{time_slot_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Time Slot",
    description="Delete a time slot (Admin/Manager only, only if not booked)"
)
async def delete_time_slot(
    time_slot_id: str,
    current_user: dict = Depends(require_roles(['admin', 'manager']))
):
    """
    Delete a time slot (only if not booked)
    
    **Required Role:** Admin or Manager
    
    **Process:**
    - Checks if time slot exists
    - Verifies slot is not booked
    - Deletes the time slot record
    
    **Authentication:** Bearer token required
    """
    logger.info(f"Time slot deletion initiated by {current_user.get('email')} - Slot: {time_slot_id}")
    
    try:
        with get_db() as (cursor, connection):
            # Check if time slot exists and is not booked
            cursor.execute("""
                SELECT time_slot_id, is_booked, available_date, start_time, end_time
                FROM time_slot
                WHERE time_slot_id = %s
            """, (time_slot_id,))
            
            time_slot = cursor.fetchone()
            
            if not time_slot:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Time slot with ID {time_slot_id} not found"
                )
            
            if time_slot['is_booked']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete booked time slot. Cancel the appointment first."
                )
            
            # Delete time slot
            cursor.execute("DELETE FROM time_slot WHERE time_slot_id = %s", (time_slot_id,))
            connection.commit()
            
            if cursor.rowcount == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to delete time slot"
                )
            
            logger.info(f"✅ Time slot {time_slot_id} deleted by {current_user.get('email')}")
            
            return {
                "success": True,
                "message": "Time slot deleted successfully",
                "deleted_slot": {
                    "time_slot_id": time_slot_id,
                    "available_date": str(time_slot['available_date']),
                    "start_time": str(time_slot['start_time']),
                    "end_time": str(time_slot['end_time'])
                }
            }
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting time slot {time_slot_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting time slot: {str(e)}"
        )
