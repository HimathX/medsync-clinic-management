from sqlalchemy import Column, String, Text, Enum, Boolean, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from core.database import Base

class ConditionsCategory(Base):
    __tablename__ = "conditions_category"
    
    condition_category_id = Column(String(36), primary_key=True)
    category_name = Column(String(50), nullable=False, unique=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    conditions = relationship("Condition", back_populates="category")


class Condition(Base):
    __tablename__ = "conditions"
    
    condition_id = Column(String(36), primary_key=True)
    condition_category_id = Column(String(36), ForeignKey('conditions_category.condition_category_id'), nullable=False)
    condition_name = Column(String(50), nullable=False)
    description = Column(Text)
    severity = Column(Enum('Mild', 'Moderate', 'Severe', 'Critical', name='condition_severity_enum'))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    category = relationship("ConditionsCategory", back_populates="conditions")
    patients = relationship("PatientCondition", back_populates="condition")
