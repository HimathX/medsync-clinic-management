from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas, database, auth

router = APIRouter(prefix="/payments", tags=["payments"])

@router.get("/", response_model=List[schemas.Payment])
def get_payments(
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=100),
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    payment_method: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """Get payments with filtering"""
    # Patients can only see their own payments
    if current_user.user_type == "patient" and patient_id != current_user.patient.patient_id:
        patient_id = current_user.patient.patient_id
    
    return crud.get_payments(
        db, 
        skip=skip, 
        limit=limit,
        patient_id=patient_id,
        status=status,
        payment_method=payment_method,
        date_from=date_from,
        date_to=date_to
    )

@router.get("/{payment_id}", response_model=schemas.Payment)
def get_payment(
    payment_id: str, 
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """Get payment by ID"""
    db_payment = crud.get_payment(db, payment_id=payment_id)
    if db_payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Check permissions for patients
    if (current_user.user_type == "patient" and 
        db_payment.patient.user_id != current_user.user_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return db_payment

@router.post("/", response_model=schemas.Payment)
def create_payment(
    payment: schemas.PaymentCreate, 
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_employee)
):
    """Create a new payment (Employee only)"""
    if current_user.employee.role not in ["admin", "receptionist"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return crud.create_payment(db=db, payment=payment)

@router.put("/{payment_id}", response_model=schemas.Payment)
def update_payment(
    payment_id: str,
    payment: schemas.PaymentUpdate,
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_employee)
):
    """Update payment status (Employee only)"""
    if current_user.employee.role not in ["admin", "receptionist"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    db_payment = crud.get_payment(db, payment_id=payment_id)
    if db_payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return crud.update_payment(db=db, payment_id=payment_id, payment=payment)