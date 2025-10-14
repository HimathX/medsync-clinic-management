from sqlalchemy import Column, String, Date, Enum, TIMESTAMP, ForeignKey, Boolean, DECIMAL, func
from sqlalchemy.orm import relationship
from core.database import Base

class Employee(Base):
    __tablename__ = "employee"
    
    employee_id = Column(String(36), ForeignKey('user.user_id'), primary_key=True)
    branch_id = Column(String(36), ForeignKey('branch.branch_id'), nullable=False)
    role = Column(Enum('doctor', 'nurse', 'admin', 'receptionist', 'manager', name='employee_role_enum'), nullable=False)
    salary = Column(DECIMAL(10, 2), nullable=False)
    joined_date = Column(Date, nullable=False)
    end_date = Column(Date)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    user = relationship("User", back_populates="employee")
    branch = relationship("Branch", foreign_keys=[branch_id], back_populates="employees")
    doctor = relationship("Doctor", back_populates="employee", uselist=False)
    managed_branches = relationship("Branch", back_populates="manager", foreign_keys="[Branch.manager_id]")



class Doctor(Base):
    __tablename__ = "doctor"
    
    doctor_id = Column(String(36), ForeignKey('employee.employee_id'), primary_key=True)
    room_no = Column(String(5))
    medical_licence_no = Column(String(50), nullable=False, unique=True)
    consultation_fee = Column(DECIMAL(10, 2), nullable=False, default=0)
    is_available = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    employee = relationship("Employee", back_populates="doctor")
    specializations = relationship("DoctorSpecialization", back_populates="doctor")
    time_slots = relationship("TimeSlot", back_populates="doctor")


class Specialization(Base):
    __tablename__ = "specialization"
    
    specialization_id = Column(String(36), primary_key=True)
    specialization_title = Column(String(50), nullable=False, unique=True)
    other_details = Column(String(200))
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    doctors = relationship("DoctorSpecialization", back_populates="specialization")


class DoctorSpecialization(Base):
    __tablename__ = "doctor_specialization"
    
    doctor_id = Column(String(36), ForeignKey('doctor.doctor_id'), primary_key=True)
    specialization_id = Column(String(36), ForeignKey('specialization.specialization_id'), primary_key=True)
    certification_date = Column(Date)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    doctor = relationship("Doctor", back_populates="specializations")
    specialization = relationship("Specialization", back_populates="doctors")
