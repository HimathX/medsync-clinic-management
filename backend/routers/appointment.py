from fastapi import APIRouter, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from typing import Optional
from datetime import date, time, datetime
from pydantic import BaseModel, Field
from core.database import get_db
from core.websocket_manager import manager
import logging

router = APIRouter(tags=["appointments"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class AppointmentBookingRequest(BaseModel):
    patient_id: str = Field(..., description="Patient ID (UUID)")
    time_slot_id: str = Field(..., description="Time slot ID (UUID)")
    notes: Optional[str] = Field(None, description="Additional notes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "patient_id": "patient-uuid-here",
                "time_slot_id": "timeslot-uuid-here",
                "notes": "Patient prefers morning appointments"
            }
        }

class AppointmentBookingResponse(BaseModel):
    success: bool
    message: str
    appointment_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Appointment booked successfully",
                "appointment_id": "appointment-uuid-here"
            }
        }

class AppointmentUpdateRequest(BaseModel):
    status: Optional[str] = Field(None, pattern="^(Scheduled|Completed|Cancelled|No-Show)$")
    notes: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "Completed",
                "notes": "Patient completed consultation"
            }
        }



# ============================================
# WEBSOCKET ENDPOINT
# ============================================

@router.websocket("/ws/doctor/{doctor_id}")
async def websocket_doctor_appointments(websocket: WebSocket, doctor_id: str):
    """
    WebSocket endpoint for real-time appointment updates for a specific doctor
    
    Clients connect to: ws://localhost:8000/api/appointments/ws/doctor/{doctor_id}
    
    Sends updates when:
    - New appointment is booked
    - Appointment is cancelled
    - Time slot availability changes
    """
    await manager.connect(websocket, resource_type='doctor', resource_id=doctor_id)
    
    try:
        while True:
            # Keep connection alive and listen for client messages
            try:
                data = await websocket.receive_text()
                # Handle client ping/pong messages
                if data == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.now().isoformat()})
            except WebSocketDisconnect:
                break
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, resource_type='doctor', resource_id=doctor_id)
        logger.info(f"Client disconnected from doctor {doctor_id} appointments")
    except Exception as e:
        logger.error(f"WebSocket error for doctor {doctor_id}: {e}")
        manager.disconnect(websocket, resource_type='doctor', resource_id=doctor_id)


# ============================================
# BOOKING ENDPOINTS
# ============================================



