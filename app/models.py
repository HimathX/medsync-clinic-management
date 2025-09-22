from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Date, DECIMAL, Boolean, Text, Time
from sqlalchemy.orm import relationship
from sqlalchemy.schema import UniqueConstraint
from .database import Base

class Address(Base):
    __tablename__ = "Address"
    address_id = Column(Integer, primary_key=True, autoincrement=True)
    address_line_1 = Column(String(255), nullable=False)
    address_line_2 = Column(String(255))
    city = Column(String(100), nullable=False, index=True)
    province = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    users = relationship("User", back_populates="address")
    branches = relationship("Branch", back_populates="address")

class Contact(Base):
    __tablename__ = "Contact"
    contact_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("User.user_id", ondelete="CASCADE"), nullable=False, index=True)
    contact_number = Column(String(20), nullable=False)
    contact_type = Column(Enum('primary', 'secondary'), default='primary')
    is_primary = Column(Boolean, default=False)
    user = relationship("User", back_populates="contacts")
    branches = relationship("Branch", back_populates="contact")

class User(Base):
    __tablename__ = "User"
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    address_id = Column(Integer, ForeignKey("Address.address_id", ondelete="SET NULL"))
    user_type = Column(Enum('patient', 'employee'), nullable=False)
    full_name = Column(String(100), nullable=False)
    NIC = Column(String(20), nullable=False)
    gender = Column(Enum('M', 'F', 'Other'), nullable=False)
    DOB = Column(Date, nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_date = Column(DateTime, default="CURRENT_TIMESTAMP")
    address = relationship("Address", back_populates="users")
    contacts = relationship("Contact", back_populates="user")
    patient = relationship("Patient", back_populates="user", uselist=False)
    employee = relationship("Employee", back_populates="user", uselist=False)
    sessions = relationship("Session", back_populates="user")

class Patient(Base):
    __tablename__ = "Patient"
    patient_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("User.user_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    blood_group = Column(String(5))
    allergies = Column(Text)
    chronic_conditions = Column(Text)
    registered_branch_id = Column(Integer, ForeignKey("Branch.branch_id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", back_populates="patient")
    registered_branch = relationship("Branch", back_populates="patients")
    appointments = relationship("Appointment", back_populates="patient")
    insurances = relationship("Insurance", back_populates="patient")
    conditions = relationship("PatientCondition", back_populates="patient")
    allergies_rel = relationship("PatientAllergy", back_populates="patient")
    branches = relationship("PatientBranches", back_populates="patient")
    payments = relationship("Payments", back_populates="patient")

class Employee(Base):
    __tablename__ = "Employee"
    employee_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("User.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    branch_id = Column(Integer, ForeignKey("Branch.branch_id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False, index=True)
    salary = Column(DECIMAL(10, 2))
    joined_date = Column(Date)
    user = relationship("User", back_populates="employee")
    branch = relationship("Branch", back_populates="employees")
    doctors = relationship("Doctor", back_populates="employee")

class Doctor(Base):
    __tablename__ = "Doctor"
    doctor_id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("Employee.employee_id", ondelete="CASCADE"), unique=True, nullable=False)
    room_no = Column(String(10))
    medical_licence_number = Column(String(50), nullable=False, index=True)
    employee = relationship("Employee", back_populates="doctors")
    specializations = relationship("Specialization", secondary="Doctor_Specialization", back_populates="doctors")
    timeslots = relationship("Timeslot", back_populates="doctor")

class Branch(Base):
    __tablename__ = "Branch"
    branch_id = Column(Integer, primary_key=True, autoincrement=True)
    branch_name = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False)
    contact_id = Column(Integer, ForeignKey("Contact.contact_id", ondelete="SET NULL"))
    address_id = Column(Integer, ForeignKey("Address.address_id", ondelete="SET NULL"))
    contact = relationship("Contact", back_populates="branches")
    address = relationship("Address", back_populates="branches")
    employees = relationship("Employee", back_populates="branch")
    patients = relationship("Patient", back_populates="registered_branch")
    timeslots = relationship("Timeslot", back_populates="branch")
    patient_branches = relationship("PatientBranches", back_populates="branch")

class Specialization(Base):
    __tablename__ = "Specialization"
    specialization_id = Column(Integer, primary_key=True, autoincrement=True)
    specialization_name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    doctors = relationship("Doctor", secondary="Doctor_Specialization", back_populates="specializations")

class Doctor_Specialization(Base):
    __tablename__ = "Doctor_Specialization"
    doctor_specialization_id = Column(Integer, primary_key=True, autoincrement=True)
    specialization_id = Column(Integer, ForeignKey("Specialization.specialization_id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("Doctor.doctor_id", ondelete="CASCADE"), nullable=False)
    __table_args__ = (UniqueConstraint('doctor_id', 'specialization_id', name='unique_doctor_spec'),)

class Insurance(Base):
    __tablename__ = "Insurance"
    insurance_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("Patient.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    insurance_package_id = Column(Integer, ForeignKey("Insurance_packages.insurance_package_id", ondelete="CASCADE"), nullable=False)
    updated_date = Column(DateTime, default="CURRENT_TIMESTAMP")
    status = Column(Enum('active', 'expired'), default='active')
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    patient = relationship("Patient", back_populates="insurances")
    insurance_package = relationship("Insurance_packages", back_populates="insurances")
    claims = relationship("Claims", back_populates="insurance")

class Insurance_packages(Base):
    __tablename__ = "Insurance_packages"
    insurance_package_id = Column(Integer, primary_key=True, autoincrement=True)
    package_name = Column(String(100), nullable=False, index=True)
    annual_limit = Column(DECIMAL(10, 2), nullable=False)
    copayment_percentage = Column(DECIMAL(5, 2), nullable=False)
    updated_date = Column(DateTime, default="CURRENT_TIMESTAMP")
    insurances = relationship("Insurance", back_populates="insurance_package")

class Timeslot(Base):
    __tablename__ = "Timeslot"
    time_slot_id = Column(Integer, primary_key=True, autoincrement=True)
    doctor_id = Column(Integer, ForeignKey("Doctor.doctor_id", ondelete="CASCADE"), nullable=False)
    branch_id = Column(Integer, ForeignKey("Branch.branch_id", ondelete="CASCADE"), nullable=False)
    available_date = Column(Date, nullable=False, index=True)
    is_booked = Column(Boolean, default=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    doctor = relationship("Doctor", back_populates="timeslots")
    branch = relationship("Branch", back_populates="timeslots")
    appointments = relationship("Appointment", back_populates="timeslot")
    __table_args__ = (UniqueConstraint('doctor_id', 'branch_id', 'available_date', 'start_time', name='unique_timeslot'),)

class Status(Base):
    __tablename__ = "Status"
    status_id = Column(Integer, primary_key=True, autoincrement=True)
    status_name = Column(Enum('Scheduled', 'Completed', 'Cancelled'), nullable=False)
    appointments = relationship("Appointment", back_populates="status")

class Appointment(Base):
    __tablename__ = "Appointment"
    appointment_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("Patient.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    time_slot_id = Column(Integer, ForeignKey("Timeslot.time_slot_id", ondelete="CASCADE"), nullable=False, index=True)
    status_id = Column(Integer, ForeignKey("Status.status_id", ondelete="RESTRICT"), nullable=False, default=1)
    notes = Column(Text)
    updated_at = Column(DateTime, default="CURRENT_TIMESTAMP", onupdate="CURRENT_TIMESTAMP")
    created_at = Column(DateTime, default="CURRENT_TIMESTAMP")
    patient = relationship("Patient", back_populates="appointments")
    timeslot = relationship("Timeslot", back_populates="appointments")
    status = relationship("Status", back_populates="appointments")
    medical_records = relationship("MedicalRecord", back_populates="appointment")
    consultation_records = relationship("ConsultationRecord", back_populates="appointment")
    invoice = relationship("Invoice", back_populates="appointment", uselist=False)

class MedicalRecord(Base):
    __tablename__ = "MedicalRecord"
    medical_record_id = Column(Integer, primary_key=True, autoincrement=True)
    appointment_id = Column(Integer, ForeignKey("Appointment.appointment_id", ondelete="CASCADE"), nullable=False, index=True)
    chief_complaint = Column(Text, nullable=False)
    symptoms = Column(Text)
    diagnoses = Column(Text)
    appointment = relationship("Appointment", back_populates="medical_records")
    treatments = relationship("Treatment", back_populates="medical_record")
    prescriptions = relationship("Prescription", back_populates="medical_record")
    consultation_records = relationship("ConsultationRecord", back_populates="medical_record")

class Treatment_Category(Base):
    __tablename__ = "Treatment_Category"
    treatment_category_id = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    treatments = relationship("Treatment_Catalogue", back_populates="category")

class Treatment_Catalogue(Base):
    __tablename__ = "Treatment_Catalogue"
    treatment_service_code = Column(Integer, primary_key=True, autoincrement=True)
    treatment_category_id = Column(Integer, ForeignKey("Treatment_Category.treatment_category_id", ondelete="SET NULL"))
    treatment_name = Column(String(255), nullable=False, index=True)
    base_price = Column(DECIMAL(10, 2), nullable=False)
    duration = Column(Integer, nullable=False)
    updated_date = Column(DateTime, default="CURRENT_TIMESTAMP")
    category = relationship("Treatment_Category", back_populates="treatments")
    treatments_applied = relationship("Treatment", back_populates="treatment_catalogue")

class Treatment(Base):
    __tablename__ = "Treatment"
    treatment_id = Column(Integer, primary_key=True, autoincrement=True)
    medical_record_id = Column(Integer, ForeignKey("MedicalRecord.medical_record_id", ondelete="CASCADE"), nullable=False, index=True)
    treatment_service_code = Column(Integer, ForeignKey("Treatment_Catalogue.treatment_service_code", ondelete="RESTRICT"), nullable=False)
    medical_record = relationship("MedicalRecord", back_populates="treatments")
    treatment_catalogue = relationship("Treatment_Catalogue", back_populates="treatments_applied")

class Medication(Base):
    __tablename__ = "Medication"
    medication_id = Column(Integer, primary_key=True, autoincrement=True)
    generic_name = Column(String(255), nullable=False, index=True)
    manufacturer = Column(String(100))
    form = Column(String(50))
    contraindications = Column(Text)
    side_effects = Column(Text)
    prescriptions = relationship("Prescription", back_populates="medication")

class Prescription(Base):
    __tablename__ = "Prescription"
    prescription_id = Column(Integer, primary_key=True, autoincrement=True)
    medical_record_id = Column(Integer, ForeignKey("MedicalRecord.medical_record_id", ondelete="CASCADE"), nullable=False, index=True)
    medication_id = Column(Integer, ForeignKey("Medication.medication_id", ondelete="RESTRICT"), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(50), nullable=False)
    duration_days = Column(Integer, nullable=False)
    instructions = Column(Text)
    medical_record = relationship("MedicalRecord", back_populates="prescriptions")
    medication = relationship("Medication", back_populates="prescriptions")

class ConsultationRecord(Base):
    __tablename__ = "ConsultationRecord"
    consultation_record_id = Column(Integer, primary_key=True, autoincrement=True)
    appointment_id = Column(Integer, ForeignKey("Appointment.appointment_id", ondelete="CASCADE"), nullable=False, index=True)
    medical_record_id = Column(Integer, ForeignKey("MedicalRecord.medical_record_id", ondelete="CASCADE"), nullable=False)
    invoice_id = Column(Integer, ForeignKey("Invoice.invoice_id", ondelete="SET NULL"))
    appointment = relationship("Appointment", back_populates="consultation_records")
    medical_record = relationship("MedicalRecord", back_populates="consultation_records")
    invoice = relationship("Invoice", back_populates="consultation_records")

class Invoice(Base):
    __tablename__ = "Invoice"
    invoice_id = Column(Integer, primary_key=True, autoincrement=True)
    appointment_id = Column(Integer, ForeignKey("Appointment.appointment_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    sub_total = Column(DECIMAL(10, 2), nullable=False)
    insurance_claimed_amount = Column(DECIMAL(10, 2), default=0.00)
    status = Column(Enum('Pending', 'Completed'), default='Pending')
    appointment = relationship("Appointment", back_populates="invoice")
    consultation_records = relationship("ConsultationRecord", back_populates="invoice")
    payments = relationship("Payments", back_populates="invoice")
    claims = relationship("Claims", back_populates="invoice")

class Payments(Base):
    __tablename__ = "Payments"
    payment_id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_id = Column(Integer, ForeignKey("Invoice.invoice_id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("Patient.patient_id", ondelete="CASCADE"), nullable=False)
    payment_method = Column(Enum('Cash', 'Card', 'Insurance'), default='Cash')
    status = Column(Enum('Pending', 'Completed'), default='Pending')
    payment_date = Column(DateTime, default="CURRENT_TIMESTAMP")
    amount = Column(DECIMAL(10, 2), nullable=False)
    invoice = relationship("Invoice", back_populates="payments")
    patient = relationship("Patient", back_populates="payments")

class Claims(Base):
    __tablename__ = "Claims"
    claim_id = Column(Integer, primary_key=True, autoincrement=True)
    insurance_id = Column(Integer, ForeignKey("Insurance.insurance_id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_id = Column(Integer, ForeignKey("Invoice.invoice_id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    claimed_amount = Column(DECIMAL(10, 2), nullable=False)
    insurance = relationship("Insurance", back_populates="claims")
    invoice = relationship("Invoice", back_populates="claims")

class ConditionCategory(Base):
    __tablename__ = "ConditionCategory"
    condition_category_id = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(100), nullable=False, index=True)
    conditions = relationship("Conditions", back_populates="category")

class Conditions(Base):
    __tablename__ = "Conditions"
    condition_id = Column(Integer, primary_key=True, autoincrement=True)
    condition_category_id = Column(Integer, ForeignKey("ConditionCategory.condition_category_id", ondelete="CASCADE"), nullable=False)
    condition_name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    category = relationship("ConditionCategory", back_populates="conditions")
    patient_conditions = relationship("PatientCondition", back_populates="condition")

class PatientCondition(Base):
    __tablename__ = "PatientCondition"
    patient_condition_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("Patient.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    condition_id = Column(Integer, ForeignKey("Conditions.condition_id", ondelete="CASCADE"), nullable=False)
    diagnosed_date = Column(Date, nullable=False)
    is_chronic = Column(Boolean, default=False)
    current_status = Column(Text)
    patient = relationship("Patient", back_populates="conditions")
    condition = relationship("Conditions", back_populates="patient_conditions")

class PatientAllergy(Base):
    __tablename__ = "PatientAllergy"
    patient_allergy_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("Patient.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    allergy_name = Column(String(255), nullable=False)
    severity = Column(Enum('Mild', 'Moderate', 'Severe'), nullable=False)
    reaction_description = Column(Text)
    patient = relationship("Patient", back_populates="allergies_rel")

class PatientBranches(Base):
    __tablename__ = "PatientBranches"
    patient_branch_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("Patient.patient_id", ondelete="CASCADE"), nullable=False)
    branch_id = Column(Integer, ForeignKey("Branch.branch_id", ondelete="CASCADE"), nullable=False)
    patient = relationship("Patient", back_populates="branches")
    branch = relationship("Branch", back_populates="patient_branches")
    __table_args__ = (UniqueConstraint('patient_id', 'branch_id', name='unique_patient_branch'),)

class Session(Base):
    __tablename__ = "Session"
    session_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("User.user_id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(512), nullable=False, index=True)
    created_at = Column(DateTime, default="CURRENT_TIMESTAMP")
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    user = relationship("User", back_populates="sessions")