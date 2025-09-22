from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date, time
from enum import Enum

class UserType(str, Enum):
    patient = "patient"
    employee = "employee"

class Gender(str, Enum):
    M = "M"
    F = "F"
    Other = "Other"

class ContactType(str, Enum):
    primary = "primary"
    secondary = "secondary"

class StatusName(str, Enum):
    Scheduled = "Scheduled"
    Completed = "Completed"
    Cancelled = "Cancelled"

class PaymentMethod(str, Enum):
    Cash = "Cash"
    Card = "Card"
    Insurance = "Insurance"

class PaymentStatus(str, Enum):
    Pending = "Pending"
    Completed = "Completed"

class InsuranceStatus(str, Enum):
    active = "active"
    expired = "expired"

class Severity(str, Enum):
    Mild = "Mild"
    Moderate = "Moderate"
    Severe = "Severe"

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class Login(BaseModel):
    email: EmailStr
    password: str

class AddressBase(BaseModel):
    address_line_1: str
    address_line_2: Optional[str]
    city: str
    province: str
    postal_code: str

class AddressCreate(AddressBase):
    pass

class Address(AddressBase):
    address_id: int

    class Config:
        from_attributes = True

class ContactBase(BaseModel):
    contact_number: str
    contact_type: ContactType = ContactType.primary
    is_primary: bool = False

class ContactCreate(ContactBase):
    user_id: int

class Contact(ContactBase):
    contact_id: int
    user_id: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    user_type: UserType
    full_name: str
    NIC: str
    gender: Gender
    DOB: date
    email: EmailStr
    created_date: Optional[datetime]

class UserCreate(UserBase):
    password: str
    address_id: Optional[int]

class User(UserBase):
    user_id: int
    address: Optional[Address]
    contacts: List[Contact] = []

    class Config:
        from_attributes = True

class PatientBase(BaseModel):
    blood_group: Optional[str]
    allergies: Optional[str]
    chronic_conditions: Optional[str]
    registered_branch_id: int

class PatientCreate(PatientBase):
    user_id: int

class Patient(PatientBase):
    patient_id: int
    user_id: int
    user: Optional[User]
    registered_branch: Optional["Branch"]
    appointments: List["Appointment"] = []

    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    branch_id: int
    role: str
    salary: Optional[float]
    joined_date: Optional[date]

class EmployeeCreate(EmployeeBase):
    user_id: int

class Employee(EmployeeBase):
    employee_id: int
    user_id: int
    user: Optional[User]
    branch: Optional["Branch"]

    class Config:
        from_attributes = True

class DoctorBase(BaseModel):
    room_no: Optional[str]
    medical_licence_number: str

class DoctorCreate(DoctorBase):
    employee_id: int

class Doctor(DoctorBase):
    doctor_id: int
    employee_id: int
    employee: Optional[Employee]
    specializations: List["Specialization"] = []

    class Config:
        from_attributes = True

class BranchBase(BaseModel):
    branch_name: str
    district: str
    contact_id: Optional[int]
    address_id: Optional[int]
    manager_id: Optional[int]

class BranchCreate(BranchBase):
    pass

class Branch(BranchBase):
    branch_id: int
    contact: Optional[Contact]
    address: Optional[Address]
    manager: Optional[Employee]

    class Config:
        from_attributes = True

class SpecializationBase(BaseModel):
    specialization_name: str
    description: Optional[str]

class SpecializationCreate(SpecializationBase):
    pass

class Specialization(SpecializationBase):
    specialization_id: int
    doctors: List[Doctor] = []

    class Config:
        from_attributes = True

class DoctorSpecializationBase(BaseModel):
    specialization_id: int
    doctor_id: int

class DoctorSpecializationCreate(DoctorSpecializationBase):
    pass

class DoctorSpecialization(DoctorSpecializationBase):
    doctor_specialization_id: int

    class Config:
        from_attributes = True

class InsuranceBase(BaseModel):
    patient_id: int
    insurance_package_id: int
    status: InsuranceStatus = InsuranceStatus.active
    start_date: date
    end_date: Optional[date]

class InsuranceCreate(InsuranceBase):
    pass

class Insurance(InsuranceBase):
    insurance_id: int
    updated_date: Optional[datetime]

    class Config:
        from_attributes = True

class InsurancePackageBase(BaseModel):
    package_name: str
    annual_limit: float
    copayment_percentage: float

class InsurancePackageCreate(InsurancePackageBase):
    pass

class InsurancePackage(InsurancePackageBase):
    insurance_package_id: int
    updated_date: Optional[datetime]

    class Config:
        from_attributes = True

class TimeslotBase(BaseModel):
    doctor_id: int
    branch_id: int
    available_date: date
    is_booked: bool = False
    start_time: time
    end_time: time

class TimeslotCreate(TimeslotBase):
    pass

class Timeslot(TimeslotBase):
    time_slot_id: int
    doctor: Optional[Doctor]
    branch: Optional[Branch]

    class Config:
        from_attributes = True

class StatusBase(BaseModel):
    status_name: StatusName

class StatusCreate(StatusBase):
    pass

class Status(StatusBase):
    status_id: int

    class Config:
        from_attributes = True

class AppointmentBase(BaseModel):
    patient_id: int
    time_slot_id: int
    status_id: int = 1
    notes: Optional[str]

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    appointment_id: int
    updated_at: Optional[datetime]
    created_at: Optional[datetime]
    patient: Optional[Patient]
    timeslot: Optional[Timeslot]
    status: Optional[Status]

    class Config:
        from_attributes = True