@router.post("/book", status_code=status.HTTP_201_CREATED, response_model=AppointmentBookingResponse)
async def book_appointment(booking_data: AppointmentBookingRequest):  # ← Changed to async
    """
    Book a new appointment using stored procedure
    
    - Validates patient and time slot
    - Marks time slot as booked
    - Creates appointment record
    - Broadcasts real-time update via WebSocket
    """
    try:
        logger.info(f"Attempting to book appointment - Patient: {booking_data.patient_id}, Time Slot: {booking_data.time_slot_id}")
        
        with get_db() as (cursor, connection):
            # Pre-validation: Check if patient exists
            try:
                cursor.execute(
                    "SELECT patient_id FROM patient WHERE patient_id = %s",
                    (booking_data.patient_id,)
                )
                if not cursor.fetchone():
                    logger.warning(f"Patient not found: {booking_data.patient_id}")
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Patient with ID {booking_data.patient_id} not found"
                    )
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error checking patient: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error validating patient"
                )
            
            # Pre-validation: Check time slot details (🔥 Store doctor_id for WebSocket)
            try:
                cursor.execute(
                    """SELECT 
                        ts.time_slot_id, 
                        ts.is_booked, 
                        ts.available_date,
                        ts.start_time,
                        ts.end_time,
                        ts.doctor_id,
                        u.full_name as doctor_name,
                        b.branch_name
                    FROM time_slot ts
                    JOIN doctor d ON ts.doctor_id = d.doctor_id
                    JOIN user u ON d.doctor_id = u.user_id
                    JOIN branch b ON ts.branch_id = b.branch_id
                    WHERE ts.time_slot_id = %s""",
                    (booking_data.time_slot_id,)
                )
                slot = cursor.fetchone()
                
                if not slot:
                    logger.warning(f"Time slot not found: {booking_data.time_slot_id}")
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Time slot with ID {booking_data.time_slot_id} not found"
                    )
                
                # 🔥 Store doctor_id for WebSocket broadcast later
                doctor_id = slot['doctor_id']
                
                # Check if already booked
                if slot['is_booked'] == 1 or slot['is_booked'] is True:
                    logger.warning(f"Time slot already booked: {booking_data.time_slot_id}")
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail={
                            "error": "Time slot already booked",
                            "slot_details": {
                                "date": str(slot['available_date']),
                                "time": f"{slot['start_time']} - {slot['end_time']}",
                                "doctor": slot['doctor_name'],
                                "branch": slot['branch_name']
                            }
                        }
                    )
                
                # Check if in the past
                if slot['available_date'] < date.today():
                    logger.warning(f"Time slot in the past: {booking_data.time_slot_id}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot book time slot in the past (Date: {slot['available_date']})"
                    )
                
                logger.info(f"Pre-validation passed - Slot available on {slot['available_date']} at {slot['start_time']}")
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error checking time slot: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error validating time slot"
                )
            
            # Set session variables for OUT parameters
            try:
                cursor.execute("SET @p_appointment_id = NULL")
                cursor.execute("SET @p_error_message = NULL")
                cursor.execute("SET @p_success = NULL")
            except Exception as e:
                logger.error(f"Error setting session variables: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database session error"
                )
            
            # Call stored procedure
            try:
                call_sql = """
                    CALL BookAppointment(
                        %s, %s, %s,
                        @p_appointment_id, @p_error_message, @p_success
                    )
                """
                
                cursor.execute(call_sql, (
                    booking_data.patient_id,
                    booking_data.time_slot_id,
                    booking_data.notes
                ))
                
                logger.info("Stored procedure executed successfully")
                
            except Exception as e:
                logger.error(f"Error calling stored procedure: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error executing booking procedure: {str(e)}"
                )
            
            # Get OUT parameters
            try:
                cursor.execute("""
                    SELECT 
                        @p_appointment_id as appointment_id,
                        @p_error_message as error_message,
                        @p_success as success
                """)
                result = cursor.fetchone()
                
                if not result:
                    logger.error("No result from stored procedure")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="No response from booking procedure"
                    )
                
                appointment_id = result['appointment_id']
                error_message = result['error_message']
                success = result['success']
                
                logger.info(f"Stored procedure result - Success: {success}, ID: {appointment_id}, Message: {error_message}")
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error reading procedure output: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error processing booking result"
                )
            
            # Process result
            if success == 1 or success is True:
                logger.info(f"✅ Appointment booked successfully: {appointment_id}")
                
                # 🔥 NEW: BROADCAST WEBSOCKET UPDATE
                try:
                    await manager.broadcast_to_doctor(
                        doctor_id=doctor_id,
                        message={
                            "type": "appointment_booked",
                            "data": {
                                "appointment_id": appointment_id,
                                "time_slot_id": booking_data.time_slot_id,
                                "is_booked": True,
                                "patient_id": booking_data.patient_id,
                                "doctor_id": doctor_id,
                                "available_date": str(slot['available_date']),
                                "start_time": str(slot['start_time']),
                                "end_time": str(slot['end_time']),
                                "doctor_name": slot['doctor_name'],
                                "branch_name": slot['branch_name'],
                                "timestamp": datetime.now().isoformat()
                            }
                        }
                    )
                    logger.info(f"📡 WebSocket broadcast sent for doctor {doctor_id}")
                except Exception as ws_error:
                    # Don't fail the booking if WebSocket broadcast fails
                    logger.error(f"WebSocket broadcast failed (non-critical): {ws_error}")
                
                return AppointmentBookingResponse(
                    success=True,
                    message=error_message or "Appointment booked successfully",
                    appointment_id=appointment_id
                )
            else:
                logger.warning(f"❌ Booking failed: {error_message}")
                
                # Map specific error messages to appropriate status codes
                if error_message:
                    if "already booked" in error_message.lower():
                        status_code = status.HTTP_409_CONFLICT
                    elif "not found" in error_message.lower():
                        status_code = status.HTTP_404_NOT_FOUND
                    elif "past" in error_message.lower():
                        status_code = status.HTTP_400_BAD_REQUEST
                    else:
                        status_code = status.HTTP_400_BAD_REQUEST
                else:
                    status_code = status.HTTP_400_BAD_REQUEST
                    error_message = "Failed to book appointment"
                
                raise HTTPException(
                    status_code=status_code,
                    detail=error_message
                )
                
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error booking appointment: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status_filter: Optional[str] = Query(None, pattern="^(Scheduled|Completed|Cancelled|No-Show)$"),
    date_filter: Optional[date] = None
):
    """Get all appointments with optional filters"""
    try:
        with get_db() as (cursor, connection):
            # Build the WHERE clause
            where_conditions = []
            params = []
            
            if status_filter:
                where_conditions.append("a.status = %s")
                params.append(status_filter)
            
            if date_filter:
                where_conditions.append("ts.available_date = %s")
                params.append(date_filter)
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            # Get total count with a separate query
            count_query = f"""
                SELECT COUNT(*) as total
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u_patient ON p.patient_id = u_patient.user_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u_doctor ON d.doctor_id = u_doctor.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE {where_clause}
            """
            
            cursor.execute(count_query, params)
            total_result = cursor.fetchone()
            total = total_result['total'] if total_result else 0
            
            # Main query with all fields
            query = f"""
                SELECT 
                    a.*,
                    ts.available_date, ts.start_time, ts.end_time, ts.branch_id,
                    u_patient.full_name as patient_name,
                    u_doctor.full_name as doctor_name,
                    b.branch_name
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u_patient ON p.patient_id = u_patient.user_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u_doctor ON d.doctor_id = u_doctor.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE {where_clause}
                ORDER BY ts.available_date DESC, ts.start_time DESC 
                LIMIT %s OFFSET %s
            """
            
            # Add pagination parameters
            params_with_pagination = params + [limit, skip]
            
            cursor.execute(query, params_with_pagination)
            appointments = cursor.fetchall()
            
            return {
                "total": total,
                "returned": len(appointments),
                "appointments": appointments or []
            }
    except Exception as e:
        logger.error(f"Error fetching appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{appointment_id}", status_code=status.HTTP_200_OK)
