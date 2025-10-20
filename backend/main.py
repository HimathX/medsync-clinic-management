from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.openapi.utils import get_openapi
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import traceback
from datetime import datetime

from routers import (
    auth, patient, doctor, branch, appointment, 
    timeslot, consultation, prescription, treatment,
    medication, insurance, invoice, payment, claims,
    conditions, treatment_catalogue, staff,
    dashboard_patient, dashboard_doctor, dashboard_staff,
    profile_patient
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MedSync Clinic Management API",
    description="""
    ## 🏥 Comprehensive Clinic Management System
    
    ### 🔐 Authentication Instructions
    
    **IMPORTANT:** When using the "Authorize" button:
    - Enter your **EMAIL ADDRESS** in the **"username"** field
    - Enter your **PASSWORD** in the **"password"** field
    
    ⚠️ **Note:** Due to OAuth2 specifications, the field is labeled "username" 
    but you should enter your email address (e.g., `doctor@medsync.com`)
    
    ### 🧪 Test Credentials
    | Role | Username (Email) | Password |
    |------|------------------|----------|
    | Doctor | `doctor@medsync.com` | `password123` |
    | Admin | `admin@medsync.com` | `password123` |
    | Patient | `patient@medsync.com` | `password123` |
    
    ### 📚 API Features
    - Email-based authentication with JWT tokens
    - Role-based access control (RBAC)
    - Session management with database tracking
    - Comprehensive audit logging
    - HIPAA-compliant data access logging
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_parameters={
        "persistAuthorization": True,
        "displayRequestDuration": True,
        "filter": True,
        "tryItOutEnabled": True
    }
)

# ============================================
# CORS CONFIGURATION - WITH WEBSOCKET SUPPORT
# ============================================

# Allow all origins in development (restrict in production!)
origins = [
    "http://localhost:3000",      # React frontend
    "http://localhost:8000",      # FastAPI docs
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://localhost",
    "*"  # ⚠️ Remove in production! Only for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"]  # Expose all headers
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(patient.router)
app.include_router(doctor.router, prefix="/api/doctors", tags=["Doctors"])
app.include_router(branch.router, prefix="/api/branches", tags=["Branches"])
app.include_router(appointment.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(timeslot.router)
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

# ============================================
# ROOT ENDPOINT
# ============================================

@app.get("/", tags=["Root"])
async def root():
    """API Root - Health check and information"""
    return {
        "message": "MedSync Clinic Management API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "websocket_endpoints": [
            "/api/appointments/ws/doctor/{doctor_id}"
        ]
    }

@app.get("/health", tags=["Root"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "MedSync API"
    }

# ============================================
# CUSTOM OPENAPI SCHEMA (Email instead of Username)
# ============================================

def custom_openapi():
    """
    Customize OpenAPI schema to show 'email' instead of 'username' in Swagger UI
    """
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="MedSync Clinic Management API",
        version="1.0.0",
        description="Comprehensive clinic management system API with email-based authentication",
        routes=app.routes,
    )
    
    # Update the /token endpoint to show email field
    if "/api/auth/token" in openapi_schema["paths"]:
        token_endpoint = openapi_schema["paths"]["/api/auth/token"]["post"]
        
        # Update request body schema
        if "requestBody" in token_endpoint:
            token_endpoint["requestBody"]["content"]["application/x-www-form-urlencoded"]["schema"] = {
                "type": "object",
                "properties": {
                    "email": {
                        "type": "string",
                        "format": "email",
                        "title": "Email",
                        "description": "User's email address"
                    },
                    "password": {
                        "type": "string",
                        "title": "Password",
                        "description": "User's password"
                    }
                },
                "required": ["email", "password"]
            }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Add this middleware BEFORE the request ID middleware:

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests and responses"""
    print("\n" + "🌟"*40)
    print(f"📥 INCOMING REQUEST")
    print(f"   Method: {request.method}")
    print(f"   URL: {request.url}")
    print(f"   Path: {request.url.path}")
    print(f"   Query: {request.url.query}")
    print(f"   Client: {request.client.host}:{request.client.port}")
    print(f"   Headers: {dict(request.headers)}")
    
    # Try to read body (for debugging form data)
    if request.method == "POST":
        try:
            body = await request.body()
            print(f"   Body (raw): {body[:200]}")  # First 200 chars
            
            # Parse form data if content-type is form
            content_type = request.headers.get("content-type", "")
            if "application/x-www-form-urlencoded" in content_type:
                from urllib.parse import parse_qs
                form_data = parse_qs(body.decode())
                print(f"   Form Data: {form_data}")
        except Exception as e:
            print(f"   ⚠️  Could not read body: {str(e)}")
    
    print("🌟"*40 + "\n")
    
    # Call the actual endpoint
    response = await call_next(request)
    
    print("\n" + "⭐"*40)
    print(f"📤 OUTGOING RESPONSE")
    print(f"   Status: {response.status_code}")
    print(f"   Headers: {dict(response.headers)}")
    print("⭐"*40 + "\n")
    
    return response

# ============================================
# STARTUP EVENT
# ============================================

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 MedSync API Starting...")
    logger.info("📡 WebSocket endpoints available:")
    logger.info("   - ws://localhost:8000/api/appointments/ws/doctor/{doctor_id}")
    logger.info("✅ API Ready")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 MedSync API Shutting down...")