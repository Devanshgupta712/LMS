from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.database import get_db
from app.middleware.auth import get_current_user, require_roles
from app.models.user import User, Role
from app.models.attendance import Attendance, AttendanceStatus, LeaveRequest, LeaveStatus
from app.models.course import Batch, BatchStudent
from app.models.project import (
    Project, ProjectMilestone, ProjectStatus,
    Task, TaskStatus, TaskPriority,
    Assignment, AssignmentType, AssignmentSubmission,
    Violation, ViolationType, ViolationSeverity, ViolationStatus,
)
from app.models.notification import Video, Feedback

router = APIRouter(prefix="/api/training", tags=["Training"])


# ─── Attendance ───────────────────────────────────────
@router.get("/attendance")
async def get_attendance(
    batch_id: str = "",
    student_id: str = "",
    date: str = "",
    db: AsyncSession = Depends(get_db),
):
    query = select(Attendance)
    if batch_id:
        query = query.where(Attendance.batch_id == batch_id)
    if student_id:
        query = query.where(Attendance.student_id == student_id)
    if date:
        day = datetime.strptime(date, "%Y-%m-%d")
        query = query.where(func.date(Attendance.date) == day.date())
    result = await db.execute(query.order_by(Attendance.date.desc()).limit(100))
    records = result.scalars().all()
    out = []
    for r in records:
        student = await db.get(User, r.student_id)
        out.append({
            "id": r.id, "student_id": r.student_id,
            "student_name": student.name if student else "Unknown",
            "batch_id": r.batch_id, "date": r.date.isoformat() if r.date else None,
            "status": r.status.value, "remarks": r.remarks,
        })
    return out


import io
import csv
from fastapi.responses import StreamingResponse

@router.get("/attendance/export")
async def export_attendance(
    batch_id: str = "",
    start_date: str = "",
    end_date: str = "",
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    query = select(Attendance)
    if batch_id:
        query = query.where(Attendance.batch_id == batch_id)
    if start_date:
        query = query.where(Attendance.date >= datetime.strptime(start_date, "%Y-%m-%d"))
    if end_date:
        query = query.where(Attendance.date <= datetime.strptime(end_date, "%Y-%m-%d"))
        
    result = await db.execute(query.order_by(Attendance.date.desc()))
    records = result.scalars().all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Student ID", "Student Name", "Status", "Remarks"])
    
    for r in records:
        student = await db.get(User, r.student_id)
        writer.writerow([
            r.date.strftime("%Y-%m-%d") if r.date else "",
            student.student_id if student and student.student_id else r.student_id,
            student.name if student else "Unknown",
            r.status.value,
            r.remarks or ""
        ])
        
    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=attendance_report.csv"
    return response


import json
import base64
from datetime import timedelta

@router.get("/batches/{batch_id}/qr")
async def generate_qr_token(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER))
):
    # Verify batch exists
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    # Create simple token representing today's attendance session for this batch
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    payload = {
        "b": batch_id,
        "d": today_str,
        "exp": (datetime.utcnow() + timedelta(hours=12)).isoformat()
    }
    
    # Simple base64 encoding (since we don't have python-jose installed by default, 
    # we'll just encode a JSON string. In production, sign this!)
    encoded = base64.b64encode(json.dumps(payload).encode()).decode()
    return {"qr_token": encoded, "batch_id": batch_id, "date": today_str}



