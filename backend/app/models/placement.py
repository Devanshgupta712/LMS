import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Float, Integer, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class JobApplicationStatus(str, enum.Enum):
    APPLIED = "APPLIED"
    SHORTLISTED = "SHORTLISTED"
    INTERVIEW = "INTERVIEW"
    SELECTED = "SELECTED"
    REJECTED = "REJECTED"


class AssessmentType(str, enum.Enum):
    CODING = "CODING"
    APTITUDE = "APTITUDE"


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String)
    company: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    salary: Mapped[str | None] = mapped_column(String, nullable=True)
    isActive: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    applications = relationship("JobApplication", back_populates="job")


class JobApplication(Base):
    __tablename__ = "job_applications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    jobId: Mapped[str] = mapped_column("jobId", String, ForeignKey("jobs.id"))
    studentId: Mapped[str] = mapped_column("studentId", String, ForeignKey("users.id"))
    resumeUrl: Mapped[str | None] = mapped_column("resumeUrl", String, nullable=True)
    videoResumeUrl: Mapped[str | None] = mapped_column("videoResumeUrl", String, nullable=True)
    status: Mapped[JobApplicationStatus] = mapped_column(Enum(JobApplicationStatus), default=JobApplicationStatus.APPLIED)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    job = relationship("Job", back_populates="applications")
    student = relationship("User", back_populates="job_applications")


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String)
    type: Mapped[AssessmentType] = mapped_column(Enum(AssessmentType))
    courseId: Mapped[str | None] = mapped_column("courseId", String, ForeignKey("courses.id"), nullable=True)
    questions: Mapped[str] = mapped_column(String)  # JSON string
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    isActive: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    course = relationship("Course", back_populates="assessments")
    submissions = relationship("AssessmentSubmission", back_populates="assessment")


class AssessmentSubmission(Base):
    __tablename__ = "assessment_submissions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessmentId: Mapped[str] = mapped_column("assessmentId", String, ForeignKey("assessments.id"))
    studentId: Mapped[str] = mapped_column("studentId", String, ForeignKey("users.id"))
    answers: Mapped[str] = mapped_column(String)  # JSON string
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    submittedAt: Mapped[datetime] = mapped_column("submittedAt", DateTime, server_default=func.now())

    assessment = relationship("Assessment", back_populates="submissions")
    student = relationship("User", back_populates="assessment_submissions")


class MockInterview(Base):
    __tablename__ = "mock_interviews"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    studentId: Mapped[str] = mapped_column("studentId", String, ForeignKey("users.id"))
    scheduledAt: Mapped[datetime] = mapped_column("scheduledAt", DateTime)
    feedback: Mapped[str | None] = mapped_column(String, nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    reportUrl: Mapped[str | None] = mapped_column("reportUrl", String, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    student = relationship("User", back_populates="mock_interviews")


class CommunicationPractice(Base):
    __tablename__ = "communication_practice"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    studentId: Mapped[str] = mapped_column("studentId", String, ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(String)
    recordingUrl: Mapped[str | None] = mapped_column("recordingUrl", String, nullable=True)
    feedback: Mapped[str | None] = mapped_column(String, nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    student = relationship("User", back_populates="comm_practice")
