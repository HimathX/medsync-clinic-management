from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas, database, auth

router = APIRouter(prefix="/specializations", tags=["specializations"])

@router.get("/", response_model=List[schemas.Specialization])
def get_specializations(
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """Get all specializations with optional search"""
    return crud.get_specializations(
        db, 
        skip=skip, 
        limit=limit,
        search=search
    )

@router.get("/{specialization_id}", response_model=schemas.Specialization)
def get_specialization(
    specialization_id: str, 
    db: Session = Depends(database.get_db)
):
    """Get specialization by ID"""
    db_specialization = crud.get_specialization(db, specialization_id=specialization_id)
    if db_specialization is None:
        raise HTTPException(status_code=404, detail="Specialization not found")
    return db_specialization

@router.post("/", response_model=schemas.Specialization)
def create_specialization(
    specialization: schemas.SpecializationCreate, 
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_employee)
):
    """Create a new specialization (Admin only)"""
    if current_user.employee.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return crud.create_specialization(db=db, specialization=specialization)

@router.get("/{specialization_id}/doctors", response_model=List[schemas.Doctor])
def get_specialization_doctors(
    specialization_id: str,
    db: Session = Depends(database.get_db)
):
    """Get all doctors with this specialization"""
    db_specialization = crud.get_specialization(db, specialization_id=specialization_id)
    if db_specialization is None:
        raise HTTPException(status_code=404, detail="Specialization not found")
    
    return crud.get_doctors_by_specialization(db, specialization_id=specialization_id)

@router.post("/{specialization_id}/doctors/{doctor_id}", response_model=schemas.DoctorSpecialization)
def add_doctor_specialization(
    specialization_id: str,
    doctor_id: str,
    doctor_specialization: schemas.DoctorSpecializationCreate,
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_employee)
):
    """Add specialization to doctor (Admin only)"""
    if current_user.employee.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    doctor_specialization.doctor_id = doctor_id
    doctor_specialization.specialization_id = specialization_id
    return crud.create_doctor_specialization(db=db, doctor_specialization=doctor_specialization)