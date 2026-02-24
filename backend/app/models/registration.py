import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Registration(Base):
    __tablename__ = "registrations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    course_id: Mapped[str] = mapped_column(String, ForeignKey("courses.id"))
    batch_id: Mapped[str | None] = mapped_column(String, ForeignKey("batches.id"), nullable=True)
    fee_amount: Mapped[float] = mapped_column(Float, default=0)
    fee_paid: Mapped[float] = mapped_column(Float, default=0)
    receipt_url: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    student = relationship("User", back_populates="registrations")
    course = relationship("Course", back_populates="registrations")
    batch = relationship("Batch", back_populates="registrations")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(String)
    file_name: Mapped[str] = mapped_column(String)
    file_url: Mapped[str] = mapped_column(String)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    student = relationship("User", back_populates="documents")
