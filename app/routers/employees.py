from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas, database, auth

router = APIRouter(prefix="/employees", tags=["employees"])

@router.get("/", response_model=List[schemas.Employee])
def get_employees(
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=100),
    branch_id: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = True,
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_employee)
):
    """Get employees with filtering (Admin/Manager only)"""
    if current_user.employee.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return crud.get_employees(
        db, 
        skip=skip, 
        limit=limit,
        branch_id=branch_id,
        role=role,
        is_active=is_active
    )

@router.get("/{employee_id}", response_model=schemas.Employee)
def get_employee(
    employee_id: str, 
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_employee)
):
    """Get employee by ID"""
    # Employees can view their own profile or managers can view all
    if (current_user.employee.employee_id != employee_id and 
        current_user.employee.role not in ["admin", "manager"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    db_employee = crud.get_employee(db, employee_id=employee_id)
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_employee

@router.post("/", response_model=schemas.Employee)
def create_employee(
    employee: schemas.EmployeeCreate, 
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_employee)
):
    """Create a new employee (Admin/Manager only)"""
    if current_user.employee.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return crud.create_employee(db=db, employee=employee)

@router.put("/{employee_id}", response_model=schemas.Employee)
def update_employee(
    employee_id: str,
    employee: schemas.EmployeeUpdate,
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_employee)
):
    """Update employee information"""
    # Employees can update some of their own info, managers can update all
    db_employee = crud.get_employee(db, employee_id=employee_id)
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if (current_user.employee.employee_id != employee_id and 
        current_user.employee.role not in ["admin", "manager"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return crud.update_employee(db=db, employee_id=employee_id, employee=employee)

@router.delete("/{employee_id}")
def deactivate_employee(
    employee_id: str,
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_employee)
):
    """Deactivate an employee (Admin only)"""
    if current_user.employee.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db_employee = crud.get_employee(db, employee_id=employee_id)
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return crud.deactivate_employee(db=db, employee_id=employee_id)

@router.get("/{employee_id}/schedule", response_model=List[schemas.Timeslot])
def get_employee_schedule(
    employee_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_employee)
):
    """Get employee's schedule (if they are a doctor)"""
    if (current_user.employee.employee_id != employee_id and 
        current_user.employee.role not in ["admin", "manager"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    db_employee = crud.get_employee(db, employee_id=employee_id)
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if db_employee.role != "doctor":
        raise HTTPException(status_code=400, detail="Employee is not a doctor")
    
    # Get doctor record
    doctor = crud.get_doctor_by_employee_id(db, employee_id=employee_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor record not found")
    
    return crud.get_doctor_timeslots(
        db, 
        doctor_id=doctor.doctor_id,
        start_date=start_date,
        end_date=end_date
    )