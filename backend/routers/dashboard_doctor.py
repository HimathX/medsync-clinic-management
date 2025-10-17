from fastapi import APIRouter, HTTPException, status
from typing import Optional
from datetime import date, datetime, timedelta
from pydantic import BaseModel
from core.database import get_db
import logging

router = APIRouter(prefix="/doctors", tags=["doctor-dashboard"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class DashboardStats(BaseModel):
    today_appointments: int
    pending_consultations: int
    completed_today: int
    patients_seen: int
    upcoming_appointments: int
    total_patients: int

class AppointmentSummary(BaseModel):
    appointment_id: str
    patient_name: str
    patient_id: str
    scheduled_time: str
    status: str
    is_urgent: bool = False

class RecentActivity(BaseModel):
    activity_type: str
    description: str
    timestamp: datetime
    related_patient: Optional[str] = None

# ============================================
# ENDPOINTS
# ============================================

@router.get("/{doctor_id}/dashboard/stats", status_code=status.HTTP_200_OK, response_model=DashboardStats)
def get_doctor_dashboard_stats(doctor_id: str):
    """Get dashboard statistics for doctor"""
    try:
        with get_db() as (cursor, connection):
            # Verify doctor exists
            cursor.execute("SELECT * FROM doctor WHERE doctor_id = %s", (doctor_id,))
            doctor = cursor.fetchone()
            
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            # Get today's date
            today = date.today()
            
            # Today's appointments count
            today_appointments_query = """
                SELECT COUNT(*) as count
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE ts.doctor_id = %s
                AND ts.available_date = %s
                AND a.status != 'Cancelled'
            """
            cursor.execute(today_appointments_query, (doctor_id, today))
            today_count = cursor.fetchone()
            
            # Pending consultations (appointments without completed consultation)
            pending_consultations_query = """
                SELECT COUNT(*) as count
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                LEFT JOIN consultation_record cr ON a.appointment_id = cr.appointment_id
                WHERE ts.doctor_id = %s
                AND ts.available_date = %s
                AND a.status = 'Scheduled'
                AND cr.consultation_rec_id IS NULL
            """
            cursor.execute(pending_consultations_query, (doctor_id, today))
            pending_count = cursor.fetchone()
            
            # Completed today
            completed_today_query = """
                SELECT COUNT(*) as count
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE ts.doctor_id = %s
                AND ts.available_date = %s
                AND a.status = 'Completed'
            """
            cursor.execute(completed_today_query, (doctor_id, today))
            completed_count = cursor.fetchone()
            
            # Unique patients seen today
            patients_seen_query = """
                SELECT COUNT(DISTINCT a.patient_id) as count
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE ts.doctor_id = %s
                AND ts.available_date = %s
                AND a.status = 'Completed'
            """
            cursor.execute(patients_seen_query, (doctor_id, today))
            patients_count = cursor.fetchone()
            
            # Upcoming appointments (future dates)
            upcoming_query = """
                SELECT COUNT(*) as count
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE ts.doctor_id = %s
                AND ts.available_date > %s
                AND a.status = 'Scheduled'
            """
            cursor.execute(upcoming_query, (doctor_id, today))
            upcoming_count = cursor.fetchone()
            
            # Total unique patients ever seen
            total_patients_query = """
                SELECT COUNT(DISTINCT a.patient_id) as count
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                WHERE ts.doctor_id = %s
                AND a.status = 'Completed'
            """
            cursor.execute(total_patients_query, (doctor_id,))
            total_patients_count = cursor.fetchone()
            
            logger.info(f"Retrieved dashboard stats for doctor {doctor_id}")
            
            return DashboardStats(
                today_appointments=int(today_count['count']) if today_count['count'] else 0,
                pending_consultations=int(pending_count['count']) if pending_count['count'] else 0,
                completed_today=int(completed_count['count']) if completed_count['count'] else 0,
                patients_seen=int(patients_count['count']) if patients_count['count'] else 0,
                upcoming_appointments=int(upcoming_count['count']) if upcoming_count['count'] else 0,
                total_patients=int(total_patients_count['count']) if total_patients_count['count'] else 0
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching dashboard stats for doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{doctor_id}/dashboard/today-appointments", status_code=status.HTTP_200_OK)
def get_today_appointments(doctor_id: str):
    """Get today's appointments for doctor"""
    try:
        with get_db() as (cursor, connection):
            # Verify doctor exists
            cursor.execute("SELECT * FROM doctor WHERE doctor_id = %s", (doctor_id,))
            doctor = cursor.fetchone()
            
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            today = date.today()
            
            # Get today's appointments
            query = """
                SELECT 
                    a.appointment_id,
                    a.status,
                    u.full_name as patient_name,
                    p.patient_id,
                    ts.start_time,
                    ts.end_time,
                    p.chronic_conditions,
                    p.allergies
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u ON p.patient_id = u.user_id
                WHERE ts.doctor_id = %s
                AND ts.available_date = %s
                AND a.status != 'Cancelled'
                ORDER BY ts.start_time ASC
            """
            cursor.execute(query, (doctor_id, today))
            appointments = cursor.fetchall()
            
            logger.info(f"Retrieved {len(appointments)} appointments for doctor {doctor_id} on {today}")
            
            return {
                "date": str(today),
                "total_count": len(appointments),
                "appointments": appointments
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching today's appointments for doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{doctor_id}/dashboard/upcoming", status_code=status.HTTP_200_OK)
def get_upcoming_appointments(doctor_id: str, days: int = 7):
    """Get upcoming appointments for the next N days"""
    try:
        with get_db() as (cursor, connection):
            # Verify doctor exists
            cursor.execute("SELECT * FROM doctor WHERE doctor_id = %s", (doctor_id,))
            doctor = cursor.fetchone()
            
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with ID {doctor_id} not found"
                )
            
            today = date.today()
            end_date = today + timedelta(days=days)
            
            query = """
                SELECT 
                    a.appointment_id,
                    a.status,
                    u.full_name as patient_name,
                    p.patient_id,
                    ts.available_date,
                    ts.start_time,
                    ts.end_time
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u ON p.patient_id = u.user_id
                WHERE ts.doctor_id = %s
                AND ts.available_date BETWEEN %s AND %s
                AND a.status = 'Scheduled'
                ORDER BY ts.available_date ASC, ts.start_time ASC
            """
            cursor.execute(query, (doctor_id, today, end_date))
            appointments = cursor.fetchall()
            
            logger.info(f"Retrieved {len(appointments)} upcoming appointments for doctor {doctor_id}")
            
            return {
                "start_date": str(today),
                "end_date": str(end_date),
                "total_count": len(appointments),
                "appointments": appointments
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching upcoming appointments for doctor {doctor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


