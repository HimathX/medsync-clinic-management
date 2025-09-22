from sqlalchemy.orm import Session
from . import models, schemas
from .auth import hash_password

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = hash_password(user.password)
    db_user = models.User(
        address_id=user.address_id,
        user_type=user.user_type,
        full_name=user.full_name,
        NIC=user.NIC,
        gender=user.gender,
        DOB=user.DOB,
        email=user.email,
        password_hash=hashed_password,
        created_date=user.created_date
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.user_id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_patient(db: Session, patient: schemas.PatientCreate):
    db_patient = models.Patient(
        user_id=patient.user_id,
        blood_group=patient.blood_group,
        allergies=patient.allergies,
        chronic_conditions=patient.chronic_conditions,
        registered_branch_id=patient.registered_branch_id
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def get_patient(db: Session, patient_id: int):
    return db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()

def get_patient_by_user_id(db: Session, user_id: int):
    return db.query(models.Patient).filter(models.Patient.user_id == user_id).first()

def create_address(db: Session, address: schemas.AddressCreate):
    db_address = models.Address(
        address_line_1=address.address_line_1,
        address_line_2=address.address_line_2,
        city=address.city,
        province=address.province,
        postal_code=address.postal_code
    )
    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    return db_address

def get_address(db: Session, address_id: int):
    return db.query(models.Address).filter(models.Address.address_id == address_id).first()