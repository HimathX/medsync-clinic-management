from sqlalchemy import Column, String, Text, Date, Enum, Boolean, TIMESTAMP, ForeignKey, DECIMAL, func
from sqlalchemy.orm import relationship
from core.database import Base

class InsurancePackage(Base):
    __tablename__ = "insurance_package"
    
    insurance_package_id = Column(String(36), primary_key=True)
    package_name = Column(String(50), nullable=False, unique=True)
    annual_limit = Column(DECIMAL(12, 2), nullable=False)
    copayment_percentage = Column(DECIMAL(5, 2), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    insurances = relationship("Insurance", back_populates="package")


class Insurance(Base):
    __tablename__ = "insurance"
    
    insurance_id = Column(String(36), primary_key=True)
    patient_id = Column(String(36), ForeignKey('patient.patient_id'), nullable=False)
    insurance_package_id = Column(String(36), ForeignKey('insurance_package.insurance_package_id'), nullable=False)
    status = Column(Enum('Active', 'Inactive', 'Expired', 'Pending', name='insurance_status_enum'), default='Pending')
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    patient = relationship("Patient", back_populates="insurances")
    package = relationship("InsurancePackage", back_populates="insurances")
    claims = relationship("Claim", back_populates="insurance")