@router.post("/attendance", status_code=201)
async def mark_attendance(
    body: dict,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    recs = body.get("records", [])
    if not recs:
        # Fallback for single record if needed
        data = [body] if "student_id" in body else []
    else:
        data = recs

    for item in data:
        # Check for existing record to avoid duplicates
        day = datetime.strptime(item["date"], "%Y-%m-%d")
        existing_result = await db.execute(
            select(Attendance).where(
                Attendance.student_id == item["student_id"],
                Attendance.batch_id == item["batch_id"],
                func.date(Attendance.date) == day.date()
            )
        )
        existing = existing_result.scalar_one_or_none()
        
        if existing:
            existing.status = item.get("status", "PRESENT")
            existing.remarks = item.get("remarks")
        else:
            record = Attendance(
                student_id=item["student_id"],
                batch_id=item["batch_id"],
                date=day,
                status=item.get("status", "PRESENT"),
                remarks=item.get("remarks"),
            )
            db.add(record)
            
    await db.flush()
    return {"status": "success", "message": f"Updated {len(data)} records"}


# ─── Leave Requests ───────────────────────────────────
@router.post("/leave-request", status_code=201)
async def submit_leave(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    leave = LeaveRequest(
        user_id=user.id,
        start_date=datetime.strptime(body["start_date"], "%Y-%m-%d"),
        end_date=datetime.strptime(body["end_date"], "%Y-%m-%d"),
        reason=body.get("reason"),
    )
    db.add(leave)
    await db.flush()
    return {"id": leave.id, "status": "submitted"}


# ─── Projects ─────────────────────────────────────────
@router.get("/projects")
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).order_by(Project.created_at.desc()))
    projects = result.scalars().all()
    out = []
    for p in projects:
        ms_result = await db.execute(
            select(ProjectMilestone).where(ProjectMilestone.project_id == p.id).order_by(ProjectMilestone.order)
        )
        milestones = ms_result.scalars().all()
        trainer = await db.get(User, p.trainer_id) if p.trainer_id else None
        total_ms = len(milestones)
        done_ms = len([m for m in milestones if m.is_completed])

        # Check for overdue
        is_overdue = False
        if p.deadline and p.status not in (ProjectStatus.COMPLETED,) and p.deadline < datetime.utcnow():
            is_overdue = True

        out.append({
            "id": p.id, "title": p.title, "description": p.description,
            "tech_stack": p.tech_stack, "github_url": p.github_url,
            "batch_id": p.batch_id, "status": p.status.value,
            "is_overdue": is_overdue,
            "trainer_name": trainer.name if trainer else None,
            "deadline": p.deadline.isoformat() if p.deadline else None,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "end_date": p.end_date.isoformat() if p.end_date else None,
            "max_team_size": p.max_team_size,
            "progress": round((done_ms / total_ms * 100) if total_ms else 0),
            "milestones": [
                {
                    "id": m.id, "title": m.title, "description": m.description,
                    "due_date": m.due_date.isoformat() if m.due_date else None,
                    "is_completed": m.is_completed, "order": m.order,
                }
                for m in milestones
            ],
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })
    return out


@router.post("/projects", status_code=201)
async def create_project(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    project = Project(
        title=body["title"], description=body.get("description"),
        tech_stack=body.get("tech_stack"), github_url=body.get("github_url"),
        batch_id=body.get("batch_id"), trainer_id=user.id,
        status=body.get("status", "NOT_STARTED"),
        max_team_size=body.get("max_team_size", 4),
    )
    if body.get("deadline"):
        project.deadline = datetime.strptime(body["deadline"], "%Y-%m-%d")
    if body.get("start_date"):
        project.start_date = datetime.strptime(body["start_date"], "%Y-%m-%d")
    if body.get("end_date"):
        project.end_date = datetime.strptime(body["end_date"], "%Y-%m-%d")
    db.add(project)
    await db.flush()

    for idx, ms in enumerate(body.get("milestones", [])):
        milestone = ProjectMilestone(
            project_id=project.id, title=ms["title"],
            description=ms.get("description"), order=idx,
        )
        if ms.get("due_date"):
            milestone.due_date = datetime.strptime(ms["due_date"], "%Y-%m-%d")
        db.add(milestone)
    await db.flush()
    return {"id": project.id, "status": "created"}


# ─── Tasks ────────────────────────────────────────────
@router.get("/tasks")
async def list_tasks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).order_by(Task.created_at.desc()))
    tasks = result.scalars().all()
    out = []
    for t in tasks:
        trainer = await db.get(User, t.assigned_by) if t.assigned_by else None
        is_overdue = False
        if t.due_date and t.status != TaskStatus.COMPLETED and t.due_date < datetime.utcnow():
            is_overdue = True
        out.append({
            "id": t.id, "title": t.title, "description": t.description,
            "batch_id": t.batch_id, "priority": t.priority.value,
            "status": t.status.value, "is_overdue": is_overdue,
            "assigned_by": trainer.name if trainer else None,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        })
    return out


