import sys
from pathlib import Path
import shutil
from datetime import datetime

# Project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.database import engine, SessionLocal
from backend.models import (
    User,
    Complaint,
    Worker,
    Assignment,
    Disposal,
    Verification
)

from ai_model.classifier import classify_image


app = FastAPI(
    title="Waste Management System API",
    description="Backend API for waste classification and complaint management",
    version="1.0.0"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://waste-management-system-omega-orcin.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Database Dependency
# --------------------------------------------------

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# --------------------------------------------------
# Home
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Waste Management API is running"
    }


# --------------------------------------------------
# Health Check
# --------------------------------------------------

@app.get("/health")
def health_check(db: Session = Depends(get_db)):

    try:
        db.execute(
            __import__("sqlalchemy").text("SELECT 1")
        )

        return {
            "status": "OK",
            "database": "Connected"
        }

    except Exception as e:

        return {
            "status": "Error",
            "database": "Not Connected",
            "message": str(e)
        }


# --------------------------------------------------
# Register
# --------------------------------------------------

@app.post("/register")
def register(
    name: str,
    email: str,
    password: str,
    role: str = "user",
    db: Session = Depends(get_db)
):

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    if role not in ["user", "admin", "worker"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    user = User(
        name=name,
        email=email,
        password=password,
        role=role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Registration successful",
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }


# --------------------------------------------------
# Login
# --------------------------------------------------

@app.post("/login")
def login(
    email: str,
    password: str,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.email == email,
            User.password == password
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    response = {
        "message": "Login successful",
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }

    # Worker needs worker_id for dashboard
    if user.role == "worker":

        worker = (
            db.query(Worker)
            .filter(Worker.name == user.name)
            .first()
        )

        if worker:
            response["worker_id"] = worker.worker_id

    return response


# --------------------------------------------------
# AI Waste Classification
# --------------------------------------------------

@app.post("/classify")
async def classify(file: UploadFile = File(...)):

    try:

        upload_dir = PROJECT_ROOT / "uploads"
        upload_dir.mkdir(exist_ok=True)

        file_path = upload_dir / file.filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(
                file.file,
                buffer
            )

        waste_type = classify_image(
            str(file_path)
        )

        return {
            "waste_type": waste_type
        }

    except Exception as e:

        print(
            "CLASSIFICATION ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail=f"AI classification failed: {str(e)}"
        )


# --------------------------------------------------
# Submit Complaint
# --------------------------------------------------

@app.post("/complaints")
def create_complaint(
    user_id: int,
    latitude: float,
    longitude: float,
    waste_type: str,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    complaint = Complaint(
        user_id=user_id,
        latitude=latitude,
        longitude=longitude,
        waste_type=waste_type,
        status="Pending"
    )

    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    return {
        "message": "Complaint submitted successfully",
        "complaint_id": complaint.complaint_id,
        "status": complaint.status
    }


# --------------------------------------------------
# User Complaint History
# --------------------------------------------------

@app.get("/user/{user_id}/complaints")
def get_user_complaints(
    user_id: int,
    db: Session = Depends(get_db)
):

    complaints = (
        db.query(Complaint)
        .filter(
            Complaint.user_id == user_id
        )
        .order_by(
            Complaint.created_at.desc()
        )
        .all()
    )

    return [
        {
            "complaint_id": complaint.complaint_id,
            "waste_type": complaint.waste_type,
            "latitude": complaint.latitude,
            "longitude": complaint.longitude,
            "status": complaint.status,
            "created_at": complaint.created_at
        }
        for complaint in complaints
    ]


# --------------------------------------------------
# Admin - All Complaints
# --------------------------------------------------

@app.get("/admin/complaints")
def get_admin_complaints(
    db: Session = Depends(get_db)
):

    complaints = (
        db.query(Complaint)
        .order_by(
            Complaint.created_at.desc()
        )
        .all()
    )

    return [
        {
            "complaint_id": complaint.complaint_id,
            "user_id": complaint.user_id,
            "latitude": complaint.latitude,
            "longitude": complaint.longitude,
            "waste_type": complaint.waste_type,
            "status": complaint.status,
            "created_at": complaint.created_at
        }
        for complaint in complaints
    ]


# --------------------------------------------------
# Get Workers
# --------------------------------------------------

@app.get("/workers")
def get_workers(
    db: Session = Depends(get_db)
):

    workers = db.query(Worker).all()

    return [
        {
            "worker_id": worker.worker_id,
            "name": worker.name,
            "phone": worker.phone,
            "availability": worker.availability
        }
        for worker in workers
    ]


# --------------------------------------------------
# Admin - Assign Complaint
# --------------------------------------------------

@app.post("/admin/assign")
def assign_complaint(
    complaint_id: int,
    worker_id: int,
    db: Session = Depends(get_db)
):

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == complaint_id
        )
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    worker = (
        db.query(Worker)
        .filter(
            Worker.worker_id == worker_id
        )
        .first()
    )

    if not worker:
        raise HTTPException(
            status_code=404,
            detail="Worker not found"
        )

    existing_assignment = (
        db.query(Assignment)
        .filter(
            Assignment.complaint_id == complaint_id
        )
        .first()
    )

    if existing_assignment:

        existing_assignment.worker_id = worker_id

    else:

        assignment = Assignment(
            complaint_id=complaint_id,
            worker_id=worker_id
        )

        db.add(assignment)

    complaint.status = "Assigned"
    worker.availability = "Busy"

    db.commit()

    return {
        "message": "Complaint assigned successfully",
        "complaint_id": complaint_id,
        "worker_id": worker_id,
        "status": complaint.status
    }


# --------------------------------------------------
# Worker - Complaints
# --------------------------------------------------

@app.get("/worker/{worker_id}/complaints")
def get_worker_complaints(
    worker_id: int,
    db: Session = Depends(get_db)
):

    assignments = (
        db.query(Assignment)
        .filter(
            Assignment.worker_id == worker_id
        )
        .all()
    )

    result = []

    for assignment in assignments:

        complaint = (
            db.query(Complaint)
            .filter(
                Complaint.complaint_id
                == assignment.complaint_id
            )
            .first()
        )

        if complaint:

            result.append({
                "complaint_id": complaint.complaint_id,
                "user_id": complaint.user_id,
                "latitude": complaint.latitude,
                "longitude": complaint.longitude,
                "waste_type": complaint.waste_type,
                "status": complaint.status,
                "created_at": complaint.created_at
            })

    return result


# --------------------------------------------------
# Worker - Update Status
# --------------------------------------------------

@app.patch("/worker/complaint/{complaint_id}/status")
def update_complaint_status(
    complaint_id: int,
    status: str,
    db: Session = Depends(get_db)
):

    allowed_statuses = [
        "Assigned",
        "Collected",
        "Completed"
    ]

    if status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == complaint_id
        )
        .first()
    )

    if not complaint:

        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    complaint.status = status

    if status == "Completed":

        assignment = (
            db.query(Assignment)
            .filter(
                Assignment.complaint_id
                == complaint_id
            )
            .first()
        )

        if assignment:

            worker = (
                db.query(Worker)
                .filter(
                    Worker.worker_id
                    == assignment.worker_id
                )
                .first()
            )

            if worker:
                worker.availability = "Available"

    db.commit()

    return {
        "message": "Status updated successfully",
        "complaint_id": complaint_id,
        "status": complaint.status
    }


