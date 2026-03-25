import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Float, Integer, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"
    ON_LEAVE = "ON_LEAVE"


class LeaveStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class LeaveType(str, enum.Enum):
    INTERVIEW = "INTERVIEW"
    MEDICAL = "MEDICAL"
    WORK_FROM_HOME = "WORK_FROM_HOME"
    OTHER = "OTHER"


class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    studentId: Mapped[str] = mapped_column("studentId", String, ForeignKey("users.id"))
    batchId: Mapped[str] = mapped_column("batchId", String, ForeignKey("batches.id"))
    date: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[AttendanceStatus] = mapped_column(Enum(AttendanceStatus, native_enum=False), default=AttendanceStatus.PRESENT)
    loginTime: Mapped[datetime | None] = mapped_column("loginTime", DateTime, nullable=True)
    logoutTime: Mapped[datetime | None] = mapped_column("logoutTime", DateTime, nullable=True)
    totalHours: Mapped[float | None] = mapped_column("totalHours", Float, nullable=True)
    remarks: Mapped[str | None] = mapped_column(String, nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    student = relationship("User", back_populates="attendance_records")
    batch = relationship("Batch", back_populates="attendance")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[str] = mapped_column("userId", String, ForeignKey("users.id"))
    batchId: Mapped[str | None] = mapped_column("batchId", String, ForeignKey("batches.id"), nullable=True)
    leaveType: Mapped[LeaveType] = mapped_column("leaveType", Enum(LeaveType, native_enum=False), default=LeaveType.OTHER)
    proofUrl: Mapped[str | None] = mapped_column("proofUrl", String, nullable=True)
    startDate: Mapped[datetime] = mapped_column("startDate", DateTime)
    endDate: Mapped[datetime] = mapped_column("endDate", DateTime)
    reason: Mapped[str | None] = mapped_column(String, nullable=True)
    rejectionReason: Mapped[str | None] = mapped_column("rejectionReason", String, nullable=True)
    isCloudinary: Mapped[bool] = mapped_column("isCloudinary", Boolean, default=False)
    status: Mapped[LeaveStatus] = mapped_column(Enum(LeaveStatus, native_enum=False), default=LeaveStatus.PENDING)
    approvedById: Mapped[str | None] = mapped_column("approvedById", String, ForeignKey("users.id"), nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())


    user = relationship("User", back_populates="leave_requests", foreign_keys=[userId])
    approved_by = relationship("User", back_populates="leaves_approved", foreign_keys=[approvedById])
    batch = relationship("Batch", back_populates="leave_requests")


class TimeTracking(Base):
    __tablename__ = "time_tracking"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[str] = mapped_column("userId", String, ForeignKey("users.id"))
    date: Mapped[datetime] = mapped_column(DateTime)
    loginTime: Mapped[datetime] = mapped_column("loginTime", DateTime)
    logoutTime: Mapped[datetime | None] = mapped_column("logoutTime", DateTime, nullable=True)
    totalMinutes: Mapped[int | None] = mapped_column("totalMinutes", Integer, nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    user = relationship("User", back_populates="time_tracking")
