from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database, auth

router = APIRouter(prefix="/addresses", tags=["addresses"])

@router.post("/", response_model=schemas.Address)
def create_address(address: schemas.AddressCreate, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(auth.get_current_employee)):
    return crud.create_address(db, address)

@router.get("/{address_id}", response_model=schemas.Address)
def read_address(address_id: int, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(auth.get_current_user)):
    db_address = crud.get_address(db, address_id)
    if db_address is None:
        raise HTTPException(status_code=404, detail="Address not found")
    return db_address