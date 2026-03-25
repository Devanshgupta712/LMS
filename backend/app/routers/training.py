from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, date
import json

from app.database import get_db
from app.middleware.auth import get_current_user, require_roles
from app.models.user import User, Role
from app.models.attendance import Attendance, LeaveRequest, LeaveStatus, LeaveType
from app.utils.cloudinary import upload_to_cloudinary
from app.models.course import Batch, BatchStudent
from app.models.project import (
    Project, ProjectMilestone, ProjectStatus,
    Task, TaskStatus, TaskPriority,
    Assignment, AssignmentType, AssignmentSubmission,
    Violation, ViolationType, ViolationSeverity, ViolationStatus,
)
from app.models.notification import Video, Feedback

from app.models.setting import SystemSetting
import uuid

router = APIRouter(prefix="/api/training", tags=["Training"])

@router.get("/qr-config")
async def get_qr_config(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    try:
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == "active_qr_secret"))
        setting = result.scalars().first()
        
        if not setting:
            # Auto-generate if missing
            new_secret = f"atc_punch_{uuid.uuid4().hex}"
            setting = SystemSetting(key="active_qr_secret", value=new_secret)
            db.add(setting)
            await db.commit()
            await db.refresh(setting)
            
        return {"qr_secret": setting.value}
    except Exception as e:
        print(f"Error in get_qr_config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/qr-config/regenerate")
async def regenerate_qr_config(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    try:
        new_secret = f"atc_punch_{uuid.uuid4().hex}"
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == "active_qr_secret"))
        setting = result.scalars().first()
        
        if setting:
            setting.value = new_secret
        else:
            setting = SystemSetting(key="active_qr_secret", value=new_secret)
            db.add(setting)
            
        await db.commit()
        return {"qr_secret": new_secret, "message": "New QR secret generated. Old QR codes are now invalid."}
    except Exception as e:
        print(f"Error in regenerate_qr_config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/punch-settings")
