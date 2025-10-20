from fastapi import APIRouter, HTTPException, status, Query, WebSocket, WebSocketDisconnect, Depends, Request
from typing import Optional, Dict, Any
from datetime import date, time, datetime
from pydantic import BaseModel, Field
from core.database import get_db
from core.websocket_manager import manager
from core.auth import get_current_user
from core.audit_logger import audit
import logging

router = APIRouter(
    prefix="/api/appointments",
    tags=["Appointments"]
)

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
# AUTHORIZATION HELPERS
# ============================================

def require_roles(allowed_roles: list[str]):
    """
    Dependency to check if user has required role
    
    Args:
        allowed_roles: List of allowed roles
    
    Returns:
        Dependency function
    """
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        user_role = current_user.get('role')
        user_type = current_user.get('user_type')
        
        # Admin always has access
        if user_type == 'employee' and user_role == 'admin':
            return current_user
        
        # Check if user has required role
        if user_type == 'employee' and user_role in allowed_roles:
            return current_user
        
        # Patient access
        if user_type == 'patient' and 'patient' in allowed_roles:
            return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required roles: {', '.join(allowed_roles)}"
        )
    
    return role_checker


# ============================================
# WEBSOCKET ENDPOINT - SIMPLIFIED FOR TESTING
# ============================================

@router.websocket("/ws/doctor/{doctor_id}")
async def websocket_doctor_appointments(
    websocket: WebSocket, 
    doctor_id: str
):
    """
    WebSocket endpoint for real-time appointment updates
    
    **Connection URL:**
    ```
    ws://localhost:8000/api/appointments/ws/doctor/{doctor_id}
    ```
    
    **Example:**
    ```javascript
    const ws = new WebSocket('ws://localhost:8000/api/appointments/ws/doctor/87d716c7-ac10-11f0-96c3-b691d5c60f9c');
    ```
    
    **Messages Sent:**
    - connected: Initial connection confirmation
    - appointment_booked: New appointment created
    - appointment_cancelled: Appointment cancelled
    - appointment_completed: Appointment marked complete
    - pong: Response to ping
    """
    
    logger.info(f"📡 WebSocket connection attempt for doctor: {doctor_id}")
    
    try:
        # Accept connection immediately (no auth check for now)
        await manager.connect(websocket, resource_type='doctor', resource_id=doctor_id)
        
        logger.info(f"✅ WebSocket connected for doctor: {doctor_id}")
        
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "message": f"Connected to doctor {doctor_id} appointment updates",
            "doctor_id": doctor_id,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep connection alive
        while True:
            try:
                # Wait for messages from client
                data = await websocket.receive_text()
                
                logger.debug(f"📨 Received from client: {data}")
                
                # Handle ping/pong
                if data == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    })
                    logger.debug("🏓 Sent pong")
                
                # Handle JSON messages
                elif data.startswith("{"):
                    import json
                    try:
                        message = json.loads(data)
                        message_type = message.get("type")
                        
                        if message_type == "subscribe":
                            await websocket.send_json({
                                "type": "subscribed",
                                "doctor_id": doctor_id,
                                "timestamp": datetime.now().isoformat()
                            })
                            logger.info(f"✅ Client subscribed to doctor {doctor_id}")
                        
                        else:
                            logger.warning(f"Unknown message type: {message_type}")
                    
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON: {data}")
                
            except WebSocketDisconnect:
                logger.info(f"📴 Client disconnected from doctor {doctor_id}")
                break
            
            except Exception as e:
                logger.error(f"Error receiving message: {e}")
                break
    
    except WebSocketDisconnect:
        logger.info(f"📴 WebSocket disconnected during handshake: {doctor_id}")
    
    except Exception as e:
        logger.error(f"❌ WebSocket error for doctor {doctor_id}: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Always disconnect properly
        manager.disconnect(websocket, resource_type='doctor', resource_id=doctor_id)
        logger.info(f"🔌 WebSocket connection closed for doctor: {doctor_id}")


# ============================================
# BOOKING ENDPOINTS
# ============================================

@router.post(
    "/book", 
    status_code=status.HTTP_201_CREATED, 
    response_model=AppointmentBookingResponse,
    summary="Book Appointment",
    description="Book a new appointment (Patient or Staff)"
)
async def book_appointment(
    booking_data: AppointmentBookingRequest,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)  # ✅ JWT Required
):
    """
    Book a new appointment using stored procedure
    
    **Required Auth:** Patient (own appointments) or Staff (any patient)
    
    **Security:**
    - Patients can only book for themselves
    - Staff can book for any patient
    
    **Process:**
    - Validates patient and time slot
    - Marks time slot as booked
    - Creates appointment record
    - Broadcasts real-time update via WebSocket
    """
    user_type = current_user.get('user_type')
    user_id = current_user.get('user_id')
    user_role = current_user.get('role')
    
    logger.info(f"Appointment booking by {current_user.get('email')} ({user_type}/{user_role})")
    
    # Authorization: Patient can only book for themselves
    if user_type == 'patient':
        if user_id != booking_data.patient_id:
            audit.log_failed_access(
                user_id=user_id,
                action_type='BOOK_APPOINTMENT',
                table_name='appointment',
                record_id=booking_data.patient_id,
                reason="Patient attempted to book for another patient",
                ip_address=request.client.host,
                session_id=current_user.get('session_id')
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Patients can only book appointments for themselves"
            )
    
    # Staff can book for any patient (no restriction)
    
    try:
        logger.info(f"Attempting to book appointment - Patient: {booking_data.patient_id}, Time Slot: {booking_data.time_slot_id}")
        
        with get_db() as (cursor, connection):
            # Pre-validation: Check if patient exists
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
            
            # Pre-validation: Check time slot details
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
            
            # Set session variables for OUT parameters
            cursor.execute("SET @p_appointment_id = NULL")
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            # Call stored procedure
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
            
            # Get OUT parameters
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
            
            logger.info(f"Stored procedure result - Success: {success}, ID: {appointment_id}")
            
            # Process result
            if success == 1 or success is True:
                logger.info(f"✅ Appointment booked successfully: {appointment_id}")
                
                # Log audit
                audit.log_access(
                    user_id=user_id,
                    action_type='INSERT',
                    table_name='appointment',
                    record_id=appointment_id,
                    new_values={
                        'patient_id': booking_data.patient_id,
                        'time_slot_id': booking_data.time_slot_id,
                        'booked_by': current_user.get('email')
                    },
                    ip_address=request.client.host,
                    session_id=current_user.get('session_id')
                )
                
                # WebSocket broadcast
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
                                "booked_by": current_user.get('email'),
                                "timestamp": datetime.now().isoformat()
                            }
                        }
                    )
                    logger.info(f"📡 WebSocket broadcast sent for doctor {doctor_id}")
                except Exception as ws_error:
                    logger.error(f"WebSocket broadcast failed (non-critical): {ws_error}")
                
                return AppointmentBookingResponse(
                    success=True,
                    message=error_message or "Appointment booked successfully",
                    appointment_id=appointment_id
                )
            else:
                logger.warning(f"❌ Booking failed: {error_message}")
                
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
                
                raise HTTPException(status_code=status_code, detail=error_message)
                
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


