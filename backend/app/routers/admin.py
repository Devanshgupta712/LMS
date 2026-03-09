from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, or_, delete, update, text
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt
from pydantic import BaseModel

from app.database import get_db
from app.middleware.auth import get_current_user, require_roles
from app.models.user import User, Role, AdminPermission
from app.models.course import Course, Batch, BatchStudent
from app.models.registration import Registration
from app.models.attendance import LeaveRequest, Attendance, TimeTracking
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
    batch_id: str

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


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[str] = None
    fee: Optional[float] = None
    is_active: Optional[bool] = None

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
    if body.is_active is not None: course.is_active = body.is_active
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
    batch_count = await db.execute(select(func.count(Batch.id)).where(Batch.course_id == course_id))
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
        
    from app.routers.auth import get_password_hash
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
            (Notification, "Notification", "user_id"),
            (LeaveRequest, "LeaveRequest", "user_id"),
            (TimeTracking, "TimeTracking", "user_id"),
            (Attendance, "Attendance", "student_id"),
            (BatchStudent, "BatchStudent", "student_id"),
            (Registration, "Registration", "student_id"),
            (Document, "Document", "student_id"),
            (Feedback, "Feedback", "student_id"),
            (Violation, "Violation", "student_id"),
            (AssignmentSubmission, "AssignmentSubmission", "student_id"),
            (LeadActivity, "LeadActivity", "user_id"),
            (AdminPermission, "AdminPermission", "user_id"),
            (JobApplication, "JobApplication", "student_id"),
            (AssessmentSubmission, "AssessmentSubmission", "student_id"),
            (MockInterview, "MockInterview", "student_id"),
            (CommunicationPractice, "CommunicationPractice", "student_id"),
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
            await db.execute(delete(Message).where(or_(Message.sender_id == user_id, Message.recipient_id == user_id)))
            report.append("Cleared Messages")
        except Exception as e:
            report.append(f"Failed Messages: {str(e)}")

        # 2. NULLIFY references
        try:
            await db.execute(Lead.__table__.update().where(Lead.assigned_to_id == user_id).values(assigned_to_id=None))
            report.append("Nullified Lead")
        except Exception as e:
            report.append(f"Failed Nullify Lead: {str(e)}")

        try:
            await db.execute(Batch.__table__.update().where(Batch.trainer_id == user_id).values(trainer_id=None))
            report.append("Nullified Batch")
        except Exception as e:
            report.append(f"Failed Nullify Batch: {str(e)}")

        try:
            await db.execute(Project.__table__.update().where(Project.trainer_id == user_id).values(trainer_id=None))
            report.append("Nullified Project")
        except Exception as e:
            report.append(f"Failed Nullify Project: {str(e)}")

        try:
            await db.execute(Task.__table__.update().where(Task.assigned_by == user_id).values(assigned_by=None))
            report.append("Nullified Task")
        except Exception as e:
            report.append(f"Failed Nullify Task: {str(e)}")

        try:
            await db.execute(Assignment.__table__.update().where(Assignment.assigned_by == user_id).values(assigned_by=None))
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
        perm_result = await db.execute(select(AdminPermission).where(AdminPermission.user_id == u.id))
        perm = perm_result.scalar_one_or_none()
        out.append({
            "user_id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role.value,
            "permissions": {
                "manage_users": perm.manage_users if perm else False,
                "manage_batches": perm.manage_batches if perm else False,
                "manage_courses": perm.manage_courses if perm else False,
                "manage_leaves": perm.manage_leaves if perm else False,
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
        
    perm_result = await db.execute(select(AdminPermission).where(AdminPermission.user_id == user_id))
    perm = perm_result.scalar_one_or_none()
    
    if not perm:
        perm = AdminPermission(user_id=user_id)
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
        
    perm_result = await db.execute(select(AdminPermission).where(AdminPermission.user_id == user_id))
    perm = perm_result.scalar_one_or_none()
    
    if not perm:
        perm = AdminPermission(user_id=user_id)
        db.add(perm)
        
    perm.manage_users = body.manage_users
    perm.manage_batches = body.manage_batches
    perm.manage_courses = body.manage_courses
    perm.manage_leaves = body.manage_leaves
    
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

    from app.routers.auth import get_password_hash
    hashed = get_password_hash(body.password)
    student_id = None
    if body.role == "STUDENT":
        from sqlalchemy import func
        current_year = datetime.now().year
        pattern = f"APC-{current_year}-%"
        count_q = await db.execute(
            select(User.student_id)
            .where(User.student_id.like(pattern))
            .order_by(User.student_id.desc())
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
        phone=body.phone, role=body.role, student_id=student_id,
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
    batch = await db.get(Batch, body.batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    if target_user.role == Role.TRAINER:
        batch.trainer_id = target_user.id
        await db.flush()
        return {"status": "success", "message": f"Trainer {target_user.name} assigned to batch {batch.name}"}
    
    if target_user.role != Role.STUDENT:
        raise HTTPException(status_code=400, detail="User is not a student or trainer")
        
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
            .join(Course, Course.id == Batch.course_id)
            .where(Batch.trainer_id == user_id)
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
            .join(Batch, Batch.id == BatchStudent.batch_id)
            .join(Course, Course.id == Batch.course_id)
            .where(BatchStudent.student_id == user_id)
        )
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
        if batch and batch.trainer_id == user_id:
            batch.trainer_id = None
            await db.flush()
        return {"status": "removed"}

    result = await db.execute(
        delete(BatchStudent).where(
            BatchStudent.student_id == user_id,
            BatchStudent.batch_id == batch_id
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
            select(Batch.id).where(Batch.trainer_id == current_user.id)
        )
        trainer_batch_ids = batch_result.scalars().all()

        if not trainer_batch_ids:
            return []  # Trainer has no batches assigned

        # Get students in those batches
        student_result = await db.execute(
            select(BatchStudent.student_id).where(BatchStudent.batch_id.in_(trainer_batch_ids))
        )
        student_ids = student_result.scalars().all()

        # Also include trainer's own leave requests
        query = query.where(
            (LeaveRequest.user_id.in_(student_ids)) |
            (LeaveRequest.user_id == current_user.id)
        )
    elif batch_id:
        query = query.where(LeaveRequest.batch_id == batch_id)

    result = await db.execute(query.order_by(LeaveRequest.created_at.desc()))
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
            leave_type=l.leave_type.value if hasattr(l, 'leave_type') and hasattr(l.leave_type, 'value') else str(getattr(l, 'leave_type', 'OTHER')),
            proof_url=l.proof_url,
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
    current_user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)),
):
    leave = await db.get(LeaveRequest, body.id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Fetch the leave requester's role
    requester = await db.get(User, leave.user_id)
    # Only SUPER_ADMIN can approve/reject trainer leaves
    if requester and requester.role == Role.TRAINER and current_user.role != Role.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can approve or reject trainer leave requests.")

    leave.status = body.status
    leave.approved_by_id = current_user.id
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
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = value
        else:
            new_setting = SystemSetting(key=key, value=value)
            db.add(new_setting)

    await db.flush()
    return {"status": "success", "message": "Geofence settings updated"}


