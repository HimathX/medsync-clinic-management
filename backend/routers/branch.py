from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
from core.database import get_db
import logging

router = APIRouter(tags=["branch"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@router.get("/", status_code=status.HTTP_200_OK)
def get_all_branches(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    is_active: Optional[bool] = True
):
    """Get all branches with pagination"""
    try:
        with get_db() as (cursor, connection):
            # Build query
            query = "SELECT * FROM branch"
            params = []
            
            if is_active is not None:
                query += " WHERE is_active = %s"
                params.append(is_active)
            
            # Get total count
            count_query = query.replace("SELECT *", "SELECT COUNT(*) as total")
            cursor.execute(count_query, params)
            total_result = cursor.fetchone()
            total = total_result['total'] if total_result else 0
            
            # Add pagination
            query += " ORDER BY branch_name LIMIT %s OFFSET %s"
            params.extend([limit, skip])
            
            cursor.execute(query, params)
            branches = cursor.fetchall()
            
            return {
                "total": total,
                "returned": len(branches),
                "branches": branches or []
            }
    except Exception as e:
        logger.error(f"Error fetching branches: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{branch_id}", status_code=status.HTTP_200_OK)
def get_branch_by_id(branch_id: str):
    """Get branch details by ID with full address and contact info"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute(
                """SELECT 
                    b.*,
                    a.address_line1, a.address_line2, a.city, a.province, 
                    a.postal_code, a.country,
                    c.contact_num1, c.contact_num2,
                    u.full_name as manager_name, u.email as manager_email
                FROM branch b
                LEFT JOIN address a ON b.address_id = a.address_id
                LEFT JOIN contact c ON b.contact_id = c.contact_id
                LEFT JOIN user u ON b.manager_id = u.user_id
                WHERE b.branch_id = %s""",
                (branch_id,)
            )
            branch = cursor.fetchone()
            
            if not branch:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Branch with ID {branch_id} not found"
                )
            
            return {"branch": branch}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching branch {branch_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{branch_id}/employees", status_code=status.HTTP_200_OK)
def get_branch_employees(
    branch_id: str,
    is_active: Optional[bool] = True,
    role: Optional[str] = Query(None, pattern="^(doctor|nurse|admin|receptionist|manager|pharmacist|lab_technician)$")
):
    """Get all employees in a branch with optional role filter"""
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
            
            # Build query
            query = """
                SELECT e.*, u.full_name, u.email, u.NIC, u.gender, u.DOB
                FROM employee e
                JOIN user u ON e.employee_id = u.user_id
                WHERE e.branch_id = %s
            """
            params = [branch_id]
            
            if is_active is not None:
                query += " AND e.is_active = %s"
                params.append(is_active)
            
            if role:
                query += " AND e.role = %s"
                params.append(role)
            
            query += " ORDER BY e.role, u.full_name"
            
            cursor.execute(query, params)
            employees = cursor.fetchall()
            
            return {
                "branch_id": branch_id,
                "branch_name": branch['branch_name'],
                "total": len(employees),
                "employees": employees or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching employees for branch {branch_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{branch_id}/doctors", status_code=status.HTTP_200_OK)
def get_branch_doctors(
    branch_id: str,
    is_available: Optional[bool] = True
):
    """Get all doctors in a branch"""
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
            
            # Build query
            query = """
                SELECT 
                    d.*, e.*, u.full_name, u.email, u.NIC
                FROM doctor d
                JOIN employee e ON d.doctor_id = e.employee_id
                JOIN user u ON d.doctor_id = u.user_id
                WHERE e.branch_id = %s AND e.is_active = TRUE
            """
            params = [branch_id]
            
            if is_available is not None:
                query += " AND d.is_available = %s"
                params.append(is_available)
            
            query += " ORDER BY u.full_name"
            
            cursor.execute(query, params)
            doctors = cursor.fetchall()
            
            return {
                "branch_id": branch_id,
                "branch_name": branch['branch_name'],
                "total": len(doctors),
                "doctors": doctors or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching doctors for branch {branch_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{branch_id}/patients", status_code=status.HTTP_200_OK)
def get_branch_patients(
    branch_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """Get all patients registered in a branch"""
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
            
            # Get total count
            cursor.execute(
                """SELECT COUNT(*) as total FROM patient 
                   WHERE registered_branch_id = %s""",
                (branch_id,)
            )
            total_result = cursor.fetchone()
            total = total_result['total'] if total_result else 0
            
            # Get patients with pagination
            cursor.execute(
                """SELECT p.*, u.full_name, u.email, u.NIC, u.gender, u.DOB
                   FROM patient p
                   JOIN user u ON p.patient_id = u.user_id
                   WHERE p.registered_branch_id = %s
                   ORDER BY u.full_name
                   LIMIT %s OFFSET %s""",
                (branch_id, limit, skip)
            )
            patients = cursor.fetchall()
            
            return {
                "branch_id": branch_id,
                "branch_name": branch['branch_name'],
                "total": total,
                "returned": len(patients),
                "patients": patients or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching patients for branch {branch_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{branch_id}/appointments", status_code=status.HTTP_200_OK)
def get_branch_appointments(
    branch_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status_filter: Optional[str] = Query(None, pattern="^(Scheduled|Completed|Cancelled|No-Show)$")
):
    """Get all appointments for a branch"""
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
            
            # Build query
            query = """
                SELECT 
                    a.*,
                    ts.available_date, ts.start_time, ts.end_time,
                    u_patient.full_name as patient_name,
                    u_doctor.full_name as doctor_name
                FROM appointment a
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN user u_patient ON p.patient_id = u_patient.user_id
                JOIN doctor d ON ts.doctor_id = d.doctor_id
                JOIN user u_doctor ON d.doctor_id = u_doctor.user_id
                WHERE ts.branch_id = %s
            """
            params = [branch_id]
            
            if status_filter:
                query += " AND a.status = %s"
                params.append(status_filter)
            
            # Get total count
            count_query = query.replace(
                "SELECT a.*, ts.available_date, ts.start_time, ts.end_time, u_patient.full_name as patient_name, u_doctor.full_name as doctor_name",
                "SELECT COUNT(*) as total"
            )
            cursor.execute(count_query, params)
            total_result = cursor.fetchone()
            total = total_result['total'] if total_result else 0
            
            # Add pagination
            query += " ORDER BY ts.available_date DESC, ts.start_time DESC LIMIT %s OFFSET %s"
            params.extend([limit, skip])
            
            cursor.execute(query, params)
            appointments = cursor.fetchall()
            
            return {
                "branch_id": branch_id,
                "branch_name": branch['branch_name'],
                "total": total,
                "returned": len(appointments),
                "appointments": appointments or []
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching appointments for branch {branch_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/search/by-name/{branch_name}", status_code=status.HTTP_200_OK)
def search_branch_by_name(branch_name: str):
    """Search branch by name (partial match, case-insensitive)"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute(
                """SELECT b.*,
                    a.city, a.province,
                    c.contact_num1, c.contact_num2
                FROM branch b
                LEFT JOIN address a ON b.address_id = a.address_id
                LEFT JOIN contact c ON b.contact_id = c.contact_id
                WHERE LOWER(b.branch_name) LIKE LOWER(%s)
                ORDER BY b.branch_name""",
                (f"%{branch_name}%",)
            )
            branches = cursor.fetchall()
            
            if not branches or len(branches) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No branches found matching '{branch_name}'"
                )
            
            return {
                "search_term": branch_name,
                "total": len(branches),
                "branches": branches
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching branches by name '{branch_name}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/search/by-city/{city}", status_code=status.HTTP_200_OK)
def search_branch_by_city(city: str):
    """Search branches by city"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute(
                """SELECT b.*,
                    a.address_line1, a.address_line2, a.city, a.province,
                    c.contact_num1, c.contact_num2
                FROM branch b
                JOIN address a ON b.address_id = a.address_id
                LEFT JOIN contact c ON b.contact_id = c.contact_id
                WHERE LOWER(a.city) LIKE LOWER(%s)
                ORDER BY b.branch_name""",
                (f"%{city}%",)
            )
            branches = cursor.fetchall()
            
            if not branches or len(branches) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No branches found in city '{city}'"
                )
            
            return {
                "city": city,
                "total": len(branches),
                "branches": branches
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching branches by city '{city}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{branch_id}/stats", status_code=status.HTTP_200_OK)
def get_branch_statistics(branch_id: str):
    """Get branch statistics (employees, doctors, patients, appointments)"""
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
            
            stats = {
                "branch_id": branch_id,
                "branch_name": branch['branch_name']
            }
            
            # Total employees
            cursor.execute(
                "SELECT COUNT(*) as total FROM employee WHERE branch_id = %s AND is_active = TRUE",
                (branch_id,)
            )
            stats['total_employees'] = cursor.fetchone()['total']
            
            # Total doctors
            cursor.execute(
                """SELECT COUNT(*) as total FROM doctor d
                   JOIN employee e ON d.doctor_id = e.employee_id
                   WHERE e.branch_id = %s AND e.is_active = TRUE""",
                (branch_id,)
            )
            stats['total_doctors'] = cursor.fetchone()['total']
            
            # Total patients
            cursor.execute(
                "SELECT COUNT(*) as total FROM patient WHERE registered_branch_id = %s",
                (branch_id,)
            )
            stats['total_patients'] = cursor.fetchone()['total']
            
            # Total appointments (all time)
            cursor.execute(
                """SELECT COUNT(*) as total FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE ts.branch_id = %s""",
                (branch_id,)
            )
            stats['total_appointments'] = cursor.fetchone()['total']
            
            # Scheduled appointments
            cursor.execute(
                """SELECT COUNT(*) as total FROM appointment a
                   JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                   WHERE ts.branch_id = %s AND a.status = 'Scheduled'""",
                (branch_id,)
            )
            stats['scheduled_appointments'] = cursor.fetchone()['total']
            
            return stats
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching stats for branch {branch_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

