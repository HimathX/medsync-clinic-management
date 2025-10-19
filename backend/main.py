from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (
    auth, patient, doctor, branch, appointment, 
    timeslot, consultation, prescription, treatment,
    medication, insurance, invoice, payment, claims,
    conditions, treatment_catalogue, staff,
    dashboard_patient, dashboard_doctor, dashboard_staff,
    profile_patient
)

app = FastAPI(
    title="MedSync Clinic Management API",
    description="Comprehensive clinic management system API",
    version="1.0.0"
)

# CORS Configuration - IMPORTANT: Add WebSocket support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(patient.router, prefix="/api/patients", tags=["Patients"])
app.include_router(doctor.router, prefix="/api/doctors", tags=["Doctors"])
app.include_router(branch.router, prefix="/api/branches", tags=["Branches"])
app.include_router(appointment.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(timeslot.router, prefix="/api/timeslots", tags=["Time Slots"])
app.include_router(consultation.router, prefix="/api/consultations", tags=["Consultations"])
app.include_router(prescription.router, prefix="/api/prescriptions", tags=["Prescriptions"])
app.include_router(treatment.router, prefix="/api/treatments", tags=["Treatments"])
app.include_router(medication.router, prefix="/api/medications", tags=["Medications"])
app.include_router(insurance.router, prefix="/api/insurance", tags=["Insurance"])
app.include_router(invoice.router, prefix="/api/invoices", tags=["Invoices"])
app.include_router(payment.router, prefix="/api/payments", tags=["Payments"])
app.include_router(claims.router, prefix="/api/claims", tags=["Claims"])
app.include_router(conditions.router, prefix="/api/conditions", tags=["Conditions"])
app.include_router(treatment_catalogue.router, prefix="/api/treatment-catalogue", tags=["Treatment Catalogue"])
app.include_router(staff.router, prefix="/api/staff", tags=["Staff"])
app.include_router(dashboard_patient.router, prefix="/api/dashboard/patient", tags=["Patient Dashboard"])
app.include_router(dashboard_doctor.router, prefix="/api/dashboard/doctor", tags=["Doctor Dashboard"])
# app.include_router(dashboard_staff.router, prefix="/api/dashboard/staff", tags=["Staff Dashboard"])
app.include_router(profile_patient.router, prefix="/api/profile/patient", tags=["Patient Profile"])

@app.get("/")
async def root():
    return {
        "message": "MedSync Clinic Management API",
        "version": "1.0.0",
        "docs": "/docs",
        "websocket": "/api/appointments/ws/doctor/{doctor_id}"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}