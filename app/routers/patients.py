from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database, auth

router = APIRouter(prefix="/patients", tags=["patients"])

@router.post("/", response_model=schemas.Patient)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(auth.get_current_employee)):
    return crud.create_patient(db, patient)

@router.get("/{patient_id}", response_model=schemas.Patient)
def read_patient(patient_id: int, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(auth.get_current_user)):
    db_patient = crud.get_patient(db, patient_id)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user.user_type != "employee" and db_patient.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this patient")
    return db_patient