@router.post("/tasks", status_code=201)
async def create_task(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    task = Task(
        title=body["title"], description=body.get("description"),
        batch_id=body.get("batch_id"), assigned_by=user.id,
        priority=body.get("priority", "MEDIUM"),
        status=body.get("status", "PENDING"),
    )
    if body.get("due_date"):
        task.due_date = datetime.strptime(body["due_date"], "%Y-%m-%d")
    db.add(task)
    await db.flush()

    # Notify students in the batch
    if task.batch_id:
        from app.models.notification import Notification
        bs_result = await db.execute(select(BatchStudent).where(BatchStudent.batch_id == task.batch_id))
        for bs in bs_result.scalars().all():
            notif = Notification(
                user_id=bs.student_id,
                title="New Task Assigned",
                message=f"A new task '{task.title}' has been assigned to your batch.",
                type="TASK",
                reference_id=task.id
            )
            db.add(notif)
        await db.flush()

    return {"id": task.id, "status": "created"}


@router.patch("/tasks/{task_id}")
async def update_task(
    task_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    if "status" in body:
        task.status = body["status"]
    if "priority" in body:
        task.priority = body["priority"]
    await db.flush()
    return {"status": "updated"}


# ─── Assignments ──────────────────────────────────────
@router.get("/assignments")
async def list_assignments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assignment).order_by(Assignment.created_at.desc()))
    assignments = result.scalars().all()
    out = []
    for a in assignments:
        trainer = await db.get(User, a.assigned_by) if a.assigned_by else None
        sub_count = await db.execute(
            select(func.count(AssignmentSubmission.id)).where(AssignmentSubmission.assignment_id == a.id)
        )
        out.append({
            "id": a.id, "title": a.title, "description": a.description,
            "type": a.type.value, "batch_id": a.batch_id,
            "total_marks": a.total_marks,
            "assigned_by": trainer.name if trainer else None,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "submission_count": sub_count.scalar() or 0,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })
    return out


