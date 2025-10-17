from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import test_database_connection, get_database_info
from core.db_export import export_database

# Import routers
from routers import (
    auth, doctor, appointment, branch, patient, conditions, 
    staff, timeslot, insurance, medication, prescription, 
    consultation, treatment_catalogue, treatment, payment, invoice, claims
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    print("🚀 Starting MedSync API...")
    ok = test_database_connection()
    if ok:
        info = get_database_info()
        if info:
            print(f"✅ Connected to database: {info['database']}")
            print(f"📊 Tables found: {len(info['tables'])}")
    else:
        print("❌ Database connection failed!")
    
    yield
    
    print("👋 Shutting down MedSync API...")

# Create FastAPI app
app = FastAPI(
    title="MedSync Clinic Management API",
    description="API for managing clinic operations",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(patient.router, prefix="/patients")
app.include_router(doctor.router, prefix="/doctors")
app.include_router(staff.router, prefix="/staff")
app.include_router(appointment.router, prefix="/appointments")
app.include_router(timeslot.router, prefix="/timeslots")
app.include_router(branch.router, prefix="/branches")
app.include_router(conditions.router, prefix="/conditions")
app.include_router(insurance.router, prefix="/insurance")
app.include_router(medication.router, prefix="/medications")
app.include_router(prescription.router, prefix="/prescriptions")
app.include_router(consultation.router, prefix="/consultations")
app.include_router(treatment_catalogue.router, prefix="/treatment-catalogue")
app.include_router(treatment.router, prefix="/treatment-records")
app.include_router(payment.router, prefix="/payments")
app.include_router(invoice.router, prefix="/invoices")
app.include_router(claims.router, prefix="/claims")

@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to MedSync Clinic Management API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected"
    }

if __name__ == "__main__":
    # import uvicorn
    # uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
    export_database()