# --------------------------------------------------
# Worker - Disposal
# --------------------------------------------------

@app.post("/worker/disposal")
def create_disposal(
    complaint_id: int,
    route: str,
    proof_photo: str = "",
    db: Session = Depends(get_db)
):

    allowed_routes = [
        "Compost",
        "Biogas",
        "MRF",
        "Recycler"
    ]

    if route not in allowed_routes:

        raise HTTPException(
            status_code=400,
            detail="Invalid disposal route"
        )

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id
            == complaint_id
        )
        .first()
    )

    if not complaint:

        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    disposal = Disposal(
        complaint_id=complaint_id,
        route=route,
        proof_photo=proof_photo
    )

    db.add(disposal)

    # Admin ID 1 for prototype
    verification = Verification(
        complaint_id=complaint_id,
        admin_id=1,
        status="Pending"
    )

    db.add(verification)

    db.commit()
    db.refresh(disposal)

    return {
        "message": "Disposal record created successfully",
        "disposal_id": disposal.disposal_id,
        "complaint_id": complaint_id,
        "route": route,
        "verification": "Pending"
    }


# --------------------------------------------------
# Admin - Verify Disposal
# --------------------------------------------------

@app.patch("/admin/verify/{complaint_id}")
def verify_disposal(
    complaint_id: int,
    status: str,
    remarks: str = "",
    db: Session = Depends(get_db)
):

    if status not in [
        "Verified",
        "Rejected"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Status must be Verified or Rejected"
        )

    verification = (
        db.query(Verification)
        .filter(
            Verification.complaint_id
            == complaint_id
        )
        .first()
    )

    if not verification:

        raise HTTPException(
            status_code=404,
            detail="Verification record not found"
        )

    verification.status = status
    verification.remarks = remarks
    verification.verified_at = datetime.now()

    db.commit()

    return {
        "message": "Disposal verification updated",
        "complaint_id": complaint_id,
        "status": status,
        "remarks": remarks
    }