from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas, database, auth

router = APIRouter(prefix="/invoices", tags=["invoices"])

@router.get("/", response_model=List[schemas.Invoice])
def get_invoices(
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=100),
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_employee)
):
    """Get invoices with filtering (Employee only)"""
    return crud.get_invoices(
        db, 
        skip=skip, 
        limit=limit,
        patient_id=patient_id,
        status=status,
        date_from=date_from,
        date_to=date_to
    )

@router.get("/{invoice_id}", response_model=schemas.Invoice)
def get_invoice(
    invoice_id: str, 
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """Get invoice by ID"""
    db_invoice = crud.get_invoice(db, invoice_id=invoice_id)
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check permissions for patients
    if (current_user.user_type == "patient" and 
        db_invoice.consultation_record.appointment.patient.user_id != current_user.user_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return db_invoice

@router.post("/", response_model=schemas.Invoice)
def create_invoice(
    invoice: schemas.InvoiceCreate, 
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_employee)
):
    """Create a new invoice (Employee only)"""
    if current_user.employee.role not in ["doctor", "admin", "receptionist"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return crud.create_invoice(db=db, invoice=invoice)

@router.get("/{invoice_id}/payments", response_model=List[schemas.Payment])
def get_invoice_payments(
    invoice_id: str,
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(auth.get_current_employee)
):
    """Get payments for an invoice"""
    db_invoice = crud.get_invoice(db, invoice_id=invoice_id)
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return crud.get_invoice_payments(db, invoice_id=invoice_id)