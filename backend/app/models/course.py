import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Float, DateTime, ForeignKey, func, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    duration: Mapped[str | None] = mapped_column(String, nullable=True)
    fee: Mapped[float] = mapped_column(Float, default=0)
    materials: Mapped[str | None] = mapped_column(String, nullable=True)
    isActive: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    batches = relationship("Batch", back_populates="course")
    registrations = relationship("Registration", back_populates="course")
    assessments = relationship("Assessment", back_populates="course")


class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    courseId: Mapped[str | None] = mapped_column("courseId", String, ForeignKey("courses.id"), nullable=True)
    name: Mapped[str] = mapped_column(String)
    startDate: Mapped[datetime] = mapped_column("startDate", DateTime)
    endDate: Mapped[datetime] = mapped_column("endDate", DateTime)
    scheduleTime: Mapped[str | None] = mapped_column("scheduleTime", String, nullable=True)
    trainerId: Mapped[str | None] = mapped_column("trainerId", String, ForeignKey("users.id"), nullable=True)
    leaveQuota: Mapped[int] = mapped_column("leaveQuota", Integer, default=0)
    isActive: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    course = relationship("Course", back_populates="batches")
    trainer = relationship("User", back_populates="trainer_batches", foreign_keys=[trainerId])
    students = relationship("BatchStudent", back_populates="batch")
    attendance = relationship("Attendance", back_populates="batch")
    projects = relationship("Project", back_populates="batch")
    videos = relationship("Video", back_populates="batch")
    feedback = relationship("Feedback", back_populates="batch")
    registrations = relationship("Registration", back_populates="batch")
    leave_requests = relationship("LeaveRequest", back_populates="batch")


class BatchStudent(Base):
    __tablename__ = "batch_students"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    batchId: Mapped[str] = mapped_column("batchId", String, ForeignKey("batches.id"))
    studentId: Mapped[str] = mapped_column("studentId", String, ForeignKey("users.id"))
    joinedAt: Mapped[datetime] = mapped_column("joinedAt", DateTime, server_default=func.now())

    batch = relationship("Batch", back_populates="students")
    student = relationship("User", back_populates="batch_enrollments")
