from fastapi import FastAPI
from .routers import auth, users, patients, addresses

app = FastAPI(title="Clinic Appointment and Treatment Management System")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(patients.router)
app.include_router(addresses.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to CATMS"}