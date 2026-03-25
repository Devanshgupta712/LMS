from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_roles
from app.models.user import User, Role
from app.models.placement import Job, JobApplication, Assessment, AssessmentSubmission, MockInterview
from app.schemas.schemas import JobCreate, JobOut

router = APIRouter(prefix="/api/placement", tags=["Placement"])


# ─── Jobs ─────────────────────────────────────────────
@router.get("/jobs")
async def list_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).order_by(Job.createdAt.desc()))
    jobs = result.scalars().all()
    out = []
    for j in jobs:
        app_q = await db.execute(select(func.count(JobApplication.id)).where(JobApplication.jobId == j.id))
        out.append(JobOut(
            id=j.id, title=j.title, company=j.company,
            description=j.description, location=j.location, salary=j.salary,
            isActive=j.isActive,
            applicationCount=app_q.scalar() or 0,
            createdAt=j.createdAt,
        ))
    return out


@router.post("/jobs", status_code=201)
async def create_job(
    body: JobCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    job = Job(
        title=body.title, company=body.company, description=body.description,
        location=body.location, salary=body.salary,
    )
    db.add(job)
    await db.flush()
    await db.refresh(job)
    return JobOut(
        id=job.id, title=job.title, company=job.company,
        description=job.description, location=job.location, salary=job.salary,
        isActive=job.isActive, createdAt=job.createdAt,
    )


# ─── Applications ─────────────────────────────────────
@router.get("/jobs/{job_id}/applications")
async def list_applications(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(JobApplication).where(JobApplication.jobId == job_id).order_by(JobApplication.createdAt.desc())
    )
    apps = result.scalars().all()
    out = []
    for a in apps:
        student = await db.get(User, a.studentId)
        out.append({
            "id": a.id, "studentName": student.name if student else "",
            "studentId": student.studentId if student else None,
            "status": a.status.value, "resumeUrl": a.resumeUrl,
            "createdAt": a.createdAt,
        })
    return out


@router.post("/jobs/{job_id}/apply", status_code=201)
async def apply_job(
    job_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Check if already applied
    existing = await db.execute(
        select(JobApplication).where(
            JobApplication.jobId == job_id,
            JobApplication.studentId == user.id,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Already applied")

    app = JobApplication(
        jobId=job_id, studentId=user.id,
        resumeUrl=body.get("resumeUrl"),
        videoResumeUrl=body.get("videoResumeUrl"),
    )
    db.add(app)
    await db.flush()
    return {"status": "applied"}


# ─── Assessments ──────────────────────────────────────
@router.get("/assessments")
async def list_assessments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assessment).where(Assessment.isActive == True).order_by(Assessment.createdAt.desc()))
    return [
        {
            "id": a.id, "title": a.title, "type": a.type.value,
            "duration": a.duration, "createdAt": a.createdAt,
        }
        for a in result.scalars().all()
    ]


@router.post("/assessments", status_code=201)
async def create_assessment(
    body: dict,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    assessment = Assessment(
        title=body["title"], type=body["type"],
        courseId=body.get("courseId"),
        questions=body.get("questions", "[]"),
        duration=body.get("duration"),
    )
    db.add(assessment)
    await db.flush()
    return {"id": assessment.id, "status": "created"}


@router.post("/assessments/{assessment_id}/submit", status_code=201)
async def submit_assessment(
    assessment_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    submission = AssessmentSubmission(
        assessmentId=assessment_id,
        studentId=user.id,
        answers=body.get("answers", "[]"),
        score=body.get("score"),
    )
    db.add(submission)
    await db.flush()
    return {"status": "submitted"}


# ─── Mock Interviews ──────────────────────────────────
@router.get("/mock-interviews")
async def list_mock_interviews(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MockInterview).order_by(MockInterview.scheduledAt.desc()))
    interviews = result.scalars().all()
    out = []
    for m in interviews:
        student = await db.get(User, m.studentId)
        out.append({
            "id": m.id, "studentName": student.name if student else "",
            "scheduledAt": m.scheduledAt, "score": m.score,
            "feedback": m.feedback, "completed": m.completed,
        })
    return out
