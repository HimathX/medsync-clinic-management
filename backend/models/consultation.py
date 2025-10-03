from sqlalchemy import Column, String, Text, Date, Boolean, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from core.database import Base

class ConsultationRecord(Base):
    __tablename__ = "consultation_record"
    
    consultation_rec_id = Column(String(36), primary_key=True)
    appointment_id = Column(String(36), ForeignKey('appointment.appointment_id'), nullable=False, unique=True)
    symptoms = Column(Text, nullable=False)
    diagnoses = Column(Text, nullable=False)
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(Date)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    appointment = relationship("Appointment", back_populates="consultation_record")
    treatments = relationship("Treatment", back_populates="consultation_record")
    prescriptions = relationship("PrescriptionItem", back_populates="consultation_record")
    invoice = relationship("Invoice", back_populates="consultation_record", uselist=False)