@router.post("/assignments", status_code=201)
async def create_assignment(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    assignment = Assignment(
        title=body["title"], description=body.get("description"),
        type=body.get("type", "CODING"),
        batch_id=body.get("batch_id"), course_id=body.get("course_id"),
        assigned_by=user.id, total_marks=body.get("total_marks", 100),
    )
    if body.get("due_date"):
        assignment.due_date = datetime.strptime(body["due_date"], "%Y-%m-%d")
    db.add(assignment)
    await db.flush()

    # Notify students in the batch
    if assignment.batch_id:
        from app.models.notification import Notification
        bs_result = await db.execute(select(BatchStudent).where(BatchStudent.batch_id == assignment.batch_id))
        for bs in bs_result.scalars().all():
            notif = Notification(
                user_id=bs.student_id,
                title="New Assignment Created",
                message=f"A new assignment '{assignment.title}' has been added.",
                type="ASSIGNMENT",
                reference_id=assignment.id
            )
            db.add(notif)
        await db.flush()

    return {"id": assignment.id, "status": "created"}


@router.post("/assignments/{assignment_id}/submit", status_code=201)
async def submit_assignment(
    assignment_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    existing = await db.execute(
        select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Already submitted")

    # Check if late submission → auto-create violation
    assignment = await db.get(Assignment, assignment_id)
    if assignment and assignment.due_date and assignment.due_date < datetime.utcnow():
        violation = Violation(
            student_id=user.id,
            type=ViolationType.POOR_ACADEMIC_PERFORMANCE,
            severity=ViolationSeverity.LOW,
            title=f"Late submission: {assignment.title}",
            description=f"Assignment '{assignment.title}' was submitted after the deadline.",
            reference_type="ASSIGNMENT",
            reference_id=assignment_id,
            penalty_points=5,
        )
        db.add(violation)

    submission = AssignmentSubmission(
        assignment_id=assignment_id, student_id=user.id,
        content=body.get("content"), file_url=body.get("file_url"),
    )
    db.add(submission)
    await db.flush()
    return {"status": "submitted"}


# ─── Violations ───────────────────────────────────────
@router.get("/violations")
async def list_violations(
    student_id: str = "",
    type: str = "",
    status: str = "",
    db: AsyncSession = Depends(get_db),
):
    query = select(Violation)
    if student_id:
        query = query.where(Violation.student_id == student_id)
    if type:
        query = query.where(Violation.type == type)
    if status:
        query = query.where(Violation.status == status)
    result = await db.execute(query.order_by(Violation.created_at.desc()))
    violations = result.scalars().all()
    out = []
    for v in violations:
        student = await db.get(User, v.student_id) if v.student_id else None
        resolver = await db.get(User, v.resolved_by_id) if v.resolved_by_id else None
        out.append({
            "id": v.id,
            "student_id": v.student_id,
            "student_name": student.name if student else "Unknown",
            "type": v.type.value,
            "severity": v.severity.value,
            "status": v.status.value,
            "title": v.title,
            "description": v.description,
            "reference_type": v.reference_type,
            "reference_id": v.reference_id,
            "penalty_points": v.penalty_points,
            "resolved_by": resolver.name if resolver else None,
            "resolution_note": v.resolution_note,
            "resolved_at": v.resolved_at.isoformat() if v.resolved_at else None,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        })
    return out


@router.post("/violations", status_code=201)
async def create_violation(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    violation = Violation(
        student_id=body["student_id"],
        type=body["type"],
        severity=body.get("severity", "MEDIUM"),
        title=body["title"],
        description=body.get("description"),
        reference_type=body.get("reference_type"),
        reference_id=body.get("reference_id"),
        penalty_points=body.get("penalty_points", 0),
    )
    db.add(violation)
    await db.flush()
    return {"id": violation.id, "status": "created"}


@router.patch("/violations/{violation_id}")
async def update_violation(
    violation_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    violation = await db.get(Violation, violation_id)
    if not violation:
        raise HTTPException(404, "Violation not found")

    if "status" in body:
        violation.status = body["status"]
        if body["status"] in ("RESOLVED", "DISMISSED"):
            violation.resolved_by_id = user.id
            violation.resolved_at = datetime.utcnow()
    if "resolution_note" in body:
        violation.resolution_note = body["resolution_note"]
    if "severity" in body:
        violation.severity = body["severity"]
    if "penalty_points" in body:
        violation.penalty_points = body["penalty_points"]

    await db.flush()
    return {"status": "updated"}


@router.post("/violations/check-deadlines")
async def check_deadlines(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    """Scan for overdue projects/tasks and auto-create violations."""
    now = datetime.utcnow()
    violations_created = 0

    # Check overdue projects
    result = await db.execute(
        select(Project).where(
            Project.deadline < now,
            Project.status.notin_([ProjectStatus.COMPLETED]),
        )
    )
    for project in result.scalars().all():
        # Check if violation already exists for this project
        existing = await db.execute(
            select(Violation).where(
                Violation.reference_type == "PROJECT",
                Violation.reference_id == project.id,
                Violation.type == ViolationType.DEADLINE_MISSED,
            )
        )
        if existing.scalar_one_or_none():
            continue
        # Get students from batch
        if project.batch_id:
            bs_result = await db.execute(
                select(BatchStudent).where(BatchStudent.batch_id == project.batch_id)
            )
            for bs in bs_result.scalars().all():
                violation = Violation(
                    student_id=bs.student_id,
                    type=ViolationType.POOR_ACADEMIC_PERFORMANCE,
                    severity=ViolationSeverity.LOW,
                    title="Deadline Missed: Final Project",
                    description=f"Student missed the deadline for project '{project.title}'",
                    reference_type="PROJECT",
                    reference_id=project.id,
                    penalty_points=10,
                )
                db.add(violation)
                violations_created += 1
        project.status = ProjectStatus.OVERDUE

    # Check overdue tasks
    result = await db.execute(
        select(Task).where(
            Task.due_date < now,
            Task.status.notin_([TaskStatus.COMPLETED, TaskStatus.OVERDUE]),
        )
    )
    for task in result.scalars().all():
        task.status = TaskStatus.OVERDUE

    await db.flush()
    return {"violations_created": violations_created, "status": "checked"}


# ─── Violations Summary ──────────────────────────────
@router.get("/violations/summary")
async def violation_summary(db: AsyncSession = Depends(get_db)):
    total = await db.execute(select(func.count(Violation.id)))
    open_count = await db.execute(
        select(func.count(Violation.id)).where(Violation.status == ViolationStatus.OPEN)
    )
    resolved_count = await db.execute(
        select(func.count(Violation.id)).where(Violation.status == ViolationStatus.RESOLVED)
    )
    total_penalties = await db.execute(
        select(func.coalesce(func.sum(Violation.penalty_points), 0))
    )

    # Get by type
    type_counts = {}
    for vtype in ViolationType:
        c = await db.execute(
            select(func.count(Violation.id)).where(Violation.type == vtype)
        )
        count = c.scalar() or 0
        if count > 0:
            type_counts[vtype.value] = count

    return {
        "total": total.scalar() or 0,
        "open": open_count.scalar() or 0,
        "resolved": resolved_count.scalar() or 0,
        "total_penalties": total_penalties.scalar() or 0,
        "by_type": type_counts,
    }


# ─── Feedback ─────────────────────────────────────────
@router.get("/feedback")
async def list_feedback(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Feedback).order_by(Feedback.created_at.desc()))
    feedbacks = result.scalars().all()
    out = []
    for f in feedbacks:
        student = await db.get(User, f.student_id) if f.student_id else None
        out.append({
            "id": f.id,
            "student_name": student.name if student else "Unknown",
            "rating": f.rating,
            "comment": f.comments,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        })
    return out


# ─── Videos ───────────────────────────────────────────
@router.get("/videos")
async def list_videos(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).order_by(Video.created_at.desc()))
    return [
        {
            "id": v.id, "title": v.title, "url": v.url,
            "topic": v.topic, "duration": v.duration,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in result.scalars().all()
    ]
from fastapi.responses import StreamingResponse

