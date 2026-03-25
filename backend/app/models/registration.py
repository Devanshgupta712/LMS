import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Float, DateTime, ForeignKey, func, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RegistrationStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    APPROVED = "APPROVED"


class Registration(Base):
    __tablename__ = "registrations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    studentId: Mapped[str] = mapped_column("studentId", String, ForeignKey("users.id"))
    courseId: Mapped[str] = mapped_column("courseId", String, ForeignKey("courses.id"))
    batchId: Mapped[str | None] = mapped_column("batchId", String, ForeignKey("batches.id"), nullable=True)
    feeAmount: Mapped[float] = mapped_column("feeAmount", Float, default=0)
    feePaid: Mapped[float] = mapped_column("feePaid", Float, default=0)
    receiptUrl: Mapped[str | None] = mapped_column("receiptUrl", String, nullable=True)
    status: Mapped[RegistrationStatus] = mapped_column(Enum(RegistrationStatus, native_enum=False), default=RegistrationStatus.CONFIRMED)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    student = relationship("User", back_populates="registrations")
    course = relationship("Course", back_populates="registrations")
    batch = relationship("Batch", back_populates="registrations")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    studentId: Mapped[str] = mapped_column("studentId", String, ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(String)
    fileName: Mapped[str] = mapped_column("fileName", String)
    fileUrl: Mapped[str] = mapped_column("fileUrl", String)
    verified: Mapped[bool] = mapped_column(Boolean, default=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    student = relationship("User", back_populates="documents")