async def get_punch_settings(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    """Get office geolocation settings for punch radius restriction."""
    settings = {}
    for key in ["office_latitude", "office_longitude", "office_radius_meters", "late_threshold_time"]:
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
        setting = result.scalars().first()
        settings[key] = setting.value if setting else None
    
    return {
        "latitude": float(settings["office_latitude"]) if settings["office_latitude"] else None,
        "longitude": float(settings["office_longitude"]) if settings["office_longitude"] else None,
        "radius_meters": float(settings["office_radius_meters"]) if settings["office_radius_meters"] else 200.0,
        "late_threshold_time": settings["late_threshold_time"] or "10:00"
    }


@router.post("/punch-settings")
async def update_punch_settings(
    body: dict,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    """Save office geolocation and radius for punch restriction."""
    updates = {
        "office_latitude": str(body.get("latitude", "")),
        "office_longitude": str(body.get("longitude", "")),
        "office_radius_meters": str(body.get("radius_meters", "200")),
        "late_threshold_time": str(body.get("late_threshold_time", "10:00")),
    }
    
    for key, value in updates.items():
        if not value:
            continue
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
        setting = result.scalars().first()
        if setting:
            setting.value = value
        else:
            setting = SystemSetting(key=key, value=value)
            db.add(setting)
    
    await db.commit()
    return {"status": "success", "message": "Punch settings saved successfully."}


# ─── Attendance ───────────────────────────────────────
@router.get("/batches/{batch_id}/students")
async def get_batch_students(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user)
):
    from app.models.course import BatchStudent
    from app.models.user import User
    
    result = await db.execute(
        select(User).join(BatchStudent, User.id == BatchStudent.studentId)
        .where(BatchStudent.batchId == batch_id)
        .where(User.role == Role.STUDENT)
    )
    students = result.scalars().all()
    
    return [
        {
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "studentId": s.studentId,
            "isActive": s.isActive
        }
        for s in students
    ]

@router.get("/attendance")
async def get_attendance(
    batch_id: str = "",
    student_id: str = "",
    date: str = "",
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = select(Attendance)
    
    # Restrict Trainees (Trainers) to only see their own batch attendance
    from app.models.user import Role
    if hasattr(_user, 'role') and _user.role == Role.TRAINER:
        # Get batches owned by this trainer
        batch_ids_result = await db.execute(select(Batch.id).where(Batch.trainerId == _user.id))
        owned_batch_ids = [r[0] for r in batch_ids_result.all()]
        
        if batch_id:
            if batch_id not in owned_batch_ids:
                raise HTTPException(status_code=403, detail="You do not have permission to access attendance for this batch.")
            query = query.where(Attendance.batchId == batch_id)
        else:
            query = query.where(Attendance.batchId.in_(owned_batch_ids))
    elif batch_id:
        query = query.where(Attendance.batchId == batch_id)

    if student_id:
        query = query.where(Attendance.studentId == student_id)
    if date:
        day = datetime.strptime(date, "%Y-%m-%d")
        query = query.where(func.date(Attendance.date) == day.date())
    result = await db.execute(query.order_by(Attendance.date.desc()).limit(100))
    records = result.scalars().all()
    out = []
    for r in records:
        student = await db.get(User, r.studentId)
        out.append({
            "id": r.id, "studentId": r.studentId,
            "studentName": student.name if student else "Unknown",
            "batchId": r.batchId, "date": r.date.isoformat() if r.date else None,
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
    
    # Restrict Trainees (Trainers) to only export their own batch attendance
    if _user.role == Role.TRAINER:
        batch_ids_result = await db.execute(select(Batch.id).where(Batch.trainerId == _user.id))
        owned_batch_ids = [r[0] for r in batch_ids_result.all()]
        
        if batch_id:
            if batch_id not in owned_batch_ids:
                raise HTTPException(status_code=403, detail="You do not have permission to export attendance for this batch.")
            query = query.where(Attendance.batchId == batch_id)
        else:
            query = query.where(Attendance.batchId.in_(owned_batch_ids))
    elif batch_id:
        query = query.where(Attendance.batchId == batch_id)

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
        student = await db.get(User, r.studentId)
        writer.writerow([
            r.date.strftime("%Y-%m-%d") if r.date else "",
            student.studentId if student and student.studentId else r.studentId,
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
    # Verify batch exists and trainer ownership
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    if _user.role == Role.TRAINER and batch.trainerId != _user.id:
        raise HTTPException(status_code=403, detail="You can only generate QR codes for your own batches.")
        
    # Create simple token representing today's attendance session for this batch (IST)
    now = datetime.now(timezone.utc)
    ist_now = now + timedelta(hours=5, minutes=30)
    today_str = ist_now.strftime("%Y-%m-%d")
    payload = {
        "b": batch_id,
        "d": today_str,
        "exp": (ist_now + timedelta(hours=12)).isoformat()
    }
    
    # Simple base64 encoding
    encoded = base64.b64encode(json.dumps(payload).encode()).decode()
    return {"qr_token": encoded, "batchId": batch_id, "date": today_str}


from app.models.setting import SystemSetting
import uuid

@router.get("/qr/global")
async def get_global_qr(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER))
):
    """Fetches the current persistent global QR token for trainees."""
    query = select(SystemSetting).where(SystemSetting.key == "active_qr_secret")
    result = await db.execute(query)
    setting = result.scalars().first()
    
    if not setting:
        # Initialize it if it doesn't exist
        secret = str(uuid.uuid4())
        setting = SystemSetting(key="active_qr_secret", value=secret)
        db.add(setting)
        await db.commit()
    
    return {"qr_token": setting.value}


@router.post("/qr/global/rotate")
async def rotate_global_qr(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    """Invalidates the old global QR token and creates a new one."""
    query = select(SystemSetting).where(SystemSetting.key == "active_qr_secret")
    result = await db.execute(query)
    setting = result.scalars().first()
    
    new_secret = str(uuid.uuid4())
    
    if setting:
        setting.value = new_secret
    else:
        setting = SystemSetting(key="active_qr_secret", value=new_secret)
        db.add(setting)
        
    await db.commit()
    return {"qr_token": new_secret, "message": "Global QR Code has been regenerated successfully."}



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
                Attendance.studentId == item["studentId"],
                Attendance.batchId == item["batchId"],
                func.date(Attendance.date) == day.date()
            )
        )
        existing = existing_result.scalars().first()
        
        if existing:
            existing.status = item.get("status", "PRESENT")
            existing.remarks = item.get("remarks")
        else:
            record = Attendance(
                studentId=item["studentId"],
                batchId=item["batchId"],
                date=day,
                status=item.get("status", "PRESENT"),
                remarks=item.get("remarks"),
            )
            db.add(record)
            
    await db.flush()
    return {"status": "success", "message": f"Updated {len(data)} records"}


# ─── Leave Requests ───────────────────────────────────
@router.post("/submit-leave", status_code=201)
async def submit_leave(
    start_date: str = Form(...),
    end_date: str = Form(...),
    leave_type: str = Form(...),
    reason: str = Form(""),
    proof: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Parse dates
    try:
        s_date = datetime.strptime(start_date, "%Y-%m-%d")
        e_date = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # 1. Validation Logic
    try:
        leave_type_enum = LeaveType[leave_type]
    except KeyError:
        leave_type_enum = LeaveType.OTHER

    # 2. Past Date Validation
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if s_date < today:
        raise HTTPException(status_code=400, detail="Cannot apply for leave on a past date.")

    # 3. Overlap Check
    overlap_result = await db.execute(
        select(LeaveRequest).where(
            LeaveRequest.userId == user.id,
            LeaveRequest.status.in_([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
            (
                ((LeaveRequest.startDate <= s_date) & (LeaveRequest.endDate >= s_date)) |
                ((LeaveRequest.startDate <= e_date) & (LeaveRequest.endDate >= e_date)) |
                ((LeaveRequest.startDate >= s_date) & (LeaveRequest.endDate <= e_date))
            )
        )
    )
    if overlap_result.scalars().first():
        raise HTTPException(status_code=400, detail="You already have a pending or approved leave request for these dates.")

    if leave_type_enum in (LeaveType.OTHER, LeaveType.WORK_FROM_HOME):
        if not reason.strip():
            raise HTTPException(status_code=400, detail="Reason is mandatory for this leave type.")

    # 4. Upload proof to Cloudinary
    proof_url = None
    is_cloudinary = False
    if proof:
        # Pass the file object directly to Cloudinary
        proof_url = upload_to_cloudinary(proof.file)
        if proof_url:
            is_cloudinary = True

    # 5. Determine Batch
    batch_id = None
    res = await db.execute(select(BatchStudent).where(BatchStudent.studentId == user.id))
    bs = res.scalars().first()
    if bs:
        batch_id = bs.batchId

    # 6. Create Record
    leave = LeaveRequest(
        userId=user.id,
        batchId=batch_id,
        leaveType=leave_type_enum,
        proofUrl=proof_url,
        isCloudinary=is_cloudinary,
        startDate=s_date,
        endDate=e_date,
        reason=reason if leave_type_enum != LeaveType.MEDICAL else (reason or "Medical Leave"),
        status=LeaveStatus.PENDING
    )
    db.add(leave)
    await db.commit()
    await db.refresh(leave)
    
    return {"id": leave.id, "status": "submitted", "proofUrl": proof_url}

@router.post("/leave-cancel/{leave_id}")
async def cancel_leave(
    leave_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    leave = await db.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    if leave.userId != user.id:
        raise HTTPException(status_code=403, detail="You can only cancel your own leave requests")
    
    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending leave requests can be cancelled")
    
    await db.delete(leave)
    await db.commit()
    return {"status": "cancelled"}

@router.get("/leave-history")
async def get_my_leaves(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(LeaveRequest).where(LeaveRequest.userId == user.id).order_by(LeaveRequest.createdAt.desc())
    )
    leaves = result.scalars().all()
    out = []
    for l in leaves:
        out.append(LeaveOut.model_validate(l))
    return out

@router.get("/leave-stats")
async def get_leave_stats(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    from app.models.course import Batch, BatchStudent
    
    # Get user's batches
    b_res = await db.execute(
        select(Batch).join(BatchStudent).where(BatchStudent.studentId == user.id)
    )
    batches = b_res.scalars().all()
    
    stats = []
    for b in batches:
        # Count used leaves
        l_result = await db.execute(
            select(LeaveRequest).where(
                LeaveRequest.userId == user.id,
                LeaveRequest.batchId == b.id,
                LeaveRequest.status.in_([LeaveStatus.APPROVED, LeaveStatus.PENDING])
            )
        )
        leaves = l_result.scalars().all()
        days_used = 0
        for l in leaves:
            days = (l.endDate - l.startDate).days + 1
            days_used += days if days > 0 else 1
        
        stats.append({
            "batchId": b.id,
            "batchName": b.name,
            "leaveQuota": b.leaveQuota,
            "daysUsed": days_used,
            "remaining": max(0, b.leaveQuota - days_used)
        })
    return stats


# ─── Projects ─────────────────────────────────────────
@router.get("/projects")
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).order_by(Project.createdAt.desc()))
    projects = result.scalars().all()
    out = []
    for p in projects:
        ms_result = await db.execute(
            select(ProjectMilestone).where(ProjectMilestone.projectId == p.id).order_by(ProjectMilestone.order)
        )
        milestones = ms_result.scalars().all()
        trainer = await db.get(User, p.trainerId) if p.trainerId else None
        total_ms = len(milestones)
        done_ms = len([m for m in milestones if m.isCompleted])

        # Check for overdue
        is_overdue = False
        if p.deadline and p.status not in (ProjectStatus.COMPLETED,) and p.deadline < datetime.utcnow():
            is_overdue = True

        out.append({
            "id": p.id, "title": p.title, "description": p.description,
            "techStack": p.techStack, "githubUrl": p.githubUrl,
            "batchId": p.batchId, "status": p.status.value,
            "isOverdue": is_overdue,
            "trainerName": trainer.name if trainer else None,
            "deadline": p.deadline.isoformat() if p.deadline else None,
            "startDate": p.startDate.isoformat() if p.startDate else None,
            "endDate": p.endDate.isoformat() if p.endDate else None,
            "maxTeamSize": p.maxTeamSize,
            "progress": round((done_ms / total_ms * 100) if total_ms else 0),
            "milestones": [
                {
                    "id": m.id, "title": m.title, "description": m.description,
                    "dueDate": m.dueDate.isoformat() if m.dueDate else None,
                    "isCompleted": m.isCompleted, "order": m.order,
                }
                for m in milestones
            ],
            "createdAt": p.createdAt.isoformat() if p.createdAt else None,
        })
    return out


@router.post("/projects", status_code=201)
async def create_project(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    # Verify trainer owns the batch
    if user.role == Role.TRAINER:
        batch = await db.get(Batch, body.get("batchId"))
        if not batch or batch.trainerId != user.id:
            raise HTTPException(status_code=403, detail="You can only create projects for your own batches.")

    project = Project(
        title=body["title"], description=body.get("description"),
        techStack=body.get("techStack"), githubUrl=body.get("githubUrl"),
        batchId=body.get("batchId"), trainerId=user.id,
        status=body.get("status", "NOT_STARTED"),
        maxTeamSize=body.get("maxTeamSize", 4),
    )
    if body.get("deadline"):
        project.deadline = datetime.strptime(body["deadline"], "%Y-%m-%d")
    if body.get("startDate"):
        project.startDate = datetime.strptime(body["startDate"], "%Y-%m-%d")
    if body.get("endDate"):
        project.endDate = datetime.strptime(body["endDate"], "%Y-%m-%d")
    db.add(project)
    await db.flush()

    for idx, ms in enumerate(body.get("milestones", [])):
        milestone = ProjectMilestone(
            projectId=project.id, title=ms["title"],
            description=ms.get("description"), order=idx,
        )
        if ms.get("dueDate"):
            milestone.dueDate = datetime.strptime(ms["dueDate"], "%Y-%m-%d")
        db.add(milestone)
    await db.flush()
    return {"id": project.id, "status": "created"}


# ─── Tasks ────────────────────────────────────────────
@router.get("/tasks")
async def list_tasks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).order_by(Task.createdAt.desc()))
    tasks = result.scalars().all()
    out = []
    for t in tasks:
        trainer = await db.get(User, t.assignedById) if t.assignedById else None
        is_overdue = False
        if t.dueDate and t.status != TaskStatus.COMPLETED and t.dueDate < datetime.utcnow():
            is_overdue = True
        out.append({
            "id": t.id, "title": t.title, "description": t.description,
            "batchId": t.batchId, "priority": t.priority.value,
            "status": t.status.value, "isOverdue": is_overdue,
            "assignedBy": trainer.name if trainer else None,
            "dueDate": t.dueDate.isoformat() if t.dueDate else None,
            "createdAt": t.createdAt.isoformat() if t.createdAt else None,
        })
    return out


@router.post("/tasks", status_code=201)
async def create_task(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    # Verify trainer owns the batch
    if user.role == Role.TRAINER:
        batch = await db.get(Batch, body.get("batchId"))
        if not batch or batch.trainerId != user.id:
            raise HTTPException(status_code=403, detail="You can only create tasks for your own batches.")

    task = Task(
        title=body["title"], description=body.get("description"),
        batchId=body.get("batchId"), assignedById=user.id,
        priority=body.get("priority", "MEDIUM"),
        status=body.get("status", "PENDING"),
    )
    if body.get("dueDate"):
        task.dueDate = datetime.strptime(body["dueDate"], "%Y-%m-%d")
    db.add(task)
    await db.flush()

    # Notify students in the batch
    if task.batchId:
        from app.models.notification import Notification
        bs_result = await db.execute(select(BatchStudent).where(BatchStudent.batchId == task.batchId))
        for bs in bs_result.scalars().all():
            notif = Notification(
                userId=bs.studentId,
                title="New Task Assigned",
                message=f"A new task '{task.title}' has been assigned to your batch.",
                type="TASK",
                referenceId=task.id
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
    result = await db.execute(select(Assignment).order_by(Assignment.createdAt.desc()))
    assignments = result.scalars().all()
    out = []
    for a in assignments:
        trainer = await db.get(User, a.assignedById) if a.assignedById else None
        sub_count = await db.execute(
            select(func.count(AssignmentSubmission.id)).where(AssignmentSubmission.assignmentId == a.id)
        )
        out.append({
            "id": a.id, "title": a.title, "description": a.description,
            "type": a.type.value, "batchId": a.batchId,
            "totalMarks": a.totalMarks,
            "assignedBy": trainer.name if trainer else None,
            "dueDate": a.dueDate.isoformat() if a.dueDate else None,
            "submissionCount": sub_count.scalar() or 0,
            "createdAt": a.createdAt.isoformat() if a.createdAt else None,
        })
    return out


@router.post("/assignments", status_code=201)
async def create_assignment(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    # Verify trainer owns the batch
    if user.role == Role.TRAINER:
        batch = await db.get(Batch, body.get("batchId"))
        if not batch or batch.trainerId != user.id:
            raise HTTPException(status_code=403, detail="You can only create assignments for your own batches.")

    assignment = Assignment(
        title=body["title"], description=body.get("description"),
        type=body.get("type", "CODING"),
        batchId=body.get("batchId"), courseId=body.get("courseId"),
        assignedById=user.id, totalMarks=body.get("totalMarks", 100),
    )
    if body.get("dueDate"):
        assignment.dueDate = datetime.strptime(body["dueDate"], "%Y-%m-%d")
    db.add(assignment)
    await db.flush()

    # Notify students in the batch
    if assignment.batchId:
        from app.models.notification import Notification
        bs_result = await db.execute(select(BatchStudent).where(BatchStudent.batchId == assignment.batchId))
        for bs in bs_result.scalars().all():
            notif = Notification(
                userId=bs.studentId,
                title="New Assignment Created",
                message=f"A new assignment '{assignment.title}' has been added.",
                type="ASSIGNMENT",
                referenceId=assignment.id
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
            AssignmentSubmission.assignmentId == assignment_id,
            AssignmentSubmission.studentId == user.id,
        )
    )
    if existing.scalars().first():
        raise HTTPException(400, "Already submitted")

    # Check if late submission → auto-create violation
    assignment = await db.get(Assignment, assignment_id)
    if assignment and assignment.dueDate and assignment.dueDate < datetime.utcnow():
        violation = Violation(
            studentId=user.id,
            type=ViolationType.POOR_ACADEMIC_PERFORMANCE,
            severity=ViolationSeverity.LOW,
            title=f"Late submission: {assignment.title}",
            description=f"Assignment '{assignment.title}' was submitted after the deadline.",
            referenceType="ASSIGNMENT",
            referenceId=assignment_id,
            penaltyPoints=5,
        )
        db.add(violation)

    submission = AssignmentSubmission(
        assignmentId=assignment_id, studentId=user.id,
        content=body.get("content"), fileUrl=body.get("fileUrl"),
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
        query = query.where(Violation.studentId == student_id)
    if type:
        query = query.where(Violation.type == type)
    if status:
        query = query.where(Violation.status == status)
    result = await db.execute(query.order_by(Violation.createdAt.desc()))
    violations = result.scalars().all()
    out = []
    for v in violations:
        student = await db.get(User, v.studentId) if v.studentId else None
        resolver = await db.get(User, v.resolvedById) if v.resolvedById else None
        out.append({
            "id": v.id,
            "studentId": v.studentId,
            "studentName": student.name if student else "Unknown",
            "type": v.type.value,
            "severity": v.severity.value,
            "status": v.status.value,
            "title": v.title,
            "description": v.description,
            "referenceType": v.referenceType,
            "referenceId": v.referenceId,
            "penaltyPoints": v.penaltyPoints,
            "resolvedBy": resolver.name if resolver else None,
            "resolutionNote": v.resolutionNote,
            "resolvedAt": v.resolvedAt.isoformat() if v.resolvedAt else None,
            "createdAt": v.createdAt.isoformat() if v.createdAt else None,
        })
    return out


@router.post("/violations", status_code=201)
async def create_violation(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    violation = Violation(
        studentId=body["studentId"],
        type=body["type"],
        severity=body.get("severity", "MEDIUM"),
        title=body["title"],
        description=body.get("description"),
        referenceType=body.get("referenceType"),
        referenceId=body.get("referenceId"),
        penaltyPoints=body.get("penaltyPoints", 0),
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
            violation.resolvedById = user.id
            violation.resolvedAt = datetime.utcnow()
    if "resolutionNote" in body:
        violation.resolutionNote = body["resolutionNote"]
    if "severity" in body:
        violation.severity = body["severity"]
    if "penaltyPoints" in body:
        violation.penaltyPoints = body["penaltyPoints"]

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
                Violation.referenceType == "PROJECT",
                Violation.referenceId == project.id,
                Violation.type == ViolationType.DEADLINE_MISSED,
            )
        )
        if existing.scalars().first():
            continue
        # Get students from batch
        if project.batchId:
            bs_result = await db.execute(
                select(BatchStudent).where(BatchStudent.batchId == project.batchId)
            )
            for bs in bs_result.scalars().all():
                violation = Violation(
                    studentId=bs.studentId,
                    type=ViolationType.POOR_ACADEMIC_PERFORMANCE,
                    severity=ViolationSeverity.LOW,
                    title="Deadline Missed: Final Project",
                    description=f"Student missed the deadline for project '{project.title}'",
                    referenceType="PROJECT",
                    referenceId=project.id,
                    penaltyPoints=10,
                )
                db.add(violation)
                violations_created += 1
        project.status = ProjectStatus.OVERDUE

    # Check overdue tasks
    result = await db.execute(
        select(Task).where(
            Task.dueDate < now,
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
        select(func.coalesce(func.sum(Violation.penaltyPoints), 0))
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
        "totalPenalties": total_penalties.scalar() or 0,
        "byType": type_counts,
    }


# ─── Feedback ─────────────────────────────────────────
@router.get("/feedback")
async def list_feedback(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Feedback).order_by(Feedback.createdAt.desc()))
    feedbacks = result.scalars().all()
    out = []
    for f in feedbacks:
        student = await db.get(User, f.studentId) if f.studentId else None
        out.append({
            "id": f.id,
            "studentName": student.name if student else "Unknown",
            "rating": f.rating,
            "comment": f.comments,
            "createdAt": f.createdAt.isoformat() if f.createdAt else None,
        })
    return out


# ─── Videos ───────────────────────────────────────────
@router.get("/videos")
async def list_videos(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).order_by(Video.createdAt.desc()))
    return [
        {
            "id": v.id, "title": v.title, "url": v.url,
            "topic": v.topic, "duration": v.duration,
            "createdAt": v.createdAt.isoformat() if v.createdAt else None,
        }
        for v in result.scalars().all()
    ]
@router.get("/time-tracking")
async def get_time_tracking(
    date: str = "",
    user_id: str = "",
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models.attendance import TimeTracking
    from sqlalchemy import and_, func
    
    query = select(TimeTracking)
    
    # If user is a student, trainer, or marketer, only let them see their own logs
    if user.role in (Role.STUDENT, Role.TRAINER, Role.MARKETER):
        query = query.where(TimeTracking.userId == user.id)
    elif user_id:
        query = query.where(TimeTracking.userId == user_id)
        
    if date:
        day = datetime.strptime(date, "%Y-%m-%d")
        query = query.where(func.date(TimeTracking.date) == day.date())
        
    result = await db.execute(query.order_by(TimeTracking.loginTime.desc()))
    records = result.scalars().all()
    
    out_logs = []
    for r in records:
        student = await db.get(User, r.userId)
        out_logs.append({
            "id": r.id,
            "date": r.date.isoformat(),
            "loginTime": r.loginTime.isoformat() if r.loginTime else None,
            "logoutTime": r.logoutTime.isoformat() if r.logoutTime else None,
            "totalMinutes": r.totalMinutes,
            "user": {
                "name": student.name if student else "Unknown",
                "email": student.email if student else "",
                "studentId": student.studentId if student else None,
                "role": student.role.value if student and hasattr(student.role, 'value') else (str(student.role) if student else "Unknown")
            }
        })
        
    # Stats (simple example for admin)
    stats = {"avgHours": "0h", "activeToday": 0, "onTime": 0, "late": 0, "absent": 0}
    if user.role != Role.STUDENT and date:
        active_count = len([r for r in records if r.logoutTime is None])
        completed = [r for r in records if r.totalMinutes is not None]
        avg_mins = sum([r.totalMinutes for r in completed]) / len(completed) if completed else 0
        
        stats["activeToday"] = active_count
        stats["avgHours"] = f"{avg_mins/60:.1f}h"
        
        # Get configurable late threshold from settings (default 10:00 AM)
        late_hour = 10
        late_minute = 0
        try:
            threshold_result = await db.execute(select(SystemSetting).where(SystemSetting.key == "late_threshold_time"))
            threshold_setting = threshold_result.scalars().first()
            if threshold_setting and threshold_setting.value:
                parts = threshold_setting.value.split(":")
                late_hour = int(parts[0])
                late_minute = int(parts[1]) if len(parts) > 1 else 0
        except:
            pass
        
        # Calculate On Time vs Late (loginTime is already stored as IST-naive)
        on_time = 0
        late = 0
        for r in records:
            if r.loginTime:
                if r.loginTime.hour < late_hour or (r.loginTime.hour == late_hour and r.loginTime.minute <= late_minute):
                    on_time += 1
                else:
                    late += 1
        
        stats["onTime"] = on_time
        stats["late"] = late
        
        # Count absent = total active users (non-SUPER_ADMIN) minus those who punched in today
        try:
            from app.models.user import Role as UserRole
            total_users_result = await db.execute(
                select(func.count(User.id)).where(User.role != UserRole.SUPER_ADMIN)
            )
            total_users = total_users_result.scalar() or 0
            punched_in_count = len(records)
            stats["absent"] = max(0, total_users - punched_in_count)
        except:
            stats["absent"] = 0

    return {"logs": out_logs, "stats": stats}

@router.get("/time-tracking/export")
async def export_time_tracking(
    start_date: str = "",
    end_date: str = "",
    role: str = "",
    user_id: str = "",
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    """Export time tracking data as CSV grouped by role and batch."""
    import csv
    import io
    from fastapi.responses import StreamingResponse
    from app.models.attendance import TimeTracking
    from app.models.course import BatchStudent, Batch
    from sqlalchemy import and_, func
    
    # Parse dates
    if not start_date or not end_date:
        raise HTTPException(status_code=400, detail="start_date and end_date are required (YYYY-MM-DD)")
    
    s_date = datetime.strptime(start_date, "%Y-%m-%d").date()
    e_date = datetime.strptime(end_date, "%Y-%m-%d").date()
    
    # Fetch all records in range
    query = select(TimeTracking).where(
        and_(
            func.date(TimeTracking.date) >= s_date,
            func.date(TimeTracking.date) <= e_date
        )
    )
    if user_id:
        query = query.where(TimeTracking.userId == user_id)
        
    result = await db.execute(query.order_by(TimeTracking.date, TimeTracking.loginTime))
    records = result.scalars().all()
    
    # Get late threshold setting
    late_hour, late_minute = 10, 0
    try:
        threshold_result = await db.execute(select(SystemSetting).where(SystemSetting.key == "late_threshold_time"))
        threshold_setting = threshold_result.scalars().first()
        if threshold_setting and threshold_setting.value:
            parts = threshold_setting.value.split(":")
            late_hour = int(parts[0])
            late_minute = int(parts[1]) if len(parts) > 1 else 0
    except:
        pass
    
    # Group records by user, enrich with user info
    user_records = {}
    for r in records:
        if r.userId not in user_records:
            u = await db.get(User, r.userId)
            if not u:
                continue
            role_val = u.role.value if hasattr(u.role, 'value') else str(u.role)
            if role and role_val != role:
                continue
            
            # Find batch for students
            batch_name = "N/A"
            if role_val == "STUDENT":
                bs_result = await db.execute(
                    select(BatchStudent.batchId).where(BatchStudent.studentId == u.id)
                )
                batch_id = bs_result.scalars().first()
                if batch_id:
                    batch = await db.get(Batch, batch_id)
                    batch_name = batch.name if batch else "Unknown Batch"
            
            user_records[r.userId] = {
                "user": u,
                "role": role_val,
                "batchName": batch_name,
                "logs": []
            }
        
        # Skip records for users who were filtered out (not added to user_records)
        if r.userId not in user_records:
            continue

        # Determine on-time/late
        status = "N/A"
        if r.loginTime:
            if r.loginTime.hour < late_hour or (r.loginTime.hour == late_hour and r.loginTime.minute <= late_minute):
                status = "On Time"
            else:
                status = "Late"
        
        duration_mins = r.totalMinutes or 0
        hours_val = duration_mins // 60
        mins_val = duration_mins % 60
        duration_str = f"{hours_val}h {mins_val}m" if hours_val > 0 else f"{mins_val}m"
        
        user_records[r.userId]["logs"].append({
            "date": r.date.strftime("%Y-%m-%d") if r.date else "",
            "loginTime": r.loginTime.strftime("%I:%M %p") if r.loginTime else "-",
            "logoutTime": r.logoutTime.strftime("%I:%M %p") if r.logoutTime else "-",
            "duration": duration_str,
            "status": status
        })
    
    # Group by role
    admins = {uid: data for uid, data in user_records.items() if data["role"] == "ADMIN"}
    trainers = {uid: data for uid, data in user_records.items() if data["role"] == "TRAINER"}
    students = {uid: data for uid, data in user_records.items() if data["role"] == "STUDENT"}
    marketers = {uid: data for uid, data in user_records.items() if data["role"] == "MARKETER"}
    
    # Group students by batch
    students_by_batch = {}
    for uid, data in students.items():
        bn = data["batchName"]
        if bn not in students_by_batch:
            students_by_batch[bn] = {}
        students_by_batch[bn][uid] = data
    
    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([f"Attendance Report: {start_date} to {end_date}"])
    writer.writerow([f"Late Threshold: {late_hour:02d}:{late_minute:02d}"])
    writer.writerow([])
    
    def write_section(title, group):
        if not group:
            return
        writer.writerow([f"=== {title} ==="])
        writer.writerow(["Name", "ID", "Date", "Punch In", "Punch Out", "Duration", "Status"])
        for uid, data in group.items():
            u = data["user"]
            for log in data["logs"]:
                writer.writerow([
                    u.name,
                    u.studentId or u.id[:8],
                    log["date"],
                    log["loginTime"],
                    log["logoutTime"],
                    log["duration"],
                    log["status"]
                ])
        writer.writerow([])
    
    write_section("ADMINS", admins)
    write_section("TRAINERS", trainers)
    write_section("MARKETERS", marketers)
    
    for batch_name, batch_students in students_by_batch.items():
        write_section(f"STUDENTS - {batch_name}", batch_students)
    
    # --- ABSENT SECTION ---
    # Get all active users (non-SUPER_ADMIN)
    absent_query = select(User).where(User.role != Role.SUPER_ADMIN)
    if role:
        absent_query = absent_query.where(User.role == role)
    if user_id:
        absent_query = absent_query.where(User.id == user_id)
        
    all_users_result = await db.execute(absent_query)
    all_users = all_users_result.scalars().all()
    
    # For each day in range, find who didn't punch in
    from datetime import timedelta as td
    current_day = s_date
    absent_rows = []
    while current_day <= e_date:
        # Get user IDs who punched in on this day
        day_result = await db.execute(
            select(TimeTracking.userId).where(
                func.date(TimeTracking.date) == current_day
            )
        )
        punched_ids = set(day_result.scalars().all())
        
        for u in all_users:
            if u.id not in punched_ids:
                role_val = u.role.value if hasattr(u.role, 'value') else str(u.role)
                absent_rows.append([
                    u.name,
                    u.studentId or u.id[:8],
                    role_val,
                    current_day.strftime("%Y-%m-%d"),
                    "Absent"
                ])
        current_day = current_day + td(days=1)
    
    if absent_rows:
        writer.writerow(["=== ABSENT (Did Not Punch In) ==="])
        writer.writerow(["Name", "ID", "Role", "Date", "Status"])
        for row in absent_rows:
            writer.writerow(row)
        writer.writerow([])
    
    output.seek(0)
    filename = f"attendance_{start_date}_to_{end_date}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/time-tracking")
async def create_time_tracking(
    body: dict,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_user),
):
    if admin.role == Role.STUDENT:
        raise HTTPException(status_code=403, detail="Students cannot manually add logs")
        
    from app.models.attendance import TimeTracking
    from app.models.user import User
    
    user_id = body.get("userId")
    date_str = body.get("date")
    login_str = body.get("loginTime")
    logout_str = body.get("logoutTime")
    
    if not all([user_id, date_str, login_str]):
        raise HTTPException(status_code=400, detail="Missing required fields")
        
    target_user = await db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    date_obj = datetime.fromisoformat(date_str).replace(hour=0, minute=0, second=0, microsecond=0)
    login_time = datetime.fromisoformat(login_str)
    logout_time = datetime.fromisoformat(logout_str) if logout_str else None
    
    total_minutes = None
    if logout_time:
        diff = logout_time - login_time
        total_minutes = int(diff.total_seconds() / 60)
        
    log = TimeTracking(
        userId=user_id,
        date=date_obj,
        loginTime=login_time,
        logoutTime=logout_time,
        totalMinutes=total_minutes
    )
    db.add(log)
    await db.flush()
    return {"status": "success", "id": log.id}

@router.patch("/time-tracking/{log_id}")
async def update_time_tracking(
    log_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_user),
):
    if admin.role == Role.STUDENT:
        raise HTTPException(status_code=403, detail="Students cannot edit logs")
        
    from app.models.attendance import TimeTracking
    log = await db.get(TimeTracking, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
        
    if "loginTime" in body:
        log.loginTime = datetime.fromisoformat(body["loginTime"])
    if "logoutTime" in body:
        log.logoutTime = datetime.fromisoformat(body["logoutTime"]) if body["logoutTime"] else None
        
    if log.loginTime and log.logoutTime:
        diff = log.logoutTime - log.loginTime
        log.totalMinutes = int(diff.total_seconds() / 60)
    else:
        log.totalMinutes = None
        
    await db.flush()
    return {"status": "success"}

@router.delete("/time-tracking/{log_id}")
async def delete_time_tracking(
    log_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_user),
):
    if admin.role == Role.STUDENT:
        raise HTTPException(status_code=403, detail="Students cannot delete logs")
        
    from app.models.attendance import TimeTracking
    log = await db.get(TimeTracking, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    if log:
        db.delete(log)
        await db.commit()
    return {"status": "success"}
