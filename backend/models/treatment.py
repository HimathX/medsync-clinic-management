from sqlalchemy import Column, String, Text, Time, TIMESTAMP, ForeignKey, DECIMAL, func
from sqlalchemy.orm import relationship
from core.database import Base

class TreatmentCatalogue(Base):
    __tablename__ = "treatment_catalogue"
    
    treatment_service_code = Column(String(36), primary_key=True)
    treatment_name = Column(String(100), nullable=False, unique=True)
    base_price = Column(DECIMAL(10, 2), nullable=False)
    duration = Column(Time, nullable=False)
    description = Column(Text)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    treatments = relationship("Treatment", back_populates="treatment_catalogue")


class Treatment(Base):
    __tablename__ = "treatment"
    
    treatment_id = Column(String(36), primary_key=True)
    consultation_rec_id = Column(String(36), ForeignKey('consultation_record.consultation_rec_id'), nullable=False)
    treatment_service_code = Column(String(36), ForeignKey('treatment_catalogue.treatment_service_code'), nullable=False)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    consultation_record = relationship("ConsultationRecord", back_populates="treatments")
    treatment_catalogue = relationship("TreatmentCatalogue", back_populates="treatments")
