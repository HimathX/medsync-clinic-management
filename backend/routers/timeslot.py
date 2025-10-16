from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
from datetime import date, time
from pydantic import BaseModel, Field
from core.database import get_db
import logging

router = APIRouter(tags=["timeslots"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
                "doctor_id": "doctor-uuid-here",
                "branch_id": "branch-uuid-here",
                "available_date": "2025-10-20",
                "start_time": "09:00:00",
                "end_time": "09:30:00"
            }
        }

class MultipleTimeSlotsRequest(BaseModel):
    doctor_id: str = Field(..., description="Doctor ID (UUID)")
    branch_id: str = Field(..., description="Branch ID (UUID)")
    available_date: date = Field(..., description="Available date (YYYY-MM-DD)")
    start_time: time = Field(..., description="Start time (HH:MM:SS)")
    end_time: time = Field(..., description="End time (HH:MM:SS)")
    slot_duration: int = Field(..., ge=15, le=240, description="Slot duration in minutes (15-240)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "doctor_id": "doctor-uuid-here",
                "branch_id": "branch-uuid-here",
                "available_date": "2025-10-20",
                "start_time": "09:00:00",
                "end_time": "17:00:00",
                "slot_duration": 30
            }
        }

# NEW: Add schemas for bulk creation
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
                    },
                    {
                        "available_date": "2025-10-20",
                        "start_time": "10:00:00",
                        "end_time": "10:30:00"
                    }
                ]
            }
        }

# ============================================
# CREATE TIME SLOTS
# ============================================

@router.post("/create-bulk", status_code=status.HTTP_201_CREATED)
def create_bulk_time_slots(bulk_data: BulkTimeSlotsRequest):
    """Create multiple time slots from an array (bulk create)"""
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
                        logger.info(f"Slot {idx + 1}: Created successfully - ID: {result['time_slot_id']}")
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
            
            logger.info(f"Bulk creation completed - Created: {total_created}, Failed: {total_failed}")
            
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
                "created_slots": created_slots
            }
                
    except Exception as e:
        logger.error(f"Error in bulk time slot creation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating bulk time slots: {str(e)}"
        )


# ============================================
# GET TIME SLOTS
# ============================================

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_time_slots(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    is_booked: Optional[bool] = None,
    date_filter: Optional[date] = None
):
    """Get all time slots with optional filters"""
    try:
        with get_db() as (cursor, connection):
            # Build query
            query = """
                SELECT 
                    ts.*,
                    u.full_name as doctor_name,
                    b.branch_name
                FROM time_slot ts
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u ON d.doctor_id = u.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE 1=1
            """
            
            params = []
            
            if is_booked is not None:
                query += " AND ts.is_booked = %s"
                params.append(is_booked)
            
            if date_filter:
                query += " AND ts.available_date = %s"
                params.append(date_filter)
            
            # Get total count
            count_query = query.replace(
                "SELECT ts.*, u.full_name as doctor_name, b.branch_name",
                "SELECT COUNT(*) as total"
            )
            cursor.execute(count_query, params)
            total_result = cursor.fetchone()
            total = total_result['total'] if total_result else 0
            
            # Add pagination
            query += " ORDER BY ts.available_date, ts.start_time LIMIT %s OFFSET %s"
            params.extend([limit, skip])
            
            cursor.execute(query, params)
            time_slots = cursor.fetchall()
            
            return {
                "total": total,
                "returned": len(time_slots),
                "time_slots": time_slots or []
            }
    except Exception as e:
        logger.error(f"Error fetching time slots: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{time_slot_id}", status_code=status.HTTP_200_OK)
def get_time_slot_by_id(time_slot_id: str):
    """Get time slot details by ID"""
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
            
            return {"time_slot": time_slot}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching time slot {time_slot_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/doctor/{doctor_id}", status_code=status.HTTP_200_OK)
def get_time_slots_by_doctor(
    doctor_id: str,
    include_past: bool = False,
    is_booked: Optional[bool] = None
):
    """Get all time slots for a specific doctor"""
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


@router.get("/branch/{branch_id}", status_code=status.HTTP_200_OK)
def get_time_slots_by_branch(
    branch_id: str,
    include_past: bool = False,
    is_booked: Optional[bool] = None
):
    """Get all time slots for a specific branch"""
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


@router.get("/available/doctor/{doctor_id}", status_code=status.HTTP_200_OK)
def get_available_slots_by_doctor(
    doctor_id: str,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
):
    """Get available (not booked) time slots for a doctor"""
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
# DELETE TIME SLOT
# ============================================

@router.delete("/{time_slot_id}", status_code=status.HTTP_200_OK)
def delete_time_slot(time_slot_id: str):
    """Delete a time slot (only if not booked)"""
    try:
        with get_db() as (cursor, connection):
            # Set session variables for OUT parameters
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure
            call_sql = """
                CALL DeleteTimeSlot(
                    %s,
                    @p_error_message, @p_success
                )
            """
            
            cursor.execute(call_sql, (time_slot_id,))
            
            # Get OUT parameters
            cursor.execute("""
                SELECT 
                    @p_error_message as error_message,
                    @p_success as success
            """)
            result = cursor.fetchone()
            
            error_message = result['error_message']
            success = result['success']
            
            if success == 1 or success is True:
                logger.info(f"Time slot {time_slot_id} deleted successfully")
                return {
                    "success": True,
                    "message": error_message or "Time slot deleted successfully"
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_message or "Failed to delete time slot"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting time slot {time_slot_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting time slot: {str(e)}"
        )
