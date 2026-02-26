from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, or_, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt
from pydantic import BaseModel

from app.database import get_db
from app.middleware.auth import get_current_user, require_roles
from app.models.user import User, Role
from app.models.course import Course, Batch, BatchStudent
from app.models.registration import Registration
from app.models.attendance import LeaveRequest
from app.models.notification import Notification
from app.schemas.schemas import (
    CourseCreate, CourseOut, BatchCreate, BatchOut,
    StudentCreate, StudentOut, LeaveAction, LeaveOut,
    RegistrationCreate, RegistrationOut, DashboardStats,
    UserOut, AdminPasswordChangeRequest
)

class AssignBatchRequest(BaseModel):
    batch_id: str

router = APIRouter(prefix="/api/admin", tags=["Admin"])

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


# ─── Dashboard Stats ──────────────────────────────────
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
    jobs = await db.execute(select(func.count(Job.id)).where(Job.is_active == True))
    pending = await db.execute(select(func.count(LeaveRequest.id)).where(LeaveRequest.status == "PENDING"))

    return DashboardStats(
        total_students=students.scalar() or 0,
        total_courses=courses.scalar() or 0,
        total_batches=batches.scalar() or 0,
        total_leads=leads.scalar() or 0,
        active_jobs=jobs.scalar() or 0,
        pending_leaves=pending.scalar() or 0,
    )


