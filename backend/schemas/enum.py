from enum import Enum

class UserType(str, Enum):
    patient = "patient"
    employee = "employee"

class Gender(str, Enum):
    M = "M"
    F = "F"
    Other = "Other"

class ContactType(str, Enum):
    primary = "primary"
    secondary = "secondary"

class Status(str, Enum):
    Scheduled = "Scheduled"
    InProgress = "InProgress"
    Completed = "Completed"
    Cancelled = "Cancelled"

class PaymentMethod(str, Enum):
    Cash = "Cash"
    Card = "Card"
    Insurance = "Insurance"

class PaymentStatus(str, Enum):
    Pending = "Pending"
    Completed = "Completed"

class InsuranceStatus(str, Enum):
    active = "active"
    expired = "expired"

class Severity(str, Enum):
    Mild = "Mild"
    Moderate = "Moderate"
    Severe = "Severe"