class MedicalRecordBase(BaseModel):
    appointment_id: int
    chief_complaint: str
    symptoms: Optional[str]
    diagnoses: Optional[str]

class MedicalRecordCreate(MedicalRecordBase):
    pass

class MedicalRecord(MedicalRecordBase):
    medical_record_id: int
    appointment: Optional[Appointment]

    class Config:
        from_attributes = True

class TreatmentCategoryBase(BaseModel):
    category_name: str
    description: Optional[str]

class TreatmentCategoryCreate(TreatmentCategoryBase):
    pass

class TreatmentCategory(TreatmentCategoryBase):
    treatment_category_id: int

    class Config:
        from_attributes = True

class TreatmentCatalogueBase(BaseModel):
    treatment_category_id: Optional[int]
    treatment_name: str
    base_price: float
    duration: int

class TreatmentCatalogueCreate(TreatmentCatalogueBase):
    pass

class TreatmentCatalogue(TreatmentCatalogueBase):
    treatment_service_code: int
    updated_date: Optional[datetime]
    category: Optional[TreatmentCategory]

    class Config:
        from_attributes = True

class TreatmentBase(BaseModel):
    medical_record_id: int
    treatment_service_code: int

class TreatmentCreate(TreatmentBase):
    pass

class Treatment(TreatmentBase):
    treatment_id: int
    medical_record: Optional[MedicalRecord]
    treatment_catalogue: Optional[TreatmentCatalogue]

    class Config:
        from_attributes = True

class MedicationBase(BaseModel):
    generic_name: str
    manufacturer: Optional[str]
    form: Optional[str]
    contraindications: Optional[str]
    side_effects: Optional[str]

class MedicationCreate(MedicationBase):
    pass

class Medication(MedicationBase):
    medication_id: int

    class Config:
        from_attributes = True

class PrescriptionBase(BaseModel):
    medical_record_id: int
    medication_id: int
    dosage: str
    frequency: str
    duration_days: int
    instructions: Optional[str]

class PrescriptionCreate(PrescriptionBase):
    pass

class Prescription(PrescriptionBase):
    prescription_id: int
    medical_record: Optional[MedicalRecord]
    medication: Optional[Medication]

    class Config:
        from_attributes = True

class ConsultationRecordBase(BaseModel):
    appointment_id: int
    medical_record_id: int
    invoice_id: Optional[int]

class ConsultationRecordCreate(ConsultationRecordBase):
    pass

class ConsultationRecord(ConsultationRecordBase):
    consultation_record_id: int
    appointment: Optional[Appointment]
    medical_record: Optional[MedicalRecord]
    invoice: Optional["Invoice"]

    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    appointment_id: int
    sub_total: float
    insurance_claimed_amount: float = 0.00
    status: PaymentStatus = PaymentStatus.Pending

class InvoiceCreate(InvoiceBase):
    pass

class Invoice(InvoiceBase):
    invoice_id: int
    appointment: Optional[Appointment]

    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    invoice_id: int
    patient_id: int
    payment_method: PaymentMethod = PaymentMethod.Cash
    status: PaymentStatus = PaymentStatus.Pending
    amount: float

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    payment_id: int
    payment_date: Optional[datetime]
    invoice: Optional[Invoice]
    patient: Optional[Patient]

    class Config:
        from_attributes = True

class ClaimBase(BaseModel):
    insurance_id: int
    invoice_id: int
    date: date
    claimed_amount: float

class ClaimCreate(ClaimBase):
    pass

class Claim(ClaimBase):
    claim_id: int
    insurance: Optional[Insurance]
    invoice: Optional[Invoice]

    class Config:
        from_attributes = True

class ConditionCategoryBase(BaseModel):
    category_name: str

class ConditionCategoryCreate(ConditionCategoryBase):
    pass

class ConditionCategory(ConditionCategoryBase):
    condition_category_id: int

    class Config:
        from_attributes = True

class ConditionBase(BaseModel):
    condition_category_id: int
    condition_name: str
    description: Optional[str]

class ConditionCreate(ConditionBase):
    pass

class Condition(ConditionBase):
    condition_id: int
    category: Optional[ConditionCategory]

    class Config:
        from_attributes = True

class PatientConditionBase(BaseModel):
    patient_id: int
    condition_id: int
    diagnosed_date: date
    is_chronic: bool = False
    current_status: Optional[str]

class PatientConditionCreate(PatientConditionBase):
    pass

class PatientCondition(PatientConditionBase):
    patient_condition_id: int
    patient: Optional[Patient]
    condition: Optional[Condition]

    class Config:
        from_attributes = True

class PatientAllergyBase(BaseModel):
    patient_id: int
    allergy_name: str
    severity: Severity
    reaction_description: Optional[str]

class PatientAllergyCreate(PatientAllergyBase):
    pass

class PatientAllergy(PatientAllergyBase):
    patient_allergy_id: int
    patient: Optional[Patient]

    class Config:
        from_attributes = True

class PatientBranchBase(BaseModel):
    patient_id: int
    branch_id: int

class PatientBranchCreate(PatientBranchBase):
    pass

class PatientBranch(PatientBranchBase):
    patient_branch_id: int
    patient: Optional[Patient]
    branch: Optional[Branch]

    class Config:
        from_attributes = True

class SessionBase(BaseModel):
    user_id: int
    token: str
    expires_at: datetime
    is_active: bool = True

class SessionCreate(SessionBase):
    pass

class Session(SessionBase):
    session_id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True