# ============================================
# GET APPOINTMENTS
# ============================================

@router.get(
    "/", 
    status_code=status.HTTP_200_OK,
    summary="Get All Appointments",
    description="Get all appointments (Staff only)"
)
async def get_all_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status_filter: Optional[str] = Query(None, pattern="^(Scheduled|Completed|Cancelled|No-Show)$"),
    date_filter: Optional[date] = None,
    current_user: Dict[str, Any] = Depends(require_roles(['admin', 'manager', 'doctor', 'nurse', 'receptionist']))  # ✅ JWT Required
):
    """
    Get all appointments with optional filters
    
    **Required Role:** Admin, Manager, Doctor, Nurse, or Receptionist
    
    **Filters:**
    - status: Filter by appointment status
    - date: Filter by appointment date
    """
    try:
        with get_db() as (cursor, connection):
            # Build WHERE clause
            where_conditions = []
            params = []
            
            if status_filter:
                where_conditions.append("a.status = %s")
                params.append(status_filter)
            
            if date_filter:
                where_conditions.append("ts.available_date = %s")
                params.append(date_filter)
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            # Get total count
            count_query = f"""
                SELECT COUNT(*) as total
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE {where_clause}
            """
            
            cursor.execute(count_query, params)
            total_result = cursor.fetchone()
            total = total_result['total'] if total_result else 0
            
            # Main query
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
            
            cursor.execute(query, params + [limit, skip])
            appointments = cursor.fetchall()
            
            # Convert datetime to string
            result_appointments = []
            if appointments:
                for appt in appointments:
                    result_appt = dict(appt)
                    for field in ['available_date', 'start_time', 'end_time', 'created_at']:
                        if field in result_appt and result_appt[field]:
                            result_appt[field] = str(result_appt[field])
                    result_appointments.append(result_appt)
            
            return {
                "total": total,
                "returned": len(result_appointments),
                "appointments": result_appointments
            }
    except Exception as e:
        logger.error(f"Error fetching appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get(
    "/{appointment_id}", 
    status_code=status.HTTP_200_OK,
    summary="Get Appointment by ID",
    description="Get appointment details (Patient or Staff)"
)
async def get_appointment_by_id(
    appointment_id: str,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)  # ✅ JWT Required
):
    """
    Get appointment details by ID with all related information
    
    **Access:**
    - Patient: Own appointments only
    - Staff: Any appointment
    """
    user_type = current_user.get('user_type')
    user_id = current_user.get('user_id')
    
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
            
            # Authorization: Patient can only see their own appointments
            if user_type == 'patient' and user_id != appointment['patient_id']:
                audit.log_failed_access(
                    user_id=user_id,
                    action_type='VIEW',
                    table_name='appointment',
                    record_id=appointment_id,
                    reason="Patient attempted to view another patient's appointment",
                    ip_address=request.client.host,
                    session_id=current_user.get('session_id')
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only view your own appointments"
                )
            
            # Log data access
            audit.log_data_access(
                user_id=user_id,
                accessed_user_id=appointment['patient_id'],
                access_type='VIEW',
                resource_type='APPOINTMENT',
                resource_id=appointment_id,
                ip_address=request.client.host,
                session_id=current_user.get('session_id')
            )
            
            # Check if consultation record exists
            cursor.execute(
                "SELECT * FROM consultation_record WHERE appointment_id = %s",
                (appointment_id,)
            )
            consultation = cursor.fetchone()
            
            # Convert datetime to string
            result_appointment = dict(appointment)
            for field in ['available_date', 'start_time', 'end_time', 'created_at']:
                if field in result_appointment and result_appointment[field]:
                    result_appointment[field] = str(result_appointment[field])
            
            return {
                "appointment": result_appointment,
                "consultation_record": dict(consultation) if consultation else None
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching appointment {appointment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get(
    "/patient/{patient_id}", 
    status_code=status.HTTP_200_OK,
    summary="Get Appointments by Patient",
    description="Get all appointments for a patient"
)
async def get_appointments_by_patient(
    patient_id: str,
    include_past: bool = False,
    request: Request = None,
    current_user: Dict[str, Any] = Depends(get_current_user)  # ✅ JWT Required
):
    """
    Get all appointments for a specific patient
    
    **Access:**
    - Patient: Own appointments only
    - Staff: Any patient
    """
    user_type = current_user.get('user_type')
    user_id = current_user.get('user_id')
    
    # Authorization: Patient can only see their own appointments
    if user_type == 'patient' and user_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own appointments"
        )
    
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
            
            # Convert datetime to string
            result_appointments = []
            if appointments:
                for appt in appointments:
                    result_appt = dict(appt)
                    for field in ['available_date', 'start_time', 'end_time', 'created_at']:
                        if field in result_appt and result_appt[field]:
                            result_appt[field] = str(result_appt[field])
                    result_appointments.append(result_appt)
            
            return {
                "patient_id": patient_id,
                "total": len(result_appointments),
                "appointments": result_appointments
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching appointments for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get(
    "/doctor/{doctor_id}", 
    status_code=status.HTTP_200_OK,
    summary="Get Appointments by Doctor",
    description="Get all appointments for a doctor"
)
async def get_appointments_by_doctor(
    doctor_id: str,
    include_past: bool = False,
    current_user: Dict[str, Any] = Depends(require_roles(['admin', 'manager', 'doctor', 'nurse', 'receptionist']))  # ✅ JWT Required
):
    """
    Get all appointments for a specific doctor
    
    **Required Role:** Staff only
    
    **Note:** Doctors can view their own appointments
    """
    user_role = current_user.get('role')
    user_id = current_user.get('user_id')
    
    # Doctor can only see own appointments (unless admin/manager)
    if user_role == 'doctor' and user_id != doctor_id:
        if user_role not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own appointments"
            )
    
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
            
            # Convert datetime to string
            result_appointments = []
            if appointments:
                for appt in appointments:
                    result_appt = dict(appt)
                    for field in ['available_date', 'start_time', 'end_time', 'created_at']:
                        if field in result_appt and result_appt[field]:
                            result_appt[field] = str(result_appt[field])
                    result_appointments.append(result_appt)
            
            return {
                "doctor_id": doctor_id,
                "total": len(result_appointments),
                "appointments": result_appointments
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching appointments for doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get(
    "/date/{appointment_date}", 
    status_code=status.HTTP_200_OK,
    summary="Get Appointments by Date",
    description="Get all appointments for a date (Staff only)"
)
async def get_appointments_by_date(
    appointment_date: date,
    current_user: Dict[str, Any] = Depends(require_roles(['admin', 'manager', 'doctor', 'nurse', 'receptionist']))  # ✅ JWT Required
):
    """
    Get all appointments for a specific date
    
    **Required Role:** Staff only
    """
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
            
            # Convert datetime to string
            result_appointments = []
            if appointments:
                for appt in appointments:
                    result_appt = dict(appt)
                    for field in ['available_date', 'start_time', 'end_time', 'created_at']:
                        if field in result_appt and result_appt[field]:
                            result_appt[field] = str(result_appt[field])
                    result_appointments.append(result_appt)
            
            return {
                "date": str(appointment_date),
                "total": len(result_appointments),
                "appointments": result_appointments
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

@router.patch(
    "/{appointment_id}", 
    status_code=status.HTTP_200_OK,
    summary="Update Appointment",
    description="Update appointment status/notes (Staff only)"
)
async def update_appointment(
    appointment_id: str,
    update_data: AppointmentUpdateRequest,
    request: Request,
    current_user: Dict[str, Any] = Depends(require_roles(['admin', 'doctor', 'nurse', 'receptionist']))  # ✅ JWT Required
):
    """
    Update appointment details (status, notes) with real-time WebSocket updates
    
    **Required Role:** Admin, Doctor, Nurse, or Receptionist
    
    **Status Options:**
    - Scheduled
    - Completed
    - Cancelled
    - No-Show
    """
    try:
        with get_db() as (cursor, connection):
            # Check if appointment exists
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
            
            # If cancelled, free up time slot
            if update_data.status == 'Cancelled' and old_status != 'Cancelled':
                cursor.execute(
                    "UPDATE time_slot SET is_booked = FALSE WHERE time_slot_id = %s",
                    (time_slot_id,)
                )
                logger.info(f"Time slot {time_slot_id} freed due to cancellation")
            
            connection.commit()
            
            # Log audit
            audit.log_access(
                user_id=current_user['user_id'],
                action_type='UPDATE',
                table_name='appointment',
                record_id=appointment_id,
                old_values={'status': old_status},
                new_values={'status': update_data.status},
                ip_address=request.client.host,
                session_id=current_user.get('session_id')
            )
            
            # Fetch updated record
            cursor.execute(
                "SELECT * FROM appointment WHERE appointment_id = %s",
                (appointment_id,)
            )
            updated_appointment = cursor.fetchone()
            
            logger.info(f"Appointment {appointment_id} updated by {current_user.get('email')}")
            
            # WebSocket broadcast
            try:
                if update_data.status == 'Cancelled' and old_status != 'Cancelled':
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
                                "updated_by": current_user.get('email'),
                                "timestamp": datetime.now().isoformat()
                            }
                        }
                    )
                elif update_data.status == 'Completed' and old_status != 'Completed':
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
                                "updated_by": current_user.get('email'),
                                "timestamp": datetime.now().isoformat()
                            }
                        }
                    )
                elif update_data.status and update_data.status != old_status:
                    await manager.broadcast_to_doctor(
                        doctor_id=doctor_id,
                        message={
                            "type": "appointment_status_changed",
                            "data": {
                                "appointment_id": appointment_id,
                                "old_status": old_status,
                                "new_status": update_data.status,
                                "updated_by": current_user.get('email'),
                                "timestamp": datetime.now().isoformat()
                            }
                        }
                    )
            except Exception as ws_error:
                logger.error(f"WebSocket broadcast failed (non-critical): {ws_error}")
            
            return {
                "success": True,
                "message": "Appointment updated successfully",
                "appointment": dict(updated_appointment) if updated_appointment else None
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating appointment {appointment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating appointment: {str(e)}"
        )


@router.delete(
    "/{appointment_id}", 
    status_code=status.HTTP_200_OK,
    summary="Cancel Appointment",
    description="Cancel appointment (Patient or Staff)"
)
async def cancel_appointment(
    appointment_id: str,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)  # ✅ JWT Required
):
    """
    Cancel an appointment and free up the time slot
    
    **Access:**
    - Patient: Own appointments only
    - Staff: Any appointment
    
    **Note:** Use PATCH for real-time WebSocket updates
    """
    user_type = current_user.get('user_type')
    user_id = current_user.get('user_id')
    
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
            
            # Authorization: Patient can only cancel own appointments
            if user_type == 'patient' and user_id != appointment['patient_id']:
                audit.log_failed_access(
                    user_id=user_id,
                    action_type='DELETE',
                    table_name='appointment',
                    record_id=appointment_id,
                    reason="Patient attempted to cancel another patient's appointment",
                    ip_address=request.client.host,
                    session_id=current_user.get('session_id')
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only cancel your own appointments"
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
            
            # Free up time slot
            cursor.execute(
                "UPDATE time_slot SET is_booked = FALSE WHERE time_slot_id = %s",
                (time_slot_id,)
            )
            
            connection.commit()
            
            # Log audit
            audit.log_access(
                user_id=user_id,
                action_type='UPDATE',
                table_name='appointment',
                record_id=appointment_id,
                old_values={'status': appointment['status']},
                new_values={'status': 'Cancelled'},
                ip_address=request.client.host,
                session_id=current_user.get('session_id')
            )
            
            logger.info(f"Appointment {appointment_id} cancelled by {current_user.get('email')}")
            
            return {
                "success": True,
                "message": "Appointment cancelled successfully",
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

@router.get(
    "/available-slots/{doctor_id}", 
    status_code=status.HTTP_200_OK,
    summary="Get Available Slots",
    description="Get available time slots for a doctor (Authenticated users)"
)
async def get_available_time_slots(
    doctor_id: str,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)  # ✅ JWT Required
):
    """
    Get available time slots for a doctor within a date range
    
    **Required Auth:** Any authenticated user
    """
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
                params.append(date_from)
            
            if date_to:
                query += " AND ts.available_date <= %s"
                params.append(date_to)
            
            query += " ORDER BY ts.available_date, ts.start_time"
            
            cursor.execute(query, params)
            time_slots = cursor.fetchall()
            
            # Convert datetime to string
            result_slots = []
            if time_slots:
                for slot in time_slots:
                    result_slot = dict(slot)
                    for field in ['available_date', 'start_time', 'end_time']:
                        if field in result_slot and result_slot[field]:
                            result_slot[field] = str(result_slot[field])
                    result_slots.append(result_slot)
            
            return {
                "doctor_id": doctor_id,
                "total_available": len(result_slots),
                "time_slots": result_slots
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
    "/available-slots/branch/{branch_id}", 
    status_code=status.HTTP_200_OK,
    summary="Get Available Slots by Branch",
    description="Get available time slots for a branch (Authenticated users)"
)
async def get_available_time_slots_by_branch(
    branch_id: str,
    date_filter: Optional[date] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)  # ✅ JWT Required
):
    """
    Get all available time slots for a specific branch
    
    **Required Auth:** Any authenticated user
    """
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
                params.append(date_filter)
            
            query += " ORDER BY ts.available_date, ts.start_time"
            
            cursor.execute(query, params)
            time_slots = cursor.fetchall()
            
            # Convert datetime to string
            result_slots = []
            if time_slots:
                for slot in time_slots:
                    result_slot = dict(slot)
                    for field in ['available_date', 'start_time', 'end_time']:
                        if field in result_slot and result_slot[field]:
                            result_slot[field] = str(result_slot[field])
                    result_slots.append(result_slot)
            
            return {
                "branch_id": branch_id,
                "branch_name": branch['branch_name'],
                "total_available": len(result_slots),
                "time_slots": result_slots
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching time slots for branch {branch_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )