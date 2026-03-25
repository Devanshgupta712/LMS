from datetime import datetime, timedelta
import enum
import uuid
import traceback
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update, func, or_
import bcrypt
from pydantic import BaseModel, Field

from app.database import get_db
from app.middleware.auth import get_current_user, require_roles
from app.models.user import User, Role, AdminPermission
from app.models.course import Course, Batch, BatchStudent
from app.models.registration import Registration
from app.models.attendance import LeaveRequest, Attendance, TimeTracking, AttendanceStatus, LeaveStatus, LeaveType
from app.models.notification import Notification, Message, Feedback
from app.models.project import Project, Task, Assignment, AssignmentSubmission, Violation
from app.models.lead import Lead, LeadActivity
from app.models.placement import JobApplication, AssessmentSubmission, MockInterview, CommunicationPractice
from app.models.registration import Document
from app.schemas.schemas import (
    CourseCreate, CourseOut, BatchCreate, BatchOut,
    StudentCreate, StudentOut, LeaveAction, LeaveOut,
    RegistrationCreate, RegistrationOut, DashboardStats,
    UserOut, AdminPasswordChangeRequest,
    AdminPermissionUpdate, AdminPermissionOut
)
from app.models.setting import SystemSetting

class AssignBatchRequest(BaseModel):
    batchId: str = Field(alias="batch_id")
    
    class Config:
        populate_by_name = True

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/dashboard")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    students = await db.execute(select(func.count(User.id)).where(User.role == Role.STUDENT))
    courses = await db.execute(select(func.count(Course.id)))
    batches = await db.execute(select(func.count(Batch.id)))
    from app.models.lead import Lead
    leads = await db.execute(select(func.count(Lead.id)))
    from app.models.placement import Job
    jobs = await db.execute(select(func.count(Job.id)).where(Job.isActive == True))
    pending = await db.execute(select(func.count(LeaveRequest.id)).where(LeaveRequest.status == "PENDING"))

    return DashboardStats(
        totalStudents=students.scalar() or 0,
        totalCourses=courses.scalar() or 0,
        totalBatches=batches.scalar() or 0,
        totalLeads=leads.scalar() or 0,
        activeJobs=jobs.scalar() or 0,
        pendingLeaves=pending.scalar() or 0,
    )



# ─── Courses ──────────────────────────────────────────
@router.get("/courses")
async def list_courses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Course).order_by(Course.createdAt.desc())
    )
    courses = result.scalars().all()
    out = []
    for c in courses:
        batches_q = await db.execute(select(func.count(Batch.id)).where(Batch.courseId == c.id))
        regs_q = await db.execute(select(func.count(Registration.id)).where(Registration.courseId == c.id))
        out.append(CourseOut(
            id=c.id, name=c.name, description=c.description,
            duration=c.duration, fee=c.fee, isActive=c.isActive,
            createdAt=c.createdAt,
            batchCount=batches_q.scalar() or 0,
            studentCount=regs_q.scalar() or 0,
        ))
    return out



