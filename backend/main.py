import sys
from pathlib import Path
import shutil
from datetime import datetime

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
    title="Waste Management System"
)


# ==============================
# CORS
# ==============================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================
# DATABASE
# ==============================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ==============================
# HOME
# ==============================

@app.get("/")
def home():

    return {
        "message": "Waste Management API is running"
    }


# ==============================
# HEALTH
# ==============================

@app.get("/health")
def health():

    try:

        with engine.connect():

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


# ==============================
# REGISTER
# ==============================

@app.post("/register")
def register(
    name: str,
    email: str,
    password: str,
    db: Session = Depends(get_db)
):

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:

        return {
            "message": "Email already registered"
        }

    new_user = User(
        name=name,
        email=email,
        password=password,
        role="user"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user_id": new_user.user_id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role
    }


# ==============================
# LOGIN
# ==============================

@app.post("/login")
def login(
    email: str,
    password: str,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:

        return {
            "message": "User not found"
        }

    if user.password != password:

        return {
            "message": "Invalid password"
        }

    return {
        "message": "Login successful",
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }


# ==============================
# AI CLASSIFICATION
# ==============================

@app.post("/classify")
async def classify(file: UploadFile = File(...)):

    try:
        upload_dir = PROJECT_ROOT / "uploads"
        upload_dir.mkdir(exist_ok=True)

        file_path = upload_dir / file.filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        waste_type = classify_image(str(file_path))

        return {
            "waste_type": waste_type
        }

    except Exception as e:
        print("CLASSIFICATION ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=f"AI classification failed: {str(e)}"
        )

    if (
        not file.content_type
        or not file.content_type.startswith("image/")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image"
        )

    upload_folder = PROJECT_ROOT / "uploads"

    upload_folder.mkdir(
        exist_ok=True
    )

    file_path = upload_folder / file.filename

    with open(
        file_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    try:

        waste_type = classify_image(
            str(file_path)
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"AI classification failed: {str(e)}"
        )

    return {
        "message": "Image classified successfully",
        "waste_type": waste_type,
        "filename": file.filename
    }


# ==============================
# CREATE COMPLAINT
# ==============================

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
        .filter(
            User.user_id == user_id
        )
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
        "message": "Complaint created successfully",
        "complaint_id": complaint.complaint_id,
        "status": complaint.status,
        "waste_type": complaint.waste_type,
        "latitude": complaint.latitude,
        "longitude": complaint.longitude
    }


# ==============================
# ADMIN - ALL COMPLAINTS
# ==============================

@app.get("/user/{user_id}/complaints")
def get_user_complaints(
    user_id: int,
    db: Session = Depends(get_db)
):
    complaints = (
        db.query(Complaint)
        .filter(Complaint.user_id == user_id)
        .order_by(Complaint.created_at.desc())
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
@app.get("/admin/complaints")
def get_all_complaints(
    db: Session = Depends(get_db)
):

    complaints = (
        db.query(Complaint)
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


# ==============================
# GET WORKERS
# ==============================

@app.get("/workers")
def get_workers(
    db: Session = Depends(get_db)
):

    workers = (
        db.query(Worker)
        .all()
    )

    return [

        {
            "worker_id": worker.worker_id,
            "name": worker.name,
            "phone": worker.phone,
            "availability": worker.availability
        }

        for worker in workers
    ]


# ==============================
# ADMIN - ASSIGN WORKER
# ==============================

@app.post("/admin/assign")
def assign_complaint(
    complaint_id: int,
    worker_id: int,
    db: Session = Depends(get_db)
):

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

    worker = (
        db.query(Worker)
        .filter(
            Worker.worker_id
            == worker_id
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
            Assignment.complaint_id
            == complaint_id
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


# ==============================
# WORKER - COMPLAINTS
# ==============================

@app.get("/worker/{worker_id}/complaints")
def get_worker_complaints(
    worker_id: int,
    db: Session = Depends(get_db)
):

    assignments = (
        db.query(Assignment)
        .filter(
            Assignment.worker_id
            == worker_id
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

                "complaint_id":
                    complaint.complaint_id,

                "user_id":
                    complaint.user_id,

                "latitude":
                    complaint.latitude,

                "longitude":
                    complaint.longitude,

                "waste_type":
                    complaint.waste_type,

                "status":
                    complaint.status,

                "created_at":
                    complaint.created_at
            })

    return result


# ==============================
# WORKER - UPDATE STATUS
# ==============================

@app.patch(
    "/worker/complaint/{complaint_id}/status"
)
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


# ==============================
# WORKER - CREATE DISPOSAL
# ==============================

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

    # Create verification record
    verification = Verification(
        complaint_id=complaint_id,
        admin_id=1,
        status="Pending"
    )

    db.add(verification)

    db.commit()

    db.refresh(disposal)

    return {
        "message":
            "Disposal record created successfully",

        "disposal_id":
            disposal.disposal_id,

        "complaint_id":
            complaint_id,

        "route":
            route,

        "verification":
            "Pending"
    }


# ==============================
# ADMIN - VERIFY DISPOSAL
# ==============================

@app.patch(
    "/admin/verify/{complaint_id}"
)
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
        "message":
            "Disposal verification updated",

        "complaint_id":
            complaint_id,

        "status":
            status,

        "remarks":
            remarks
    }