from sqlalchemy import Column, String, Text, Date, Enum, TIMESTAMP, ForeignKey, DECIMAL, func
from sqlalchemy.orm import relationship
from core.database import Base

class Invoice(Base):
    __tablename__ = "invoice"
    
    invoice_id = Column(String(36), primary_key=True)
    consultation_rec_id = Column(String(36), ForeignKey('consultation_record.consultation_rec_id'), nullable=False, unique=True)
    sub_total = Column(DECIMAL(10, 2), nullable=False, default=0)
    tax_amount = Column(DECIMAL(10, 2), default=0)
    due_date = Column(Date)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    consultation_record = relationship("ConsultationRecord", back_populates="invoice")
    claims = relationship("Claim", back_populates="invoice")


class Payment(Base):
    __tablename__ = "payment"
    
    payment_id = Column(String(36), primary_key=True)
    patient_id = Column(String(36), ForeignKey('patient.patient_id'), nullable=False)
    amount_paid = Column(DECIMAL(10, 2), nullable=False)
    payment_method = Column(Enum('Cash', 'Credit Card', 'Debit Card', 'Online', 'Insurance', 'Other', name='payment_method_enum'), nullable=False)
    status = Column(Enum('Completed', 'Pending', 'Failed', 'Refunded', name='payment_status_enum'), default='Pending')
    payment_date = Column(Date, nullable=False)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    patient = relationship("Patient", back_populates="payments")


class Claim(Base):
    __tablename__ = "claim"
    
    claim_id = Column(String(36), primary_key=True)
    invoice_id = Column(String(36), ForeignKey('invoice.invoice_id'), nullable=False)
    insurance_id = Column(String(36), ForeignKey('insurance.insurance_id'), nullable=False)
    claim_amount = Column(DECIMAL(12, 2), nullable=False)
    claim_date = Column(Date, nullable=False)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    invoice = relationship("Invoice", back_populates="claims")
    insurance = relationship("Insurance", back_populates="claims")