@router.post("/courses", status_code=201)
async def create_course(
    body: CourseCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    course = Course(name=body.name, description=body.description, duration=body.duration, fee=body.fee)
    db.add(course)
    await db.flush()
    await db.refresh(course)
    return CourseOut(
        id=course.id, name=course.name, description=course.description,
        duration=course.duration, fee=course.fee, isActive=course.isActive,
        createdAt=course.createdAt,
    )


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[str] = None
    fee: Optional[float] = None
    isActive: Optional[bool] = Field(None, alias="is_active")

@router.patch("/courses/{course_id}")
async def update_course(
    course_id: str,
    body: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if body.name is not None: course.name = body.name
    if body.description is not None: course.description = body.description
    if body.duration is not None: course.duration = body.duration
    if body.fee is not None: course.fee = body.fee
    if body.isActive is not None: course.isActive = body.isActive
    await db.flush()
    return {"status": "updated"}


@router.delete("/courses/{course_id}")
async def delete_course(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    # Check for active batches
    batch_count = await db.execute(select(func.count(Batch.id)).where(Batch.courseId == course_id))
    if (batch_count.scalar() or 0) > 0:
        raise HTTPException(status_code=400, detail="Cannot delete course with existing batches. Delete the batches first.")
    db.delete(course)
    await db.flush()
    return {"status": "deleted"}


# ─── Batches ──────────────────────────────────────────

@router.get("/batches")
async def list_batches(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = select(Batch)
    if user.role == Role.TRAINER:
        query = query.where(Batch.trainerId == user.id)
        
    result = await db.execute(query.order_by(Batch.createdAt.desc()))
    batches = result.scalars().all()
    out = []
    for b in batches:
        course = await db.get(Course, b.courseId)
        trainer = await db.get(User, b.trainerId) if b.trainerId else None
        stu_q = await db.execute(select(func.count(BatchStudent.id)).where(BatchStudent.batchId == b.id))
        out.append(BatchOut(
            id=b.id, name=b.name, startDate=b.startDate, endDate=b.endDate,
            isActive=b.isActive,
            scheduleTime=b.scheduleTime,
            courseName=course.name if course else "",
            trainerName=trainer.name if trainer else None,
            studentCount=stu_q.scalar() or 0,
        ))
    return out



@router.post("/batches", status_code=201)
async def create_batch(
    body: BatchCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    course_id = body.courseId if body.courseId else None
    
    batch = Batch(
        courseId=course_id, name=body.name,
        startDate=datetime.fromisoformat(body.startDate),
        endDate=datetime.fromisoformat(body.endDate),
        scheduleTime=body.scheduleTime,
        trainerId=body.trainerId or None,
    )
    db.add(batch)
    await db.flush()
    await db.refresh(batch)
    course = await db.get(Course, batch.courseId) if batch.courseId else None
    return BatchOut(
        id=batch.id, name=batch.name, startDate=batch.startDate,
        endDate=batch.endDate, isActive=batch.isActive,
        scheduleTime=batch.scheduleTime,
        courseName=course.name if course else None,
    )

from app.schemas.schemas import BatchUpdate

@router.put("/batches/{batch_id}")
async def update_batch(
    batch_id: str,
    body: BatchUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    if body.name is not None: batch.name = body.name
    if body.courseId is not None: 
        batch.courseId = body.courseId if body.courseId else None
    if body.startDate is not None: batch.startDate = datetime.fromisoformat(body.startDate)
    if body.endDate is not None: batch.endDate = datetime.fromisoformat(body.endDate)
    if body.scheduleTime is not None: batch.scheduleTime = body.scheduleTime
    if hasattr(body, 'trainerId') and body.trainerId is not None: 
        batch.trainerId = body.trainerId if body.trainerId else None
    if body.isActive is not None: batch.isActive = body.isActive

    await db.flush()
    return {"status": "updated"}

@router.delete("/batches/{batch_id}")
async def delete_batch(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN)) # Only Super Admin can delete
):
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    # Hard cascade delete related records
    from app.models.course import BatchStudent
    from app.models.attendance import Attendance, LeaveRequest
    from app.models.project import Project, Task, Assignment
    from app.models.registration import Registration
    from app.models.notification import Feedback
    
    await db.execute(delete(BatchStudent).where(BatchStudent.batchId == batch_id))
    await db.execute(delete(Attendance).where(Attendance.batchId == batch_id))
    await db.execute(delete(LeaveRequest).where(LeaveRequest.batchId == batch_id))
    
    # Remove batch reference from Registrations instead of deleting them entirely, 
    # since registration is independent now.
    await db.execute(Registration.__table__.update().where(Registration.batchId == batch_id).values(batchId=None))
    
    # Feedback (if it has batch_id)
    # Actually Feedback doesn't have batch_id directly in the current model? Wait, course_id and batch_id are in Course, Batch. I'll wrap feedback in try.
    try:
        await db.execute(delete(Feedback).where(Feedback.batchId == batch_id))
    except Exception:
        pass
    
    # Projects and Tasks
    projects_res = await db.execute(select(Project.id).where(Project.batchId == batch_id))
    project_ids = projects_res.scalars().all()
    if project_ids:
        await db.execute(delete(Task).where(Task.projectId.in_(project_ids)))
        await db.execute(delete(Assignment).where(Assignment.projectId.in_(project_ids)))
        await db.execute(delete(Project).where(Project.batchId == batch_id))

    await db.delete(batch)
    await db.flush()
    return {"status": "deleted"}


# ─── Students ─────────────────────────────────────────

@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    result = await db.execute(select(User).order_by(User.createdAt.desc()))
    users = result.scalars().all()
    return [UserOut.model_validate(u) for u in users]

class UserStatusUpdate(BaseModel):
    is_active: bool

@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    body: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    target_user = await db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.role == Role.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot modify SUPER_ADMIN status")
    
    target_user.isActive = body.isActive
    await db.flush()
    return {"status": "updated", "isActive": target_user.isActive}


@router.patch("/users/{user_id}/password")
async def update_user_password(
    user_id: str,
    body: AdminPasswordChangeRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    target_user = await db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if _user.role == Role.ADMIN and target_user.role in [Role.SUPER_ADMIN, Role.ADMIN]:
        raise HTTPException(status_code=403, detail="Admins cannot change passwords for other Admins or Super Admins")
        
    if _user.role == Role.SUPER_ADMIN and target_user.role == Role.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot change password for SUPER_ADMIN")
        
    from app.routers.auth import get_password_hash
    hashed = get_password_hash(body.newPassword)
    target_user.password = hashed
    await db.flush()
    return {"status": "password_updated"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN)) # Only Super Admin can delete
):
    import traceback
    report = []
    try:
        target_user = await db.get(User, user_id)
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        if target_user.role == Role.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Cannot delete SUPER_ADMIN")
        
        # Manual cascade delete for related entities across all modules
        from app.models.notification import Notification, Message, Feedback
        from app.models.attendance import LeaveRequest, TimeTracking, Attendance
        from app.models.lead import Lead, LeadActivity
        from app.models.project import Task, Assignment, AssignmentSubmission, Violation, Project
        from app.models.registration import Document, Registration
        from app.models.placement import JobApplication, AssessmentSubmission, MockInterview, CommunicationPractice
        from app.models.user import AdminPermission
        from app.models.course import Batch, BatchStudent
        
        # 1. DELETE records where user is the primary subject
        entities = [
            (Notification, "Notification", "userId"),
            (LeaveRequest, "LeaveRequest", "userId"),
            (TimeTracking, "TimeTracking", "userId"),
            (Attendance, "Attendance", "studentId"),
            (BatchStudent, "BatchStudent", "studentId"),
            (Registration, "Registration", "studentId"),
            (Document, "Document", "studentId"),
            (Feedback, "Feedback", "studentId"),
            (Violation, "Violation", "studentId"),
            (AssignmentSubmission, "AssignmentSubmission", "studentId"),
            (LeadActivity, "LeadActivity", "userId"),
            (AdminPermission, "AdminPermission", "userId"),
            (JobApplication, "JobApplication", "studentId"),
            (AssessmentSubmission, "AssessmentSubmission", "studentId"),
            (MockInterview, "MockInterview", "studentId"),
            (CommunicationPractice, "CommunicationPractice", "studentId"),
        ]

        for model, name, field in entities:
            try:
                attr = getattr(model, field)
                await db.execute(delete(model).where(attr == user_id))
                report.append(f"Cleared {name}")
            except Exception as e:
                report.append(f"Failed {name}: {str(e)}")

        # Messages (sender or recipient)
        try:
            await db.execute(delete(Message).where(or_(Message.senderId == user_id, Message.recipientId == user_id)))
            report.append("Cleared Messages")
        except Exception as e:
            report.append(f"Failed Messages: {str(e)}")

        # 2. NULLIFY references
        try:
            await db.execute(Lead.__table__.update().where(Lead.assignedToId == user_id).values(assignedToId=None))
            report.append("Nullified Lead")
        except Exception as e:
            report.append(f"Failed Nullify Lead: {str(e)}")

        try:
            await db.execute(Batch.__table__.update().where(Batch.trainerId == user_id).values(trainerId=None))
            report.append("Nullified Batch")
        except Exception as e:
            report.append(f"Failed Nullify Batch: {str(e)}")

        try:
            await db.execute(Project.__table__.update().where(Project.trainerId == user_id).values(trainerId=None))
            report.append("Nullified Project")
        except Exception as e:
            report.append(f"Failed Nullify Project: {str(e)}")

        try:
            await db.execute(Task.__table__.update().where(Task.assignedBy == user_id).values(assignedBy=None))
            report.append("Nullified Task")
        except Exception as e:
            report.append(f"Failed Nullify Task: {str(e)}")

        try:
            await db.execute(Assignment.__table__.update().where(Assignment.assignedBy == user_id).values(assignedBy=None))
            report.append("Nullified Assignment")
        except Exception as e:
            report.append(f"Failed Nullify Assignment: {str(e)}")

        # Finally delete user
        await db.delete(target_user)
        await db.commit()
        return {"status": "deleted", "report": report}

    except Exception as e:
        await db.rollback()
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e),
                "trace": traceback.format_exc(),
                "report": report
            }
        )
        
    return {"status": "deleted"}


