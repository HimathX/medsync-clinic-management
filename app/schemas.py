from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime, date, time
from enum import Enum

class UserType(str, Enum):
    patient = "patient"
    employee = "employee"

class Gender(str, Enum):
    Male = "Male"
    Female = "Female"
    Other = "Other"

class StatusName(str, Enum):
    Scheduled = "Scheduled"
    Completed = "Completed"
    Cancelled = "Cancelled"
    NoShow = "No-Show"

class PaymentMethod(str, Enum):
    Cash = "Cash"
    CreditCard = "Credit Card"
    DebitCard = "Debit Card"
    Online = "Online"
    Insurance = "Insurance"
    Other = "Other"

class PaymentStatus(str, Enum):
    Pending = "Pending"
    Completed = "Completed"
    Failed = "Failed"
    Refunded = "Refunded"

class InsuranceStatus(str, Enum):
    Active = "Active"
    Inactive = "Inactive"
    Expired = "Expired"
    Pending = "Pending"

class Severity(str, Enum):
    Mild = "Mild"
    Moderate = "Moderate"
    Severe = "Severe"
    LifeThreatening = "Life-threatening"

class BloodGroup(str, Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    O_POS = "O+"
    O_NEG = "O-"
    AB_POS = "AB+"
    AB_NEG = "AB-"

class ConditionStatus(str, Enum):
    Active = "Active"
    InTreatment = "In Treatment"
    Managed = "Managed"
    Resolved = "Resolved"

class Role(str, Enum):
    doctor = "doctor"
    nurse = "nurse"
    admin = "admin"
    receptionist = "receptionist"
    manager = "manager"

class MedicationForm(str, Enum):
    Tablet = "Tablet"
    Capsule = "Capsule"
    Injection = "Injection"
    Syrup = "Syrup"
    Other = "Other"

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class Login(BaseModel):
    email: EmailStr
    password: str

class AddressBase(BaseModel):
    address_line1: str
    address_line2: Optional[str]
    city: str
    province: str
    postal_code: str
    country: str = "Sri Lanka"

class AddressCreate(AddressBase):
    pass

class Address(AddressBase):
    address_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ContactBase(BaseModel):
    contact_num1: str
    contact_num2: Optional[str] = None

class ContactCreate(ContactBase):
    pass

class Contact(ContactBase):
    contact_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class UserBase(BaseModel):
    full_name: str
    NIC: str
    email: EmailStr
    gender: Gender
    DOB: date
    user_type: UserType

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

class User(UserBase):
    user_id: str
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# ============================================
# PATIENT SCHEMAS
# ============================================

class PatientRegistration(BaseModel):
    """Complete patient registration schema"""
    # Address information
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    province: str
    postal_code: str
    country: str = "Sri Lanka"
    
    # Contact information
    contact_num1: str
    contact_num2: Optional[str] = None
    
    # Personal information
    full_name: str
    nic: str
    email: EmailStr
    gender: Gender
    dob: date
    password: str
    
    # Medical information
    blood_group: BloodGroup
    registered_branch_name: str

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    blood_group: Optional[BloodGroup] = None

class PatientAllergyCreate(BaseModel):
    allergy_name: str
    severity: Severity = Severity.Mild
    reaction_description: Optional[str] = None
    diagnosed_date: Optional[date] = None

class PatientConditionCreate(BaseModel):
    condition_id: str
    diagnosed_date: date
    is_chronic: bool = False
    current_status: ConditionStatus = ConditionStatus.Active
    notes: Optional[str] = None

# ============================================
# EMPLOYEE SCHEMAS  
# ============================================

class EmployeeRegistration(BaseModel):
    """Complete employee registration schema"""
    # Address information
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    province: str
    postal_code: str
    country: str = "Sri Lanka"
    
    # Contact information
    contact_num1: str
    contact_num2: Optional[str] = None
    
    # Personal information
    full_name: str
    nic: str
    email: EmailStr
    gender: Gender
    dob: date
    password: str
    
    # Employment information
    branch_name: str
    role: Role
    salary: float
    joined_date: date

class EmployeeUpdate(BaseModel):
    salary: Optional[float] = None
    is_active: Optional[bool] = None
    end_date: Optional[date] = None

# ============================================
# DOCTOR SCHEMAS
# ============================================

class DoctorRegistration(BaseModel):
    """Complete doctor registration schema"""
    # Address information
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    province: str
    postal_code: str
    country: str = "Sri Lanka"
    
    # Contact information
    contact_num1: str
    contact_num2: Optional[str] = None
    
    # Personal information
    full_name: str
    nic: str
    email: EmailStr
    gender: Gender
    dob: date
    password: str
    
    # Employment information
    branch_name: str
    salary: float
    joined_date: date
    
    # Doctor-specific information
    room_no: Optional[str] = None
    medical_licence_no: str
    consultation_fee: float
    specialization_ids: Optional[List[str]] = []

class DoctorUpdate(BaseModel):
    room_no: Optional[str] = None
    consultation_fee: Optional[float] = None
    is_available: Optional[bool] = None

# ============================================
# APPOINTMENT SCHEMAS
# ============================================

class AppointmentCreate(BaseModel):
    time_slot_id: str
    patient_id: Optional[str] = None  # Auto-filled for patients
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: Optional[StatusName] = None
    notes: Optional[str] = None

class TimeSlotCreate(BaseModel):
    doctor_id: str
    branch_id: str
    available_date: date
    start_time: time
    end_time: time

# ============================================
# CONSULTATION SCHEMAS
# ============================================

class ConsultationRecordCreate(BaseModel):
    appointment_id: str
    symptoms: str
    diagnoses: str
    follow_up_required: bool = False
    follow_up_date: Optional[date] = None

class ConsultationRecordUpdate(BaseModel):
    symptoms: Optional[str] = None
    diagnoses: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[date] = None

class PrescriptionItemCreate(BaseModel):
    medication_id: str
    dosage: str
    frequency: str
    duration_days: int
    instructions: Optional[str] = None

class TreatmentCreate(BaseModel):
    treatment_service_code: str
    notes: Optional[str] = None

# ============================================
# MEDICAL DATA SCHEMAS
# ============================================

class MedicationCreate(BaseModel):
    generic_name: str
    manufacturer: str
    form: MedicationForm
    contraindications: Optional[str] = None
    side_effects: Optional[str] = None

class MedicationUpdate(BaseModel):
    contraindications: Optional[str] = None
    side_effects: Optional[str] = None

class SpecializationCreate(BaseModel):
    specialization_title: str
    other_details: Optional[str] = None

# ============================================
# BRANCH SCHEMAS
# ============================================

class BranchCreate(BaseModel):
    branch_name: str
    address: AddressCreate
    contact: ContactCreate

class BranchUpdate(BaseModel):
    branch_name: Optional[str] = None
    is_active: Optional[bool] = None

# ============================================
# BILLING SCHEMAS
# ============================================

class PaymentCreate(BaseModel):
    patient_id: str
    amount_paid: float
    payment_method: PaymentMethod
    payment_date: date
    notes: Optional[str] = None

class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    notes: Optional[str] = None

# ============================================
# RESPONSE SCHEMAS
# ============================================

class ApiResponse(BaseModel):
    """Standard API response"""
    success: bool
    message: str
    data: Optional[Any] = None
    errors: Optional[List[str]] = None

class PaginatedResponse(BaseModel):
    """Paginated response schema"""
    items: List[Any]
    total: int
    skip: int
    limit: int
    has_more: bool

class ContactBase(BaseModel):
    contact_num1: str
    contact_num2: Optional[str]

class ContactCreate(ContactBase):
    pass

class Contact(ContactBase):
    contact_id: str

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    user_type: UserType
    full_name: str
    NIC: str
    email: EmailStr
    gender: Gender
    DOB: date

class UserCreate(UserBase):
    password: str
    address_id: str
    contact_id: str

class User(UserBase):
    user_id: str
    address: Optional[Address]
    contact: Optional[Contact]
    last_login: Optional[datetime]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class PatientBase(BaseModel):
    blood_group: BloodGroup
    registered_branch_id: str

class PatientCreate(PatientBase):
    user_id: str

class Patient(PatientBase):
    patient_id: str
    user: Optional[User]
    registered_branch: Optional["Branch"]
    allergies: List["PatientAllergy"] = []
    conditions: List["PatientCondition"] = []
    appointments: List["Appointment"] = []
    insurances: List["Insurance"] = []

    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    branch_id: str
    role: Role
    salary: float
    joined_date: date
    end_date: Optional[date]
    is_active: bool = True

class EmployeeCreate(EmployeeBase):
    user_id: str

class Employee(EmployeeBase):
    employee_id: str
    user: Optional[User]
    branch: Optional["Branch"]

    class Config:
        from_attributes = True

class DoctorBase(BaseModel):
    room_no: Optional[str]
    medical_licence_no: str
    consultation_fee: float = 0.0
    is_available: bool = True

class DoctorCreate(DoctorBase):
    employee_id: str

class Doctor(DoctorBase):
    doctor_id: str
    employee: Optional[Employee]
    specializations: List["Specialization"] = []

    class Config:
        from_attributes = True

class BranchBase(BaseModel):
    branch_name: str
    contact_id: str
    address_id: str
    manager_id: Optional[str]
    is_active: bool = True

class BranchCreate(BranchBase):
    pass

class Branch(BranchBase):
    branch_id: str
    contact: Optional[Contact]
    address: Optional[Address]
    manager: Optional[Employee]
    employees: List[Employee] = []
    patients: List[Patient] = []

    class Config:
        from_attributes = True

class SpecializationBase(BaseModel):
    specialization_title: str
    other_details: Optional[str]

class SpecializationCreate(SpecializationBase):
    pass

class Specialization(SpecializationBase):
    specialization_id: str
    doctors: List[Doctor] = []

    class Config:
        from_attributes = True

class DoctorSpecializationBase(BaseModel):
    doctor_id: str
    specialization_id: str
    certification_date: Optional[date]

class DoctorSpecializationCreate(DoctorSpecializationBase):
    pass

class DoctorSpecialization(DoctorSpecializationBase):
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class InsuranceBase(BaseModel):
    patient_id: str
    insurance_package_id: str
    status: InsuranceStatus = InsuranceStatus.Pending
    start_date: date
    end_date: date

class InsuranceCreate(InsuranceBase):
    pass

class Insurance(InsuranceBase):
    insurance_id: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class InsurancePackageBase(BaseModel):
    package_name: str
    annual_limit: float
    copayment_percentage: float
    description: Optional[str]
    is_active: bool = True

class InsurancePackageCreate(InsurancePackageBase):
    pass

class InsurancePackage(InsurancePackageBase):
    insurance_package_id: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class TimeslotBase(BaseModel):
    doctor_id: str
    branch_id: str
    available_date: date
    is_booked: bool = False
    start_time: time
    end_time: time

class TimeslotCreate(TimeslotBase):
    pass

class Timeslot(TimeslotBase):
    time_slot_id: str
    doctor: Optional[Doctor]
    branch: Optional[Branch]

    class Config:
        from_attributes = True

class AppointmentBase(BaseModel):
    patient_id: str
    time_slot_id: str
    status: StatusName = StatusName.Scheduled
    notes: Optional[str]

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    appointment_id: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    patient: Optional[Patient]
    timeslot: Optional[Timeslot]

    class Config:
        from_attributes = True

class ConsultationRecordBase(BaseModel):
    appointment_id: str
    symptoms: str
    diagnoses: str
    follow_up_required: bool = False
    follow_up_date: Optional[date]

class ConsultationRecordCreate(ConsultationRecordBase):
    pass

class ConsultationRecord(ConsultationRecordBase):
    consultation_rec_id: str
    appointment: Optional[Appointment]
    treatments: List["Treatment"] = []
    prescriptions: List["PrescriptionItem"] = []

    class Config:
        from_attributes = True

class TreatmentCatalogueBase(BaseModel):
    treatment_name: str
    base_price: float
    duration: time
    description: Optional[str]

class TreatmentCatalogueCreate(TreatmentCatalogueBase):
    pass

class TreatmentCatalogue(TreatmentCatalogueBase):
    treatment_service_code: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class TreatmentBase(BaseModel):
    consultation_rec_id: str
    treatment_service_code: str
    notes: Optional[str]

class TreatmentCreate(TreatmentBase):
    pass

class Treatment(TreatmentBase):
    treatment_id: str
    consultation_record: Optional[ConsultationRecord]
    treatment_catalogue: Optional[TreatmentCatalogue]

    class Config:
        from_attributes = True

class MedicationBase(BaseModel):
    generic_name: str
    manufacturer: str
    form: MedicationForm
    contraindications: Optional[str]
    side_effects: Optional[str]

class MedicationCreate(MedicationBase):
    pass

class Medication(MedicationBase):
    medication_id: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Prescription models moved to end of file

class InvoiceBase(BaseModel):
    consultation_rec_id: str
    sub_total: float
    tax_amount: float = 0.0
    due_date: Optional[date]

class InvoiceCreate(InvoiceBase):
    pass

class Invoice(InvoiceBase):
    invoice_id: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    consultation_record: Optional[ConsultationRecord]

    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    patient_id: str
    amount_paid: float
    payment_method: PaymentMethod
    status: PaymentStatus = PaymentStatus.Pending
    payment_date: date = date.today()
    notes: Optional[str]

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    payment_id: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    patient: Optional[Patient]

    class Config:
        from_attributes = True

class ClaimBase(BaseModel):
    invoice_id: str
    insurance_id: str
    claim_amount: float
    claim_date: date = date.today()
    notes: Optional[str]

class ClaimCreate(ClaimBase):
    pass

class Claim(ClaimBase):
    claim_id: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    insurance: Optional[Insurance]
    invoice: Optional[Invoice]

    class Config:
        from_attributes = True

class ConditionCategoryBase(BaseModel):
    category_name: str
    description: Optional[str]

class ConditionCategoryCreate(ConditionCategoryBase):
    pass

class ConditionCategory(ConditionCategoryBase):
    condition_category_id: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class ConditionBase(BaseModel):
    condition_category_id: str
    condition_name: str
    description: Optional[str]
    severity: Optional[Severity]

class ConditionCreate(ConditionBase):
    pass

class Condition(ConditionBase):
    condition_id: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    category: Optional[ConditionCategory]

    class Config:
        from_attributes = True

class PatientConditionBase(BaseModel):
    patient_id: str
    condition_id: str
    diagnosed_date: date
    is_chronic: bool = False
    current_status: ConditionStatus = ConditionStatus.Active
    notes: Optional[str]

class PatientConditionCreate(PatientConditionBase):
    pass

class PatientCondition(PatientConditionBase):
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    patient: Optional[Patient]
    condition: Optional[Condition]

    class Config:
        from_attributes = True

class PatientAllergyBase(BaseModel):
    patient_id: str
    allergy_name: str
    severity: Severity = Severity.Mild
    reaction_description: Optional[str]
    diagnosed_date: Optional[date]

class PatientAllergyCreate(PatientAllergyBase):
    pass

class PatientAllergy(PatientAllergyBase):
    patient_allergy_id: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    patient: Optional[Patient]

    class Config:
        from_attributes = True

# UPDATE SCHEMAS
class DoctorUpdate(BaseModel):
    room_no: Optional[str] = None
    medical_licence_no: Optional[str] = None
    consultation_fee: Optional[float] = None
    is_available: Optional[bool] = None

class BranchUpdate(BaseModel):
    branch_name: Optional[str] = None
    contact_id: Optional[str] = None
    address_id: Optional[str] = None
    manager_id: Optional[str] = None
    is_active: Optional[bool] = None

class EmployeeUpdate(BaseModel):
    branch_id: Optional[str] = None
    role: Optional[Role] = None
    salary: Optional[float] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

class AppointmentUpdate(BaseModel):
    status: Optional[StatusName] = None
    notes: Optional[str] = None

class MedicationUpdate(BaseModel):
    generic_name: Optional[str] = None
    manufacturer: Optional[str] = None
    form: Optional[MedicationForm] = None
    contraindications: Optional[str] = None
    side_effects: Optional[str] = None

class ConsultationRecordUpdate(BaseModel):
    symptoms: Optional[str] = None
    diagnoses: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[date] = None

class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    notes: Optional[str] = None

# Fix Prescription schema naming
class PrescriptionItemBase(BaseModel):
    medication_id: Optional[str]
    consultation_rec_id: str
    dosage: Optional[str]
    frequency: Optional[str]
    duration_days: Optional[int]
    instructions: Optional[str]

class PrescriptionItemCreate(PrescriptionItemBase):
    pass

class PrescriptionItem(PrescriptionItemBase):
    prescription_item_id: str
    medication: Optional[Medication]
    consultation_record: Optional[ConsultationRecord]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True