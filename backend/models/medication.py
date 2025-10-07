from sqlalchemy import Column, String, Text, Integer, Enum, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from core.database import Base

class Medication(Base):
    __tablename__ = "medication"
    
    medication_id = Column(String(36), primary_key=True)
    generic_name = Column(String(50), nullable=False)
    manufacturer = Column(String(50), nullable=False)
    form = Column(Enum('Tablet', 'Capsule', 'Injection', 'Syrup', 'Other', name='medication_form_enum'), nullable=False)
    contraindications = Column(Text)
    side_effects = Column(Text)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    prescriptions = relationship("PrescriptionItem", back_populates="medication")


class PrescriptionItem(Base):
    __tablename__ = "prescription_item"
    
    prescription_item_id = Column(String(36), primary_key=True)
    medication_id = Column(String(36), ForeignKey('medication.medication_id'))
    consultation_rec_id = Column(String(36), ForeignKey('consultation_record.consultation_rec_id'))
    dosage = Column(String(50))
    frequency = Column(Enum('Once daily', 'Twice daily', 'Three times daily', 'As needed', name='frequency_enum'))
    duration_days = Column(Integer)
    instructions = Column(String(500))
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    medication = relationship("Medication", back_populates="prescriptions")
    consultation_record = relationship("ConsultationRecord", back_populates="prescriptions")
