import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Integer, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[str] = mapped_column("userId", String, ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String)
    message: Mapped[str] = mapped_column(String)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    type: Mapped[str | None] = mapped_column(String, nullable=True)
    referenceId: Mapped[str | None] = mapped_column("referenceId", String, nullable=True)
    link: Mapped[str | None] = mapped_column(String, nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    user = relationship("User", back_populates="notifications")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    senderId: Mapped[str] = mapped_column("senderId", String, ForeignKey("users.id"))
    recipientId: Mapped[str | None] = mapped_column("recipientId", String, ForeignKey("users.id"), nullable=True)
    channel: Mapped[str] = mapped_column(String, default="IN_APP")
    subject: Mapped[str | None] = mapped_column(String, nullable=True)
    content: Mapped[str] = mapped_column(String)
    sentAt: Mapped[datetime] = mapped_column("sentAt", DateTime, server_default=func.now())
    readAt: Mapped[datetime | None] = mapped_column("readAt", DateTime, nullable=True)

    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    batchId: Mapped[str] = mapped_column("batchId", String, ForeignKey("batches.id"))
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    videoUrl: Mapped[str] = mapped_column("videoUrl", String)
    duration: Mapped[str | None] = mapped_column(String, nullable=True)
    timeline: Mapped[str | None] = mapped_column(String, nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    batch = relationship("Batch", back_populates="videos")


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    studentId: Mapped[str] = mapped_column("studentId", String, ForeignKey("users.id"))
    batchId: Mapped[str] = mapped_column("batchId", String, ForeignKey("batches.id"))
    week: Mapped[int] = mapped_column(Integer)
    rating: Mapped[int] = mapped_column(Integer, default=0)
    comments: Mapped[str | None] = mapped_column(String, nullable=True)
    createdById: Mapped[str | None] = mapped_column("createdById", String, ForeignKey("users.id"), nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    student = relationship("User", back_populates="feedback_received", foreign_keys=[student_id])
    batch = relationship("Batch", back_populates="feedback")
    created_by = relationship("User", back_populates="feedback_given", foreign_keys=[created_by_id])
