from sqlalchemy import Column, String, Date, Time, Text, Enum, TIMESTAMP, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from core.database import Base

class TimeSlot(Base):
    __tablename__ = "time_slot"
    
    time_slot_id = Column(String(36), primary_key=True)
    doctor_id = Column(String(36), ForeignKey('doctor.doctor_id'), nullable=False)
    branch_id = Column(String(36), ForeignKey('branch.branch_id'), nullable=False)
    available_date = Column(Date, nullable=False)
    is_booked = Column(Boolean, default=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    doctor = relationship("Doctor", back_populates="time_slots")
    branch = relationship("Branch", back_populates="time_slots")
    appointment = relationship("Appointment", back_populates="time_slot", uselist=False)


class Appointment(Base):
    __tablename__ = "appointment"
    
    appointment_id = Column(String(36), primary_key=True)
    time_slot_id = Column(String(36), ForeignKey('time_slot.time_slot_id'), nullable=False, unique=True)
    patient_id = Column(String(36), ForeignKey('patient.patient_id'), nullable=False)
    status = Column(Enum('Scheduled', 'Completed', 'Cancelled', 'No-Show', name='appointment_status_enum'), default='Scheduled')
    notes = Column(Text)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    time_slot = relationship("TimeSlot", back_populates="appointment")
    patient = relationship("Patient", back_populates="appointments")
    consultation_record = relationship("ConsultationRecord", back_populates="appointment", uselist=False)
