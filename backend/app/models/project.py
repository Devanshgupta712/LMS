import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Float, Integer, DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProjectStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    UNDER_REVIEW = "UNDER_REVIEW"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"


class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class TaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"


class AssignmentType(str, enum.Enum):
    CODING = "CODING"
    WRITTEN = "WRITTEN"
    MCQ = "MCQ"
    PROJECT = "PROJECT"


class ViolationType(str, enum.Enum):
    DEADLINE_MISSED = "DEADLINE_MISSED"
    LATE_SUBMISSION = "LATE_SUBMISSION"
    INCOMPLETE_WORK = "INCOMPLETE_WORK"
    LOW_ATTENDANCE = "LOW_ATTENDANCE"
    POOR_ACADEMIC_PERFORMANCE = "POOR_ACADEMIC_PERFORMANCE"
    UNAUTHORIZED_ASSISTANCE = "UNAUTHORIZED_ASSISTANCE"
    HONOR_CODE_VIOLATION = "HONOR_CODE_VIOLATION"
    DISRUPTIVE_BEHAVIOR = "DISRUPTIVE_BEHAVIOR"
    PLAGIARISM = "PLAGIARISM"


class ViolationSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ViolationStatus(str, enum.Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    techStack: Mapped[str | None] = mapped_column("techStack", String(500), nullable=True)
    githubUrl: Mapped[str | None] = mapped_column("githubUrl", String(500), nullable=True)
    batchId: Mapped[str | None] = mapped_column("batchId", String, ForeignKey("batches.id"), nullable=True)
    trainerId: Mapped[str | None] = mapped_column("trainerId", String, ForeignKey("users.id"), nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(Enum(ProjectStatus), default=ProjectStatus.NOT_STARTED)
    deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    startDate: Mapped[datetime | None] = mapped_column("startDate", DateTime, nullable=True)
    endDate: Mapped[datetime | None] = mapped_column("endDate", DateTime, nullable=True)
    maxTeamSize: Mapped[int] = mapped_column("maxTeamSize", Integer, default=4)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    batch = relationship("Batch", back_populates="projects", foreign_keys=[batchId])
    milestones = relationship("ProjectMilestone", back_populates="project", cascade="all, delete-orphan")
    trainer = relationship("User", foreign_keys=[trainerId])


class ProjectMilestone(Base):
    __tablename__ = "project_milestones"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    projectId: Mapped[str] = mapped_column("projectId", String, ForeignKey("projects.id"))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    dueDate: Mapped[datetime | None] = mapped_column("dueDate", DateTime, nullable=True)
    isCompleted: Mapped[bool] = mapped_column("isCompleted", Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    project = relationship("Project", back_populates="milestones")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    batchId: Mapped[str | None] = mapped_column("batchId", String, ForeignKey("batches.id"), nullable=True)
    assignedBy: Mapped[str | None] = mapped_column("assignedBy", String, ForeignKey("users.id"), nullable=True)
    priority: Mapped[TaskPriority] = mapped_column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.PENDING)
    dueDate: Mapped[datetime | None] = mapped_column("dueDate", DateTime, nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    trainer = relationship("User", foreign_keys=[assignedBy], back_populates="tasks_assigned")


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[AssignmentType] = mapped_column(Enum(AssignmentType), default=AssignmentType.CODING)
    batchId: Mapped[str | None] = mapped_column("batchId", String, ForeignKey("batches.id"), nullable=True)
    courseId: Mapped[str | None] = mapped_column("courseId", String, ForeignKey("courses.id"), nullable=True)
    assignedBy: Mapped[str | None] = mapped_column("assignedBy", String, ForeignKey("users.id"), nullable=True)
    totalMarks: Mapped[int] = mapped_column("totalMarks", Integer, default=100)
    dueDate: Mapped[datetime | None] = mapped_column("dueDate", DateTime, nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    batch = relationship("Batch", foreign_keys=[batchId])
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")
    trainer = relationship("User", foreign_keys=[assignedBy], back_populates="assignments_assigned")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assignmentId: Mapped[str] = mapped_column("assignmentId", String, ForeignKey("assignments.id"))
    studentId: Mapped[str] = mapped_column("studentId", String, ForeignKey("users.id"))
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    fileUrl: Mapped[str | None] = mapped_column("fileUrl", String(500), nullable=True)
    marks: Mapped[int | None] = mapped_column(Integer, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    submittedAt: Mapped[datetime] = mapped_column("submittedAt", DateTime, server_default=func.now())
    gradedAt: Mapped[datetime | None] = mapped_column("gradedAt", DateTime, nullable=True)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", foreign_keys=[studentId], back_populates="assignment_submissions")


class Violation(Base):
    __tablename__ = "violations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    studentId: Mapped[str] = mapped_column("studentId", String, ForeignKey("users.id"))
    type: Mapped[ViolationType] = mapped_column(Enum(ViolationType))
    severity: Mapped[ViolationSeverity] = mapped_column(Enum(ViolationSeverity), default=ViolationSeverity.MEDIUM)
    status: Mapped[ViolationStatus] = mapped_column(Enum(ViolationStatus), default=ViolationStatus.OPEN)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Link to the source (project, task, assignment, etc.)
    referenceType: Mapped[str | None] = mapped_column("referenceType", String(50), nullable=True)
    referenceId: Mapped[str | None] = mapped_column("referenceId", String, nullable=True)
    # Resolution
    resolvedById: Mapped[str | None] = mapped_column("resolvedById", String, ForeignKey("users.id"), nullable=True)
    resolutionNote: Mapped[str | None] = mapped_column("resolutionNote", Text, nullable=True)
    resolvedAt: Mapped[datetime | None] = mapped_column("resolvedAt", DateTime, nullable=True)
    # Penalties
    penaltyPoints: Mapped[int] = mapped_column("penaltyPoints", Integer, default=0)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    student = relationship("User", foreign_keys=[studentId], back_populates="violations")
    resolved_by = relationship("User", foreign_keys=[resolvedById])
