from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from core.database import Base

class Branch(Base):
    __tablename__ = "branch"
    
    branch_id = Column(String(36), primary_key=True)
    branch_name = Column(String(50), nullable=False, unique=True)
    contact_id = Column(String(36), ForeignKey('contact.contact_id'), nullable=False)
    address_id = Column(String(36), ForeignKey('address.address_id'), nullable=False)
    manager_id = Column(String(36), ForeignKey('employee.employee_id'))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    contact = relationship("Contact", back_populates="branches")
    address = relationship("Address", back_populates="branches")
    manager = relationship("Employee", back_populates="managed_branches", foreign_keys=[manager_id])
    employees = relationship("Employee", back_populates="branch", foreign_keys="[Employee.branch_id]")
    patients = relationship("Patient", back_populates="branch")
    time_slots = relationship("TimeSlot", back_populates="branch")
