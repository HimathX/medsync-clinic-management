from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .routers import (
    auth, patients, doctors, appointments, medications, branches, consultations
)
# TODO: Import remaining routers after conversion:
# users, addresses, employees, invoices, payments, specializations
from .database import connection_pool
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CATMS - Clinic Appointment and Treatment Management System",
    description="A comprehensive medical clinic management system with stored procedures and SQL functions",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed debugging"""
    print(f"❌ VALIDATION ERROR: {exc}")
    print(f"❌ REQUEST URL: {request.url}")
    print(f"❌ REQUEST METHOD: {request.method}")
    print(f"❌ VALIDATION DETAILS: {exc.errors()}")
    
    # Try to get request body for debugging
    try:
        body = await request.body()
        print(f"❌ REQUEST BODY: {body.decode()}")
    except Exception as e:
        print(f"❌ Could not read request body: {e}")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "message": "Validation error - check the request data format",
            "errors": exc.errors()
        }
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("CATMS Backend starting up...")
    logger.info("Database connection pool initialized")

@app.on_event("shutdown") 
async def shutdown_event():
    """Application shutdown event"""
    logger.info("CATMS Backend shutting down...")
    # Close connection pool if needed

# Authentication & Users (Converted to stored procedures)
app.include_router(auth.router)
# app.include_router(users.router)  # TODO: Convert to stored procedures
app.include_router(patients.router)

# Core Management (Converted to stored procedures)
app.include_router(doctors.router)
# app.include_router(employees.router)  # TODO: Convert to stored procedures
app.include_router(branches.router)  # Converted to stored procedures
# app.include_router(specializations.router)  # TODO: Convert to stored procedures

# Appointments & Consultations (Converted to stored procedures)
app.include_router(appointments.router)
app.include_router(consultations.router)  # Converted to stored procedures

# Medical Data (Converted to stored procedures)
app.include_router(medications.router)  # Converted to stored procedures

# Billing & Payments (Not converted yet)  
# app.include_router(invoices.router)  # TODO: Convert to stored procedures
# app.include_router(payments.router)  # TODO: Convert to stored procedures

# Infrastructure (Not converted yet)
# app.include_router(addresses.router)  # TODO: Convert to stored procedures

@app.get("/")
def read_root():
    """Root endpoint with system status"""
    return {
        "message": "Welcome to CATMS - Clinic Appointment and Treatment Management System",
        "version": "2.0.0",
        "status": "operational",
        "database": "MySQL with stored procedures",
        "features": [
            "Patient Registration",
            "Doctor Management", 
            "Appointment Booking",
            "Medical Records",
            "Billing System",
            "Multi-branch Support"
        ]
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        from .database import execute_query
        # Test database connection
        result = execute_query("SELECT 1 as status", fetch='one')
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")

@app.get("/api/info")
def api_info():
    """API information endpoint"""
    return {
        "title": "CATMS API",
        "description": "Medical clinic management system with comprehensive features",
        "version": "2.0.0",
        "endpoints": {
            "authentication": "/auth/*",
            "patients": "/patients/*", 
            "doctors": "/doctors/*",
            "appointments": "/appointments/*",
            "consultations": "/consultations/*",
            "medications": "/medications/*",
            "branches": "/branches/*",
            "employees": "/employees/*",
            "payments": "/payments/*",
            "invoices": "/invoices/*"
        },
        "database": {
            "type": "MySQL",
            "features": ["Stored Procedures", "Functions", "Triggers", "UUIDs"]
        }
    }