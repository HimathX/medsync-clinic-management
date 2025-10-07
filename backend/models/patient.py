from sqlalchemy import Column, String, Text, Enum, TIMESTAMP, ForeignKey, Boolean, Date, func
from sqlalchemy.orm import relationship
from core.database import Base

class Patient(Base):
    __tablename__ = "patient"
    
    patient_id = Column(String(36), ForeignKey('user.user_id'), primary_key=True)
    blood_group = Column(Enum('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', name='blood_group_enum'), nullable=False)
    allergies = Column(Text)
    chronic_conditions = Column(Text)
    registered_branch_id = Column(String(36), ForeignKey('branch.branch_id'), nullable=False)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    user = relationship("User", back_populates="patient")
    branch = relationship("Branch", back_populates="patients")
    appointments = relationship("Appointment", back_populates="patient")
    allergies_list = relationship("PatientAllergy", back_populates="patient")
    conditions = relationship("PatientCondition", back_populates="patient")
    insurances = relationship("Insurance", back_populates="patient")
    payments = relationship("Payment", back_populates="patient")


class PatientAllergy(Base):
    __tablename__ = "patient_allergy"
    
    patient_allergy_id = Column(String(36), primary_key=True)
    patient_id = Column(String(36), ForeignKey('patient.patient_id'), nullable=False)
    allergy_name = Column(String(50), nullable=False)
    severity = Column(Enum('Mild', 'Moderate', 'Severe', 'Life-threatening', name='severity_enum'), default='Mild')
    reaction_description = Column(String(200))
    diagnosed_date = Column(Date)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    patient = relationship("Patient", back_populates="allergies_list")


class PatientCondition(Base):
    __tablename__ = "patient_condition"
    
    patient_id = Column(String(36), ForeignKey('patient.patient_id'), primary_key=True)
    condition_id = Column(String(36), ForeignKey('conditions.condition_id'), primary_key=True)
    diagnosed_date = Column(Date, nullable=False)
    is_chronic = Column(Boolean, default=False)
    current_status = Column(Enum('Active', 'In Treatment', 'Managed', 'Resolved', name='condition_status_enum'), default='Active')
    notes = Column(Text)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    patient = relationship("Patient", back_populates="conditions")
    condition = relationship("Condition", back_populates="patients")
