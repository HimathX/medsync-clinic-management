from sqlalchemy import Column, String, Date, Enum, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from core.database import Base

class Address(Base):
    __tablename__ = "address"
    
    address_id = Column(String(36), primary_key=True)
    address_line1 = Column(String(50), nullable=False)
    address_line2 = Column(String(50))
    city = Column(String(50), nullable=False)
    province = Column(String(50), nullable=False)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(50), nullable=False, default='Sri Lanka')
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    users = relationship("User", back_populates="address")
    branches = relationship("Branch", back_populates="address")


class Contact(Base):
    __tablename__ = "contact"
    
    contact_id = Column(String(36), primary_key=True)
    contact_num1 = Column(String(20), nullable=False)
    contact_num2 = Column(String(20))
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    users = relationship("User", back_populates="contact")
    branches = relationship("Branch", back_populates="contact")


class User(Base):
    __tablename__ = "user"
    
    user_id = Column(String(36), primary_key=True)
    address_id = Column(String(36), ForeignKey('address.address_id'), nullable=False)
    user_type = Column(Enum('patient', 'employee', name='user_type_enum'), nullable=False)
    full_name = Column(String(255), nullable=False)
    NIC = Column(String(20), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    gender = Column(Enum('Male', 'Female', 'Other', name='gender_enum'), nullable=False)
    DOB = Column(Date, nullable=False)
    contact_id = Column(String(36), ForeignKey('contact.contact_id'), nullable=False)
    password_hash = Column(String(255), nullable=False)
    last_login = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    address = relationship("Address", back_populates="users")
    contact = relationship("Contact", back_populates="users")
    patient = relationship("Patient", back_populates="user", uselist=False)
    employee = relationship("Employee", back_populates="user", uselist=False)
