from sqlalchemy import Column, Integer, String, DECIMAL, Enum, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func

from backend.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(
        Enum("user", "admin", "worker"),
        default="user"
    )


class Complaint(Base):
    __tablename__ = "complaints"

    complaint_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )
    photo = Column(String(255))
    latitude = Column(DECIMAL(10, 7))
    longitude = Column(DECIMAL(10, 7))
    waste_type = Column(String(100))

    status = Column(
        Enum("Pending", "Assigned", "Collected", "Completed"),
        default="Pending"
    )

    created_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )


class Worker(Base):
    __tablename__ = "workers"

    worker_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20))

    availability = Column(
        Enum("Available", "Busy"),
        default="Available"
    )


class Assignment(Base):
    __tablename__ = "assignments"

    assignment_id = Column(Integer, primary_key=True, index=True)

    complaint_id = Column(
        Integer,
        ForeignKey("complaints.complaint_id"),
        nullable=False
    )

    worker_id = Column(
        Integer,
        ForeignKey("workers.worker_id"),
        nullable=False
    )

    assigned_date = Column(
        TIMESTAMP,
        server_default=func.now()
    )


class Disposal(Base):
    __tablename__ = "disposal"

    disposal_id = Column(Integer, primary_key=True, index=True)

    complaint_id = Column(
        Integer,
        ForeignKey("complaints.complaint_id"),
        nullable=False
    )

    route = Column(
        Enum("Compost", "Biogas", "MRF", "Recycler"),
        nullable=False
    )

    proof_photo = Column(String(255))

    disposal_date = Column(
        TIMESTAMP,
        server_default=func.now()
    )


class Verification(Base):
    __tablename__ = "verification"

    verification_id = Column(Integer, primary_key=True, index=True)

    complaint_id = Column(
        Integer,
        ForeignKey("complaints.complaint_id"),
        nullable=False
    )

    admin_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    status = Column(
        Enum("Pending", "Verified", "Rejected"),
        default="Pending"
    )

    remarks = Column(String(500))

    verified_at = Column(
        TIMESTAMP,
        nullable=True
    )