def get_appointment_by_id(appointment_id: str):
    """Get appointment details by ID with all related information"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute(
                """SELECT 
                    a.*,
                    ts.available_date, ts.start_time, ts.end_time, ts.branch_id, ts.doctor_id,
                    u_patient.full_name as patient_name, u_patient.email as patient_email,
                    p.blood_group,
                    u_doctor.full_name as doctor_name, u_doctor.email as doctor_email,
                    d.medical_licence_no, d.consultation_fee,
                    b.branch_name
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u_patient ON p.patient_id = u_patient.user_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u_doctor ON d.doctor_id = u_doctor.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE a.appointment_id = %s""",
                (appointment_id,)
            )
            appointment = cursor.fetchone()
            
            if not appointment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Appointment with ID {appointment_id} not found"
                )
            
            # Check if consultation record exists
            cursor.execute(
                "SELECT * FROM consultation_record WHERE appointment_id = %s",
                (appointment_id,)
            )
            consultation = cursor.fetchone()
            
            return {
                "appointment": appointment,
                "consultation_record": consultation
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching appointment {appointment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/patient/{patient_id}", status_code=status.HTTP_200_OK)
def get_appointments_by_patient(
    patient_id: str,
    include_past: bool = False
):
    """Get all appointments for a specific patient"""
    try:
        with get_db() as (cursor, connection):
            # Check if patient exists
            cursor.execute("SELECT * FROM patient WHERE patient_id = %s", (patient_id,))
            patient = cursor.fetchone()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient with ID {patient_id} not found"
                )
            
            query = """
                SELECT 
                    a.*,
                    ts.available_date, ts.start_time, ts.end_time,
                    u_doctor.full_name as doctor_name,
                    b.branch_name
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u_doctor ON d.doctor_id = u_doctor.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE a.patient_id = %s
            """
            
            params = [patient_id]
            
            if not include_past:
                query += " AND ts.available_date >= CURDATE()"
            
            query += " ORDER BY ts.available_date DESC, ts.start_time DESC"
            
            cursor.execute(query, params)
            appointments = cursor.fetchall()
            
            return {
                "patient_id": patient_id,
                "total": len(appointments),
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


@router.get("/doctor/{doctor_id}", status_code=status.HTTP_200_OK)
def get_appointments_by_doctor(
    doctor_id: str,
    include_past: bool = False
):
    """Get all appointments for a specific doctor"""
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
                    a.*,
                    ts.available_date, ts.start_time, ts.end_time,
                    u_patient.full_name as patient_name,
                    b.branch_name
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u_patient ON p.patient_id = u_patient.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE ts.doctor_id = %s
            """
            
            params = [doctor_id]
            
            if not include_past:
                query += " AND ts.available_date >= CURDATE()"
            
            query += " ORDER BY ts.available_date DESC, ts.start_time DESC"
            
            cursor.execute(query, params)
            appointments = cursor.fetchall()
            
            return {
                "doctor_id": doctor_id,
                "total": len(appointments),
                "appointments": appointments or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching appointments for doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/date/{appointment_date}", status_code=status.HTTP_200_OK)
def get_appointments_by_date(appointment_date: date):
    """Get all appointments for a specific date"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute(
                """SELECT 
                    a.*,
                    ts.available_date, ts.start_time, ts.end_time,
                    u_patient.full_name as patient_name,
                    u_doctor.full_name as doctor_name,
                    b.branch_name
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u_patient ON p.patient_id = u_patient.user_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u_doctor ON d.doctor_id = u_doctor.user_id
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE ts.available_date = %s
                ORDER BY ts.start_time""",
                (appointment_date,)
            )
            appointments = cursor.fetchall()
            
            return {
                "date": str(appointment_date),
                "total": len(appointments),
                "appointments": appointments or []
            }
    except Exception as e:
        logger.error(f"Error fetching appointments for date {appointment_date}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================
# UPDATE/CANCEL ENDPOINTS
# ============================================

@router.patch("/{appointment_id}", status_code=status.HTTP_200_OK)
async def update_appointment(  # ← Changed to async
    appointment_id: str,
    update_data: AppointmentUpdateRequest
):
    """Update appointment details (status, notes) with real-time WebSocket updates"""
    try:
        with get_db() as (cursor, connection):
            # Check if appointment exists and get full details including doctor_id
            cursor.execute(
                """SELECT a.*, ts.doctor_id, ts.available_date, ts.start_time, ts.end_time, ts.time_slot_id
                   FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE a.appointment_id = %s""",
                (appointment_id,)
            )
            appointment = cursor.fetchone()
            
            if not appointment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Appointment with ID {appointment_id} not found"
                )
            
            # Store values for WebSocket broadcast
            doctor_id = appointment['doctor_id']
            time_slot_id = appointment['time_slot_id']
            old_status = appointment['status']
            
            # Build update query
            updates = []
            params = []
            
            if update_data.status:
                updates.append("status = %s")
                params.append(update_data.status)
            
            if update_data.notes is not None:
                updates.append("notes = %s")
                params.append(update_data.notes)
            
            if not updates:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            params.append(appointment_id)
            
            update_query = f"""
                UPDATE appointment 
                SET {', '.join(updates)}
                WHERE appointment_id = %s
            """
            
            cursor.execute(update_query, params)
            
            # 🔥 NEW: If status changed to 'Cancelled', free up the time slot
            if update_data.status == 'Cancelled' and old_status != 'Cancelled':
                cursor.execute(
                    "UPDATE time_slot SET is_booked = FALSE WHERE time_slot_id = %s",
                    (time_slot_id,)
                )
                logger.info(f"Time slot {time_slot_id} freed due to cancellation")
            
            connection.commit()
            
            # Fetch updated record
            cursor.execute(
                "SELECT * FROM appointment WHERE appointment_id = %s",
                (appointment_id,)
            )
            updated_appointment = cursor.fetchone()
            
            logger.info(f"Appointment {appointment_id} updated successfully to status: {update_data.status}")
            
            # 🔥 NEW: BROADCAST WEBSOCKET UPDATE based on status change
            try:
                if update_data.status == 'Cancelled' and old_status != 'Cancelled':
                    # Broadcast cancellation
                    await manager.broadcast_to_doctor(
                        doctor_id=doctor_id,
                        message={
                            "type": "appointment_cancelled",
                            "data": {
                                "appointment_id": appointment_id,
                                "time_slot_id": time_slot_id,
                                "is_booked": False,
                                "available_date": str(appointment['available_date']),
                                "start_time": str(appointment['start_time']),
                                "end_time": str(appointment['end_time']),
                                "old_status": old_status,
                                "new_status": update_data.status,
                                "timestamp": datetime.now().isoformat()
                            }
                        }
                    )
                    logger.info(f"📡 WebSocket broadcast sent: appointment_cancelled for doctor {doctor_id}")
                
                elif update_data.status == 'Completed' and old_status != 'Completed':
                    # Broadcast completion
                    await manager.broadcast_to_doctor(
                        doctor_id=doctor_id,
                        message={
                            "type": "appointment_completed",
                            "data": {
                                "appointment_id": appointment_id,
                                "time_slot_id": time_slot_id,
                                "available_date": str(appointment['available_date']),
                                "start_time": str(appointment['start_time']),
                                "end_time": str(appointment['end_time']),
                                "old_status": old_status,
                                "new_status": update_data.status,
                                "timestamp": datetime.now().isoformat()
                            }
                        }
                    )
                    logger.info(f"📡 WebSocket broadcast sent: appointment_completed for doctor {doctor_id}")
                
                elif update_data.status and update_data.status != old_status:
                    # Broadcast generic status change
                    await manager.broadcast_to_doctor(
                        doctor_id=doctor_id,
                        message={
                            "type": "appointment_status_changed",
                            "data": {
                                "appointment_id": appointment_id,
                                "time_slot_id": time_slot_id,
                                "available_date": str(appointment['available_date']),
                                "start_time": str(appointment['start_time']),
                                "end_time": str(appointment['end_time']),
                                "old_status": old_status,
                                "new_status": update_data.status,
                                "timestamp": datetime.now().isoformat()
                            }
                        }
                    )
                    logger.info(f"📡 WebSocket broadcast sent: appointment_status_changed for doctor {doctor_id}")
                    
            except Exception as ws_error:
                # Don't fail the update if WebSocket broadcast fails
                logger.error(f"WebSocket broadcast failed (non-critical): {ws_error}")
            
            return {
                "success": True,
                "message": "Appointment updated successfully",
                "appointment": updated_appointment
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating appointment {appointment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating appointment: {str(e)}"
        )


@router.delete("/{appointment_id}", status_code=status.HTTP_200_OK)
def cancel_appointment(appointment_id: str):  # ← Changed back to sync (no WebSocket)
    """Cancel an appointment and free up the time slot (Hard delete alternative - use PATCH for status update)"""
    try:
        with get_db() as (cursor, connection):
            # Get appointment details
            cursor.execute(
                """SELECT a.*, ts.time_slot_id
                   FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE a.appointment_id = %s""",
                (appointment_id,)
            )
            appointment = cursor.fetchone()
            
            if not appointment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Appointment with ID {appointment_id} not found"
                )
            
            if appointment['status'] in ['Completed', 'Cancelled']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot cancel appointment with status: {appointment['status']}"
                )
            
            time_slot_id = appointment['time_slot_id']
            
            # Update appointment status
            cursor.execute(
                "UPDATE appointment SET status = 'Cancelled' WHERE appointment_id = %s",
                (appointment_id,)
            )
            
            # Free up the time slot
            cursor.execute(
                "UPDATE time_slot SET is_booked = FALSE WHERE time_slot_id = %s",
                (time_slot_id,)
            )
            
            connection.commit()
            
            logger.info(f"Appointment {appointment_id} cancelled successfully (via DELETE)")
            
            return {
                "success": True,
                "message": "Appointment cancelled successfully. Note: Use PATCH /appointments/{id} for real-time updates.",
                "appointment_id": appointment_id
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling appointment {appointment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while cancelling appointment: {str(e)}"
        )

# ============================================
# TIME SLOT MANAGEMENT
# ============================================

@router.get("/available-slots/{doctor_id}", status_code=status.HTTP_200_OK)
def get_available_time_slots(
    doctor_id: str,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
):
    """Get available time slots for a doctor within a date range"""
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
                SELECT ts.*, b.branch_name
                FROM time_slot ts
                JOIN branch b ON ts.branch_id = b.branch_id
                WHERE ts.doctor_id = %s 
                AND ts.is_booked = FALSE 
                AND ts.available_date >= CURDATE()
            """
            
            params = [doctor_id]
            
            if date_from:
                query += " AND ts.available_date >= %s"
                params.append(date_from) # type: ignore
            
            if date_to:
                query += " AND ts.available_date <= %s"
                params.append(date_to)   # type: ignore
            
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
        logger.error(f"Error fetching time slots for doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/available-slots/branch/{branch_id}", status_code=status.HTTP_200_OK)
def get_available_time_slots_by_branch(
    branch_id: str,
    date_filter: Optional[date] = None
):
    """Get all available time slots for a specific branch"""
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
                    u.full_name as doctor_name,
                    d.consultation_fee
                FROM time_slot ts
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u ON d.doctor_id = u.user_id
                WHERE ts.branch_id = %s 
                AND ts.is_booked = FALSE 
                AND ts.available_date >= CURDATE()
            """
            
            params = [branch_id]
            
            if date_filter:
                query += " AND ts.available_date = %s"
                params.append(date_filter) # type: ignore
            
            query += " ORDER BY ts.available_date, ts.start_time"
            
            cursor.execute(query, params)
            time_slots = cursor.fetchall()
            
            return {
                "branch_id": branch_id,
                "branch_name": branch['branch_name'],
                "total_available": len(time_slots),
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