# ─── Admin Permissions ────────────────────────────────

@router.get("/users/all-permissions")
async def get_all_permissions(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN))
):
    """Get all admins and trainers with their current permission settings."""
    result = await db.execute(
        select(User).where(User.role.in_([Role.ADMIN, Role.TRAINER])).order_by(User.role, User.name)
    )
    users = result.scalars().all()
    out = []
    for u in users:
        perm_result = await db.execute(select(AdminPermission).where(AdminPermission.userId == u.id))
        perm = perm_result.scalars().first()
        out.append({
            "userId": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role.value,
            "permissions": {
                "manageUsers": perm.manageUsers if perm else False,
                "manageBatches": perm.manageBatches if perm else False,
                "manageCourses": perm.manageCourses if perm else False,
                "manageLeaves": perm.manageLeaves if perm else False,
            }
        })
    return out


@router.get("/users/{user_id}/permissions", response_model=AdminPermissionOut)
async def get_admin_permissions(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN))
):
    target_user = await db.get(User, user_id)
    if not target_user or target_user.role not in [Role.ADMIN, Role.TRAINER]:
        raise HTTPException(status_code=404, detail="Admin or Trainer not found")
        
    perm_result = await db.execute(select(AdminPermission).where(AdminPermission.userId == user_id))
    perm = perm_result.scalars().first()
    
    if not perm:
        perm = AdminPermission(userId=user_id)
        db.add(perm)
        await db.flush()
        
    return perm


