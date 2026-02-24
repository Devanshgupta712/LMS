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
    result = await db.execute(select(Job).order_by(Job.created_at.desc()))
    jobs = result.scalars().all()
    out = []
    for j in jobs:
        app_q = await db.execute(select(func.count(JobApplication.id)).where(JobApplication.job_id == j.id))
        out.append(JobOut(
            id=j.id, title=j.title, company=j.company,
            description=j.description, location=j.location, salary=j.salary,
            is_active=j.is_active,
            application_count=app_q.scalar() or 0,
            created_at=j.created_at,
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
        is_active=job.is_active, created_at=job.created_at,
    )


# ─── Applications ─────────────────────────────────────
@router.get("/jobs/{job_id}/applications")
async def list_applications(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(JobApplication).where(JobApplication.job_id == job_id).order_by(JobApplication.created_at.desc())
    )
    apps = result.scalars().all()
    out = []
    for a in apps:
        student = await db.get(User, a.student_id)
        out.append({
            "id": a.id, "student_name": student.name if student else "",
            "student_id": student.student_id if student else None,
            "status": a.status.value, "resume_url": a.resume_url,
            "created_at": a.created_at,
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
            JobApplication.job_id == job_id,
            JobApplication.student_id == user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already applied")

    app = JobApplication(
        job_id=job_id, student_id=user.id,
        resume_url=body.get("resume_url"),
        video_resume_url=body.get("video_resume_url"),
    )
    db.add(app)
    await db.flush()
    return {"status": "applied"}


# ─── Assessments ──────────────────────────────────────
@router.get("/assessments")
async def list_assessments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assessment).where(Assessment.is_active == True).order_by(Assessment.created_at.desc()))
    return [
        {
            "id": a.id, "title": a.title, "type": a.type.value,
            "duration": a.duration, "created_at": a.created_at,
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
        course_id=body.get("course_id"),
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
        assessment_id=assessment_id,
        student_id=user.id,
        answers=body.get("answers", "[]"),
        score=body.get("score"),
    )
    db.add(submission)
    await db.flush()
    return {"status": "submitted"}


# ─── Mock Interviews ──────────────────────────────────
@router.get("/mock-interviews")
async def list_mock_interviews(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MockInterview).order_by(MockInterview.scheduled_at.desc()))
    interviews = result.scalars().all()
    out = []
    for m in interviews:
        student = await db.get(User, m.student_id)
        out.append({
            "id": m.id, "student_name": student.name if student else "",
            "scheduled_at": m.scheduled_at, "score": m.score,
            "feedback": m.feedback, "completed": m.completed,
        })
    return out
