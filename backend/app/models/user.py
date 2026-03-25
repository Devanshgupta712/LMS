import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, Enum, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Role(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    TRAINER = "TRAINER"
    STUDENT = "STUDENT"
    MARKETER = "MARKETER"


class AdminPermission(Base):
    __tablename__ = "admin_permissions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[str] = mapped_column("userId", String, ForeignKey("users.id"), unique=True)
    manageUsers: Mapped[bool] = mapped_column("manageUsers", Boolean, default=False)
    manageBatches: Mapped[bool] = mapped_column("manageBatches", Boolean, default=False)
    manageCourses: Mapped[bool] = mapped_column("manageCourses", Boolean, default=False)
    manageLeaves: Mapped[bool] = mapped_column("manageLeaves", Boolean, default=False)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="admin_permission")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.STUDENT)
    avatar: Mapped[str | None] = mapped_column(String, nullable=True)
    studentId: Mapped[str | None] = mapped_column("studentId", String, unique=True, nullable=True)
    dob: Mapped[str | None] = mapped_column(String, nullable=True)
    educationStatus: Mapped[str | None] = mapped_column("educationStatus", String, nullable=True)
    highestEducation: Mapped[str | None] = mapped_column("highestEducation", String, nullable=True)
    degree: Mapped[str | None] = mapped_column(String, nullable=True)
    passingYear: Mapped[str | None] = mapped_column("passingYear", String, nullable=True)
    isActive: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    isVerified: Mapped[bool] = mapped_column("isVerified", Boolean, default=False)
    verificationCode: Mapped[str | None] = mapped_column("verificationCode", String, nullable=True)
    verificationExpiry: Mapped[datetime | None] = mapped_column("verificationExpiry", DateTime, nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())


    # Relationships
    trainer_batches = relationship("Batch", back_populates="trainer", foreign_keys="Batch.trainerId")
    batch_enrollments = relationship("BatchStudent", back_populates="student")
    leads_assigned = relationship("Lead", back_populates="assigned_to", foreign_keys="Lead.assignedToId")
    registrations = relationship("Registration", back_populates="student")
    documents = relationship("Document", back_populates="student")
    attendance_records = relationship("Attendance", back_populates="student")
    leave_requests = relationship("LeaveRequest", back_populates="user", foreign_keys="LeaveRequest.userId")
    leaves_approved = relationship("LeaveRequest", back_populates="approved_by", foreign_keys="LeaveRequest.approvedById")
    tasks_assigned = relationship("Task", back_populates="trainer", foreign_keys="Task.assignedBy")
    assignments_assigned = relationship("Assignment", back_populates="trainer", foreign_keys="Assignment.assignedBy")
    assignment_submissions = relationship("AssignmentSubmission", back_populates="student", foreign_keys="AssignmentSubmission.studentId")
    feedback_received = relationship("Feedback", back_populates="student", foreign_keys="Feedback.studentId")
    feedback_given = relationship("Feedback", back_populates="created_by", foreign_keys="Feedback.createdById")
    job_applications = relationship("JobApplication", back_populates="student")
    assessment_submissions = relationship("AssessmentSubmission", back_populates="student")
    mock_interviews = relationship("MockInterview", back_populates="student")
    violations = relationship("Violation", back_populates="student")
    notifications = relationship("Notification", back_populates="user")
    comm_practice = relationship("CommunicationPractice", back_populates="student")
    time_tracking = relationship("TimeTracking", back_populates="user")
    lead_activities = relationship("LeadActivity", back_populates="user")
    sentMessages = relationship("Message", back_populates="sender", foreign_keys="Message.senderId")
    receivedMessages = relationship("Message", back_populates="recipient", foreign_keys="Message.recipientId")
    admin_permission = relationship("AdminPermission", back_populates="user", uselist=False)