@router.put("/users/{user_id}/permissions", response_model=AdminPermissionOut)
async def update_admin_permissions(
    user_id: str,
    body: AdminPermissionUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN))
):
    target_user = await db.get(User, user_id)
    if not target_user or target_user.role not in [Role.ADMIN, Role.TRAINER]:
        raise HTTPException(status_code=404, detail="Admin or Trainer not found")
        
    perm_result = await db.execute(select(AdminPermission).where(AdminPermission.userId == user_id))
    perm = perm_result.scalars().first()
    
    if not perm:
        perm = AdminPermission(userId=user_id)
        db.add(perm)
        
    perm.manageUsers = body.manageUsers
    perm.manageBatches = body.manageBatches
    perm.manageCourses = body.manageCourses
    perm.manageLeaves = body.manageLeaves
    
    await db.flush()
    return perm


# ─── Students ─────────────────────────────────────────
@router.get("/students")
async def list_students(
    role: str = "STUDENT", 
    all: str = "", 
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    if all == "true":
        result = await db.execute(select(User).order_by(User.createdAt.desc()))
    else:
        result = await db.execute(
            select(User).where(User.role == role).order_by(User.createdAt.desc())
        )
    users = result.scalars().all()
    
    if not users:
        return []

    user_ids = [u.id for u in users]
    from app.models.attendance import Attendance, LeaveRequest

    att_result = await db.execute(
        select(Attendance.studentId, Attendance.status)
        .where(Attendance.studentId.in_(user_ids))
    )
    attendances = att_result.all()

    att_map = { uid: {'P': 0, 'A': 0} for uid in user_ids }
    for student_id, status in attendances:
        val = status.value if hasattr(status, 'value') else status
        if val in ('PRESENT', 'LATE'):
            att_map[student_id]['P'] += 1
        elif val == 'ABSENT':
            att_map[student_id]['A'] += 1

    leave_result = await db.execute(
        select(LeaveRequest.userId)
        .where(LeaveRequest.userId.in_(user_ids), LeaveRequest.status == 'APPROVED')
    )
    leaves = leave_result.scalars().all()
    leave_map = { uid: 0 for uid in user_ids }
    for uid in leaves:
        leave_map[uid] += 1

    response = []
    for u in users:
        p = att_map[u.id]['P']
        a = att_map[u.id]['A']
        total = p + a
        pct = int((p / total) * 100) if total > 0 else 0
        
        s = StudentOut.model_validate(u)
        s.attendancePercentage = pct
        s.daysPresent = p
        s.daysAbsent = a
        s.leavesTaken = leave_map[u.id]
        response.append(s)

    return response


@router.get("/students/{user_id}/report")
async def get_student_report(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    student = await db.get(User, user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    from app.models.attendance import Attendance, LeaveRequest, TimeTracking
    from app.models.course import Batch, Course
    from app.models.registration import Registration

    att_res = await db.execute(
        select(Attendance.id, Attendance.date, Attendance.status, Batch.name)
        .outerjoin(Batch, Batch.id == Attendance.batchId)
        .where(Attendance.studentId == user_id)
        .order_by(Attendance.date.desc())
    )
    attendances = att_res.all()

    leave_res = await db.execute(
        select(LeaveRequest).where(LeaveRequest.userId == user_id).order_by(LeaveRequest.startDate.desc())
    )
    leaves = leave_res.scalars().all()

    time_res = await db.execute(
        select(TimeTracking).where(TimeTracking.userId == user_id).order_by(TimeTracking.date.desc())
    )
    time_logs = time_res.scalars().all()

    reg_res = await db.execute(
        select(Registration, Course.name, Batch.name)
        .join(Course, Course.id == Registration.courseId)
        .outerjoin(Batch, Batch.id == Registration.batchId)
        .where(Registration.studentId == user_id)
    )
    registrations = reg_res.all()

    present = sum(1 for a in attendances if (a.status.value if hasattr(a.status, 'value') else a.status) in ('PRESENT', 'LATE'))
    absent = sum(1 for a in attendances if (a.status.value if hasattr(a.status, 'value') else a.status) == 'ABSENT')
    total = present + absent
    pct = int((present / total) * 100) if total > 0 else 0
    total_punch_minutes = sum(t.totalMinutes for t in time_logs if t.totalMinutes)

    return {
        "student": {
            "id": student.id,
            "name": student.name,
            "studentId": student.studentId,
            "email": student.email,
            "phone": student.phone
        },
        "stats": {
            "attendancePercentage": pct,
            "daysPresent": present,
            "daysAbsent": absent,
            "leavesTaken": len([l for l in leaves if (l.status.value if hasattr(l.status, 'value') else l.status) == 'APPROVED']),
            "totalPunchMinutes": total_punch_minutes
        },
        "registrations": [
            {
                "id": r[0].id,
                "courseName": r[1],
                "batchName": r[2] or "Unassigned",
                "feeAmount": r[0].feeAmount,
                "feePaid": r[0].feePaid,
                "status": r[0].status.value if hasattr(r[0].status, 'value') else r[0].status
            } for r in registrations
        ],
        "attendance_logs": [
            {
                "id": a.id,
                "date": a.date,
                "status": a.status.value if hasattr(a.status, 'value') else a.status,
                "batchName": a.name or "Unknown Batch"
            } for a in attendances
        ],
        "leave_requests": [
            {
                "id": l.id,
                "startDate": l.startDate,
                "endDate": l.endDate,
                "reason": l.reason,
                "status": l.status.value if hasattr(l.status, 'value') else l.status,
                "leaveType": l.leaveType.value if hasattr(l.leaveType, 'value') else l.leaveType
            } for l in leaves
        ],
        "time_logs": [
            {
                "id": t.id,
                "date": t.date,
                "loginTime": t.loginTime,
                "logoutTime": t.logoutTime,
                "totalMinutes": t.totalMinutes
            } for t in time_logs
        ]
    }


@router.post("/students", status_code=201)
async def create_student(
    body: StudentCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    # Check duplicate
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already exists")

    from app.routers.auth import get_password_hash
    hashed = get_password_hash(body.password)
    student_id = None
    if body.role == "STUDENT":
        from sqlalchemy import func
        current_year = datetime.now().year
        pattern = f"APC-{current_year}-%"
        count_q = await db.execute(
            select(User.studentId)
            .where(User.studentId.like(pattern))
            .order_by(User.studentId.desc())
            .limit(1)
        )
        last_sid = count_q.scalar()
        if last_sid:
            try:
                last_num = int(last_sid.split("-")[-1])
                new_num = last_num + 1
            except:
                new_num = 1
        else:
            new_num = 1
        student_id = f"APC-{current_year}-{new_num:04d}"

    user = User(
        email=body.email, password=hashed, name=body.name,
        phone=body.phone, role=body.role, studentId=student_id,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return StudentOut.model_validate(user)


@router.post("/users/{user_id}/assign-batch")
async def assign_user_batch(
    user_id: str,
    body: AssignBatchRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    # 1. Verify user
    target_user = await db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 2. Verify batch
    batch = await db.get(Batch, body.batchId)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    if target_user.role == Role.TRAINER:
        batch.trainerId = target_user.id
        await db.flush()
        return {"status": "success", "message": f"Trainer {target_user.name} assigned to batch {batch.name}"}
    
    if target_user.role != Role.STUDENT:
        raise HTTPException(status_code=400, detail="User is not a student or trainer")
        
    # 3. Check if already in this batch
    existing = await db.execute(
        select(BatchStudent).where(
            BatchStudent.batchId == body.batchId,
            BatchStudent.studentId == user_id
        )
    )
    if existing.scalars().first():
        return {"status": "success", "message": "Student is already in this batch"}
    
    # 4. Link Student to Batch
    link = BatchStudent(batchId=body.batchId, studentId=user_id)
    db.add(link)
    
    await db.flush()
    return {"status": "success", "message": f"Student assigned to batch {batch.name}"}


@router.get("/users/{user_id}/details")
async def get_student_details(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    student = await db.get(User, user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get batches and registrations based on role
    batches = []
    registrations = []
    
    if student.role == Role.TRAINER:
        batch_links_result = await db.execute(
            select(Batch, Course.name.label("course_name"))
            .join(Course, Course.id == Batch.courseId)
            .where(Batch.trainerId == user_id)
        )
        for b, cname in batch_links_result.all():
            batches.append({
                "id": b.id,
                "name": b.name,
                "course_name": cname
            })
    else:
        batch_links_result = await db.execute(
            select(BatchStudent, Batch.name, Course.name.label("course_name"))
            .join(Batch, Batch.id == BatchStudent.batchId)
            .join(Course, Course.id == Batch.courseId)
            .where(BatchStudent.studentId == user_id)
        )
        for row in batch_links_result.all():
            batches.append({
                "id": row[0].batchId,
                "name": row[1],
                "courseName": row[2]
            })

        # Get registrations
        reg_result = await db.execute(
            select(Registration, Course.name)
            .join(Course, Course.id == Registration.courseId)
            .where(Registration.studentId == user_id)
        )
        for row in reg_result.all():
            registrations.append({
                "id": row[0].id,
                "courseId": row[0].courseId,
                "courseName": row[1],
                "status": row[0].status
            })

    return {
        "user": UserOut.model_validate(student),
        "batches": batches,
        "registrations": registrations
    }


@router.delete("/users/{user_id}/batches/{batch_id}")
async def remove_user_batch(
    user_id: str,
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    target_user = await db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.role == Role.TRAINER:
        batch = await db.get(Batch, batch_id)
        if batch and batch.trainerId == user_id:
            batch.trainerId = None
            await db.flush()
        return {"status": "removed"}

    result = await db.execute(
        delete(BatchStudent).where(
            BatchStudent.studentId == user_id,
            BatchStudent.batchId == batch_id
        )
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Batch link not found")
    
    await db.flush()
    return {"status": "success", "message": "Student removed from batch"}


# ─── Registrations ────────────────────────────────────
@router.get("/registrations")
async def list_registrations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Registration, User.name, User.email, User.studentId, Course.name, Batch.name)
        .join(User, User.id == Registration.studentId)
        .join(Course, Course.id == Registration.courseId)
        .outerjoin(Batch, Batch.id == Registration.batchId)
    )
    regs = []
    for row in result.all():
        r, sname, semail, sid, cname, bname = row
        regs.append(RegistrationOut(
            id=r.id,
            student_name=sname,
            student_email=semail,
            student_sid=sid,
            course_name=cname,
            batch_name=bname,
            fee_amount=r.feeAmount,
            fee_paid=r.feePaid,
            status=r.status,
            created_at=r.createdAt
        ))
    return regs


@router.post("/registrations")
async def create_registration(
    body: RegistrationCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    reg = Registration(
        studentId=body.studentId, courseId=body.courseId,
        batchId=body.batchId, feeAmount=body.feeAmount, feePaid=body.feePaid,
    )
    db.add(reg)
    await db.flush()
    await db.refresh(reg)
    student = await db.get(User, reg.studentId)
    course = await db.get(Course, reg.courseId)
    return RegistrationOut(
        id=reg.id, student_name=student.name if student else "",
        course_name=course.name if course else "",
        fee_amount=reg.feeAmount, fee_paid=reg.feePaid,
        status=reg.status, created_at=reg.createdAt,
    )


@router.delete("/registrations/{registration_id}")
async def delete_registration(
    registration_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    result = await db.execute(delete(Registration).where(Registration.id == registration_id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    await db.flush()
    return {"status": "success", "message": "Registration removed successfully"}


# ─── Leaves ───────────────────────────────────────────
@router.get("/leaves")
async def list_leaves(
    batch_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER))
):
    query = select(LeaveRequest)

    if current_user.role == Role.TRAINER:
        # Only show leaves from students in the trainer's assigned batches
        from app.models.course import BatchStudent
        batch_result = await db.execute(
            select(Batch.id).where(Batch.trainerId == current_user.id)
        )
        trainer_batch_ids = batch_result.scalars().all()

        if not trainer_batch_ids:
            return []  # Trainer has no batches assigned

        # Get students in those batches
        student_result = await db.execute(
            select(BatchStudent.studentId).where(BatchStudent.batchId.in_(trainer_batch_ids))
        )
        student_ids = student_result.scalars().all()

        # Also include trainer's own leave requests
        query = query.where(
            (LeaveRequest.userId.in_(student_ids)) |
            (LeaveRequest.userId == current_user.id)
        )
    elif batch_id:
        query = query.where(LeaveRequest.batchId == batch_id)

    result = await db.execute(query.order_by(LeaveRequest.createdAt.desc()))
    leaves = result.scalars().all()
    out = []
    for l in leaves:
        user = await db.get(User, l.userId)
        approver = await db.get(User, l.approvedById) if l.approvedById else None
        out.append(LeaveOut(
            id=l.id,
            user_name=user.name if user else "",
            user_role=user.role.value if user else "",
            user_student_id=user.studentId if user else None,
            leave_type=l.leaveType.value if hasattr(l, 'leaveType') and hasattr(l.leaveType, 'value') else str(getattr(l, 'leaveType', 'OTHER')),
            proof_url=l.proofUrl,
            start_date=l.startDate, end_date=l.endDate,
            reason=l.reason, status=l.status.value,
            approved_by_name=approver.name if approver else None,
            created_at=l.createdAt,
        ))
    return out



@router.patch("/leaves")
async def action_leave(
    body: LeaveAction,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    leave = await db.get(LeaveRequest, body.id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Fetch the leave requester
    requester = await db.get(User, leave.userId)
    if not requester:
         raise HTTPException(status_code=404, detail="User who requested leave not found")

    # Only SUPER_ADMIN can approve/reject trainer leaves
    if requester.role == Role.TRAINER and current_user.role != Role.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can approve or reject trainer leave requests.")

    old_status = leave.status
    leave.status = body.status
    leave.approvedById = current_user.id
    
    if body.status == LeaveStatus.REJECTED:
        leave.rejectionReason = body.rejectionReason
    else:
        leave.rejectionReason = None

    # Handle Auto-marking attendance if approved
    if body.status == LeaveStatus.APPROVED:
        # Loop through each day of the leave
        current_date = leave.startDate
        while current_date <= leave.endDate:
            # Check if attendance record exists
            att_result = await db.execute(
                select(Attendance).where(
                    Attendance.studentId == leave.userId,
                    Attendance.date == current_date
                )
            )
            att = att_result.scalars().first()
            
            if att:
                att.status = AttendanceStatus.ON_LEAVE
            else:
                # Create new record
                new_att = Attendance(
                    studentId=leave.userId,
                    batchId=leave.batchId or "UNKNOWN", # Fallback if batch not linked
                    date=current_date,
                    status=AttendanceStatus.ON_LEAVE,
                    remarks=f"Auto-marked: Leave Approved ({leave.leaveType})"
                )
                db.add(new_att)
            
            current_date += timedelta(days=1)

    await db.flush()
    
    # Send Email Notification in background
    leave_details = {
        "start_date": leave.startDate.strftime("%Y-%m-%d"),
        "end_date": leave.endDate.strftime("%Y-%m-%d")
    }
    background_tasks.add_task(
        send_leave_status_email, 
        requester.email, 
        body.status, 
        leave_details, 
        body.rejectionReason
    )

    return {"status": "updated"}


# ─── Notifications ────────────────────────────────────
class SendNotificationRequest(BaseModel):
    title: str
    message: str
    target: str  # "ALL", "USER", or "ROLE"
    user_id: str | None = None
    role: str | None = None

@router.get("/notifications")
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    # Group by title and message for SQLite compatibility to mimic distinct on specific columns
    result = await db.execute(
        select(Notification)
        .where(Notification.referenceId.in_(["admin_broadcast", "admin_direct"]))
        .group_by(Notification.title, Notification.message)
        .order_by(Notification.createdAt.desc())
        .limit(50)
    )
    notifs = result.scalars().all()
    return [
        {
            "id": n.id, "title": n.title, "message": n.message,
            "read": n.read, "created_at": n.createdAt.isoformat() if n.createdAt else None,
        }
        for n in notifs
    ]

@router.delete("/notifications/all")
async def delete_all_notifications(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    from app.models.notification import Notification
    await db.execute(
        delete(Notification).where(
            Notification.referenceId.in_(["admin_broadcast", "admin_direct"])
        )
    )
    await db.flush()
    return {"status": "deleted_all"}

@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    from app.models.notification import Notification
    result = await db.execute(
        delete(Notification).where(
            Notification.id == notification_id,
            Notification.referenceId.in_(["admin_broadcast", "admin_direct"])
        )
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    await db.flush()
    return {"status": "deleted"}

@router.post("/notifications/send", status_code=201)
async def send_notification(
    body: SendNotificationRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    from app.models.notification import Notification

    if body.target == "ALL":
        result = await db.execute(select(User).where(User.isActive == True))
        users = result.scalars().all()
        for u in users:
            n = Notification(userId=u.id, title=body.title, message=body.message, type="SYSTEM", referenceId="admin_broadcast")
            db.add(n)
        await db.flush()
        return {"status": "sent", "count": len(users)}
        
    elif body.target == "ROLE" and body.role:
        result = await db.execute(select(User).where(User.isActive == True, User.role == body.role))
        users = result.scalars().all()
        if not users:
            raise HTTPException(status_code=404, detail=f"No active users found with role {body.role}")
        
        for u in users:
            n = Notification(userId=u.id, title=body.title, message=body.message, type="SYSTEM", referenceId="admin_broadcast")
            db.add(n)
        await db.flush()
        return {"status": "sent", "count": len(users)}

    elif body.target == "USER" and body.userId:
        user = await db.get(User, body.userId)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        n = Notification(userId=user.id, title=body.title, message=body.message, type="SYSTEM", referenceId="admin_direct")

        db.add(n)
        await db.flush()
        return {"status": "sent", "count": 1}
        
    raise HTTPException(status_code=400, detail="Invalid target or missing parameters")


# ─── Database Export ──────────────────────────────────
@router.get("/db-export")
async def export_database(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN)),
):
    """Export entire database as SQL INSERT statements. SUPER_ADMIN only."""
    import io
    from fastapi.responses import StreamingResponse
    from sqlalchemy import text, inspect as sa_inspect
    from app.database import engine
    
    output = io.StringIO()
    output.write("-- LMS Database Export\n")
    output.write(f"-- Generated at: {datetime.now().isoformat()}\n")
    output.write("-- Format: SQL INSERT statements\n\n")
    
    # Get all table names from metadata
    from app.database import Base
    table_names = list(Base.metadata.tables.keys())
    
    for table_name in sorted(table_names):
        table = Base.metadata.tables[table_name]
        columns = [c.name for c in table.columns]
        
        # Fetch all rows
        result = await db.execute(text(f'SELECT * FROM "{table_name}"'))
        rows = result.fetchall()
        
        if not rows:
            output.write(f"-- Table: {table_name} (0 rows)\n\n")
            continue
        
        output.write(f"-- Table: {table_name} ({len(rows)} rows)\n")
        
        for row in rows:
            values = []
            for i, val in enumerate(row):
                if val is None:
                    values.append("NULL")
                elif isinstance(val, bool):
                    values.append("TRUE" if val else "FALSE")
                elif isinstance(val, (int, float)):
                    values.append(str(val))
                else:
                    # Escape single quotes
                    escaped = str(val).replace("'", "''")
                    values.append(f"'{escaped}'")
            
            cols_str = ", ".join(f'"{c}"' for c in columns)
            vals_str = ", ".join(values)
            output.write(f'INSERT INTO "{table_name}" ({cols_str}) VALUES ({vals_str});\n')
        
        output.write("\n")
    
    output.seek(0)
    filename = f"lms_db_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="application/sql",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ─── System Settings ──────────────────────────────────
class GeofenceSettingsUpdate(BaseModel):
    office_latitude: float
    office_longitude: float
    office_radius_meters: int

@router.get("/settings/geofence")
async def get_geofence_settings(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN)),
):
    keys = ["office_latitude", "office_longitude", "office_radius_meters"]
    result = await db.execute(select(SystemSetting).where(SystemSetting.key.in_(keys)))
    settings = result.scalars().all()
    
    settings_dict = {s.key: s.value for s in settings}
    return {
        "office_latitude": float(settings_dict.get("office_latitude", 0.0)),
        "office_longitude": float(settings_dict.get("office_longitude", 0.0)),
        "office_radius_meters": int(settings_dict.get("office_radius_meters", 200)),
    }

@router.put("/settings/geofence")
async def update_geofence_settings(
    body: GeofenceSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN)),
):
    updates = {
        "office_latitude": str(body.office_latitude),
        "office_longitude": str(body.office_longitude),
        "office_radius_meters": str(body.office_radius_meters),
    }

    for key, value in updates.items():
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
        setting = result.scalars().first()
        if setting:
            setting.value = value
        else:
            new_setting = SystemSetting(key=key, value=value)
            db.add(new_setting)

    await db.flush()
    return {"status": "success", "message": "Geofence settings updated"}


