from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import test_database_connection, get_database_info, engine, Base

# Import routers
from routers import doctor, appointment, branch, patient

# Create FastAPI app
app = FastAPI(
    title="MedSync Clinic Management API",
    description="API for managing clinic operations",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(patient.router)
app.include_router(doctor.router)
app.include_router(appointment.router)
app.include_router(branch.router)

@app.on_event("startup")
async def startup_event():
    """Test database connection on startup"""
    print("🚀 Starting MedSync API...")
    ok = test_database_connection()
    if ok:
        info = get_database_info()
        if info:
            print(f"✅ Connected to database: {info['database']}")
            print(f"📊 Tables found: {len(info['tables'])}")
    else:
        print("❌ Database connection failed!")

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
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8020, reload=True)