# ─── Courses ──────────────────────────────────────────
@router.get("/courses")
async def list_courses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Course).order_by(Course.created_at.desc())
    )
    courses = result.scalars().all()
    out = []
    for c in courses:
        batches_q = await db.execute(select(func.count(Batch.id)).where(Batch.course_id == c.id))
        regs_q = await db.execute(select(func.count(Registration.id)).where(Registration.course_id == c.id))
        out.append(CourseOut(
            id=c.id, name=c.name, description=c.description,
            duration=c.duration, fee=c.fee, is_active=c.is_active,
            created_at=c.created_at,
            batch_count=batches_q.scalar() or 0,
            student_count=regs_q.scalar() or 0,
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
        duration=course.duration, fee=course.fee, is_active=course.is_active,
        created_at=course.created_at,
    )


# ─── Batches ──────────────────────────────────────────
    query = select(Batch)
    
    # If the user is a trainer, only show their batches (using a more flexible role check if needed)
    # Note: Require roles already confirms the user is authenticated. 
    # Since we don't have the user object here, we need to get it or change the dependency.
    # Let's update the endpoint to include the user.
    pass

@router.get("/batches")
async def list_batches(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = select(Batch)
    if user.role == Role.TRAINER:
        query = query.where(Batch.trainer_id == user.id)
        
    result = await db.execute(query.order_by(Batch.created_at.desc()))
    batches = result.scalars().all()
    out = []
    for b in batches:
        course = await db.get(Course, b.course_id)
        trainer = await db.get(User, b.trainer_id) if b.trainer_id else None
        stu_q = await db.execute(select(func.count(BatchStudent.id)).where(BatchStudent.batch_id == b.id))
        out.append(BatchOut(
            id=b.id, name=b.name, start_date=b.start_date, end_date=b.end_date,
            is_active=b.is_active,
            schedule_time=b.schedule_time,
            course_name=course.name if course else "",
            trainer_name=trainer.name if trainer else None,
            student_count=stu_q.scalar() or 0,
        ))
    return out


@router.post("/batches", status_code=201)
async def create_batch(
    body: BatchCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    batch = Batch(
        course_id=body.course_id, name=body.name,
        start_date=datetime.fromisoformat(body.start_date),
        end_date=datetime.fromisoformat(body.end_date),
        schedule_time=body.schedule_time,
        trainer_id=body.trainer_id or None,
    )
    db.add(batch)
    await db.flush()
    await db.refresh(batch)
    course = await db.get(Course, batch.course_id)
    return BatchOut(
        id=batch.id, name=batch.name, start_date=batch.start_date,
        end_date=batch.end_date, is_active=batch.is_active,
        schedule_time=batch.schedule_time,
        course_name=course.name if course else "",
    )


# ─── Students ─────────────────────────────────────────

@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
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
    
    target_user.is_active = body.is_active
    await db.flush()
    return {"status": "updated", "is_active": target_user.is_active}


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
        
    hashed = get_password_hash(body.new_password)
    target_user.password = hashed
    await db.flush()
    return {"status": "password_updated"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN)) # Only Super Admin can delete
):
    target_user = await db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.role == Role.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot delete SUPER_ADMIN")
    
    await db.delete(target_user)
    await db.flush()
    return {"status": "deleted"}

# ─── Students ─────────────────────────────────────────
@router.get("/students")
async def list_students(
    role: str = "STUDENT", 
    all: str = "", 
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    if all == "true":
        result = await db.execute(select(User).order_by(User.created_at.desc()))
    else:
        result = await db.execute(
            select(User).where(User.role == role).order_by(User.created_at.desc())
        )
    users = result.scalars().all()
    return [StudentOut.model_validate(u) for u in users]


@router.post("/students", status_code=201)
async def create_student(
    body: StudentCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    # Check duplicate
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed = get_password_hash(body.password)
    student_id = None
    if body.role == "STUDENT":
        count_q = await db.execute(select(func.count(User.id)).where(User.role == Role.STUDENT))
        count = count_q.scalar() or 0
        student_id = f"APC-{datetime.now().year}-{count + 1:04d}"

    user = User(
        email=body.email, password=hashed, name=body.name,
        phone=body.phone, role=body.role, student_id=student_id,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return StudentOut.model_validate(user)


@router.post("/users/{user_id}/assign-batch")
async def assign_student_batch(
    user_id: str,
    body: AssignBatchRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    # 1. Verify student
    student = await db.get(User, user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # 2. Verify batch
    batch = await db.get(Batch, body.batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    # 3. Check if already in this batch
    existing = await db.execute(
        select(BatchStudent).where(
            BatchStudent.batch_id == body.batch_id,
            BatchStudent.student_id == user_id
        )
    )
    if existing.scalar_one_or_none():
        return {"status": "success", "message": "Student is already in this batch"}
    
    # 4. Link Student to Batch
    link = BatchStudent(batch_id=body.batch_id, student_id=user_id)
    db.add(link)
    
    # 5. Ensure Registration exists for this course/student
    # (Attendance and other systems often rely on Registration records)
    reg_result = await db.execute(
        select(Registration).where(
            Registration.student_id == user_id,
            Registration.course_id == batch.course_id
        )
    )
    reg = reg_result.scalar_one_or_none()
    
    if not reg:
        # Create a default registration if missing
        reg = Registration(
            student_id=user_id,
            course_id=batch.course_id,
            batch_id=body.batch_id,
            fee_amount=0.0,
            fee_paid=0.0,
            status="CONFIRMED"
        )
        db.add(reg)
    else:
        # Update existing registration with this batch if it was empty
        if not reg.batch_id:
            reg.batch_id = body.batch_id
            
    await db.flush()
    return {"status": "success", "message": f"Student assigned to batch {batch.name}"}


@router.get("/students/{user_id}/details")
async def get_student_details(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    student = await db.get(User, user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get batches
    batch_links_result = await db.execute(
        select(BatchStudent, Batch.name, Course.name.label("course_name"))
        .join(Batch, Batch.id == BatchStudent.batch_id)
        .join(Course, Course.id == Batch.course_id)
        .where(BatchStudent.student_id == user_id)
    )
    batches = []
    for row in batch_links_result.all():
        batches.append({
            "id": row[0].batch_id,
            "name": row[1],
            "course_name": row[2]
        })
    
    # Get registrations
    reg_result = await db.execute(
        select(Registration, Course.name)
        .join(Course, Course.id == Registration.course_id)
        .where(Registration.student_id == user_id)
    )
    registrations = []
    for row in reg_result.all():
        registrations.append({
            "id": row[0].id,
            "course_id": row[0].course_id,
            "course_name": row[1],
            "status": row[0].status
        })

    return {
        "user": UserOut.model_validate(student),
        "batches": batches,
        "registrations": registrations
    }


@router.delete("/users/{user_id}/batches/{batch_id}")
async def remove_student_batch(
    user_id: str,
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN))
):
    result = await db.execute(
        delete(BatchStudent).where(
            BatchStudent.student_id == user_id,
            BatchStudent.batch_id == batch_id
        )
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Student-Batch linkage not found")
    
    await db.flush()
    return {"status": "success", "message": "Student removed from batch"}


# ─── Registrations ────────────────────────────────────
@router.get("/registrations")
async def list_registrations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Registration, User.name, User.email, User.student_id, Course.name, Batch.name)
        .join(User, User.id == Registration.student_id)
        .join(Course, Course.id == Registration.course_id)
        .outerjoin(Batch, Batch.id == Registration.batch_id)
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
            fee_amount=r.fee_amount,
            fee_paid=r.fee_paid,
            status=r.status,
            created_at=r.created_at
        ))
    return regs


@router.post("/registrations")
async def create_registration(
    body: RegistrationCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN)),
):
    reg = Registration(
        student_id=body.student_id, course_id=body.course_id,
        batch_id=body.batch_id, fee_amount=body.fee_amount, fee_paid=body.fee_paid,
    )
    db.add(reg)
    await db.flush()
    await db.refresh(reg)
    student = await db.get(User, reg.student_id)
    course = await db.get(Course, reg.course_id)
    return RegistrationOut(
        id=reg.id, student_name=student.name if student else "",
        course_name=course.name if course else "",
        fee_amount=reg.fee_amount, fee_paid=reg.fee_paid,
        status=reg.status, created_at=reg.created_at,
    )


# ─── Leaves ───────────────────────────────────────────
@router.get("/leaves")
async def list_leaves(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LeaveRequest).order_by(LeaveRequest.created_at.desc()))
    leaves = result.scalars().all()
    out = []
    for l in leaves:
        user = await db.get(User, l.user_id)
        approver = await db.get(User, l.approved_by_id) if l.approved_by_id else None
        out.append(LeaveOut(
            id=l.id,
            user_name=user.name if user else "",
            user_role=user.role.value if user else "",
            user_student_id=user.student_id if user else None,
            start_date=l.start_date, end_date=l.end_date,
            reason=l.reason, status=l.status.value,
            approved_by_name=approver.name if approver else None,
            created_at=l.created_at,
        ))
    return out


@router.patch("/leaves")
async def action_leave(
    body: LeaveAction,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    leave = await db.get(LeaveRequest, body.id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    leave.status = body.status
    if body.approved_by_id:
        leave.approved_by_id = body.approved_by_id
    await db.flush()
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
        .where(Notification.reference_id.in_(["admin_broadcast", "admin_direct"]))
        .group_by(Notification.title, Notification.message)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    notifs = result.scalars().all()
    return [
        {
            "id": n.id, "title": n.title, "message": n.message,
            "read": n.read, "created_at": n.created_at.isoformat() if n.created_at else None,
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
            Notification.reference_id.in_(["admin_broadcast", "admin_direct"])
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
            Notification.reference_id.in_(["admin_broadcast", "admin_direct"])
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
        result = await db.execute(select(User).where(User.is_active == True))
        users = result.scalars().all()
        for u in users:
            n = Notification(user_id=u.id, title=body.title, message=body.message, type="SYSTEM", reference_id="admin_broadcast")
            db.add(n)
        await db.flush()
        return {"status": "sent", "count": len(users)}
        
    elif body.target == "ROLE" and body.role:
        result = await db.execute(select(User).where(User.is_active == True, User.role == body.role))
        users = result.scalars().all()
        if not users:
            raise HTTPException(status_code=404, detail=f"No active users found with role {body.role}")
        
        for u in users:
            n = Notification(user_id=u.id, title=body.title, message=body.message, type="SYSTEM", reference_id="admin_broadcast")
            db.add(n)
        await db.flush()
        return {"status": "sent", "count": len(users)}

    elif body.target == "USER" and body.user_id:
        user = await db.get(User, body.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        n = Notification(user_id=user.id, title=body.title, message=body.message, type="SYSTEM", reference_id="admin_direct")

        db.add(n)
        await db.flush()
        return {"status": "sent", "count": 1}
        
    raise HTTPException(status_code=400, detail="Invalid target or missing parameters")
