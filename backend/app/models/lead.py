import enum
import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    INTERESTED = "INTERESTED"
    CONVERTED = "CONVERTED"
    LOST = "LOST"


class MessageChannel(str, enum.Enum):
    EMAIL = "EMAIL"
    WHATSAPP = "WHATSAPP"
    IN_APP = "IN_APP"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    source: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[LeadStatus] = mapped_column(Enum(LeadStatus, native_enum=False), default=LeadStatus.NEW)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    assignedToId: Mapped[str | None] = mapped_column("assignedToId", String, ForeignKey("users.id"), nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    assigned_to = relationship("User", back_populates="leads_assigned", foreign_keys=[assigned_to_id])
    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan")


class LeadActivity(Base):
    __tablename__ = "lead_activities"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    leadId: Mapped[str] = mapped_column("leadId", String, ForeignKey("leads.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String)  # CALL, EMAIL, WHATSAPP, NOTE
    message: Mapped[str | None] = mapped_column(String, nullable=True)
    channel: Mapped[MessageChannel | None] = mapped_column(Enum(MessageChannel, native_enum=False), nullable=True)
    scheduledAt: Mapped[datetime | None] = mapped_column("scheduledAt", DateTime, nullable=True)
    sentAt: Mapped[datetime | None] = mapped_column("sentAt", DateTime, nullable=True)
    response: Mapped[str | None] = mapped_column(String, nullable=True)
    userId: Mapped[str | None] = mapped_column("userId", String, ForeignKey("users.id"), nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    lead = relationship("Lead", back_populates="activities")
    user = relationship("User", back_populates="lead_activities")
