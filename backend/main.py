from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import test_database_connection, get_database_info

# Import routers
from routers import doctor, appointment, branch, patient, conditions

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
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patient.router, prefix="/patients")
app.include_router(doctor.router, prefix="/doctors")
app.include_router(appointment.router, prefix="/appointments")
app.include_router(branch.router, prefix="/branches")
app.include_router(conditions.router, prefix="/conditions")  

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
    uvicorn.run("main:app", host="127.0.0.1", port=8020, reload=True)  # Changed port to 8000