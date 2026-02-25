from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt
from datetime import datetime, date, time, timezone, timedelta
import os, uuid, base64, json

from app.database import get_db
from app.models.user import User
from app.models.registration import Document
from app.schemas.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.middleware.auth import create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Auto-provision super admin if missing
    if body.email == "superadmin@apptech.com" and body.password == "SuperAdmin123!":
        from app.models.user import Role
        result = await db.execute(select(User).where(User.email == body.email))
        sa = result.scalar_one_or_none()
        if not sa:
            sa = User(email=body.email, password=get_password_hash(body.password), name="Super Admin", role=Role.SUPER_ADMIN, is_active=True)
            db.add(sa)
            await db.flush()

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.post("/notifications/read-all")
async def mark_notifications_read(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    from app.models.notification import Notification
    from sqlalchemy import update
    await db.execute(
        update(Notification).where(Notification.user_id == user.id).values(read=True)
    )
    await db.flush()
    return {"status": "success"}


@router.post("/register", response_model=UserOut)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = get_password_hash(body.password)

    student_id = None
    if body.role == "STUDENT":
        result = await db.execute(select(User).where(User.role == "STUDENT"))
        count = len(result.all())
        student_id = f"APC-{datetime.now().year}-{count + 1:04d}"

    user = User(
        email=body.email,
        password=hashed,
        name=body.name,
        phone=body.phone,
        role=body.role,
        student_id=student_id,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    # Automatically register student in the selected course and its active batch
    if body.course and body.role == "STUDENT":
        from app.models.course import Course, Batch, BatchStudent
        from app.models.registration import Registration
        
        course_result = await db.execute(select(Course).where(Course.name == body.course))
        course = course_result.scalar_one_or_none()
        if course:
            reg = Registration(
                student_id=user.id,
                course_id=course.id,
                fee_amount=course.fee,
                fee_paid=0.0,
                status="CONFIRMED"
            )
            db.add(reg)
            
            # Auto-enroll in the first active batch to ensure notifications work
            batch_result = await db.execute(select(Batch).where(Batch.course_id == course.id, Batch.is_active == True))
            first_batch = batch_result.scalar_one_or_none()
            if first_batch:
                bs = BatchStudent(batch_id=first_batch.id, student_id=user.id)
                db.add(bs)
            
            await db.flush()

    return UserOut.model_validate(user)


@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


@router.patch("/profile")
async def update_profile(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if "name" in body:
        user.name = body["name"]
    if "phone" in body:
        user.phone = body["phone"]
    if "avatar" in body:
        user.avatar = body["avatar"]
    if "dob" in body:
        user.dob = body["dob"]
    if "education_status" in body:
        user.education_status = body["education_status"]
    if "highest_education" in body:
        user.highest_education = body["highest_education"]
    if "degree" in body:
        user.degree = body["degree"]
    if "passing_year" in body:
        user.passing_year = body["passing_year"]
    await db.flush()
    return {"status": "updated", "name": user.name, "phone": user.phone}


# ─── Document endpoints ──────────────────────────────
@router.get("/documents")
async def list_documents(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document).where(Document.student_id == user.id).order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    return [
        {
            "id": d.id, "type": d.type, "file_name": d.file_name,
            "file_url": d.file_url, "verified": d.verified,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in docs
    ]


@router.post("/documents", status_code=201)
async def upload_document(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Upload a document with base64 encoded file content."""
    doc_type = body.get("type", "OTHER")
    file_name = body.get("file_name", "document")
    file_data = body.get("file_data")  # base64 encoded

    if file_data:
        try:
            import cloudinary.uploader
            from app.config import settings
            
            # Configure Cloudinary if not done globally
            if not cloudinary.config().cloud_name:
                 import cloudinary
                 cloudinary.config(
                     cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                     api_key=settings.CLOUDINARY_API_KEY,
                     api_secret=settings.CLOUDINARY_API_SECRET
                 )

            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                f"data:image/png;base64,{file_data}", # Assuming image, cloudinary handles auto-detection via base64 prefix
                folder="lms_documents",
                public_id=f"{user.id}_{doc_type}_{uuid.uuid4().hex[:8]}"
            )
            file_url = upload_result.get("secure_url")
            
        except Exception as e:
            # Fallback to local storage if Cloudinary fails or is not configured
            ext = os.path.splitext(file_name)[1] or ".pdf"
            saved_name = f"{user.id}_{doc_type}_{uuid.uuid4().hex[:8]}{ext}"
            file_path = os.path.join(UPLOAD_DIR, saved_name)
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(file_data))
            file_url = f"/uploads/documents/{saved_name}"
            print(f"Cloudinary upload failed/skipped, using local storage: {e}")
    else:
        file_url = body.get("file_url", "")

    doc = Document(
        student_id=user.id,
        type=doc_type,
        file_name=file_name,
        file_url=file_url,
    )
    db.add(doc)
    await db.flush()
    return {"id": doc.id, "status": "uploaded", "file_url": file_url}


@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    doc = await db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.student_id != user.id:
        raise HTTPException(403, "Not your document")
    await db.delete(doc)
    await db.flush()
    return {"status": "deleted"}


# ─── My Courses ─────────────────────────────────────────
@router.get("/my-courses")
async def get_my_courses(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models.registration import Registration
    result = await db.execute(
        select(Registration).where(Registration.student_id == user.id)
    )
    regs = result.scalars().all()
    out = []
    for r in regs:
        from app.models.course import Course
        course = await db.get(Course, r.course_id)
        if course:
            out.append({
                "id": course.id,
                "name": course.name,
                "description": course.description,
                "duration": course.duration,
                "fee_total": r.fee_amount,
                "fee_paid": r.fee_paid,
                "status": r.status,
                "registration_date": r.created_at.isoformat() if r.created_at else None
            })
    return out


# ─── Notifications ──────────────────────────────────────
@router.get("/notifications")
async def get_my_notifications(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models.notification import Notification
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    notifs = result.scalars().all()
    return [
        {
            "id": n.id, "title": n.title, "message": n.message,
            "read": n.read, "type": n.type, "reference_id": n.reference_id,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifs
    ]

import json
import base64

@router.post("/attendance/scan")
async def scan_attendance_qr(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    token = body.get("qr_token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing QR token")
        
    # Standard check: Trainees (Students/Trainers) can use the punch QR system
    from app.models.user import Role
    # Handle both Enum and string representations
    role_val = str(user.role.value if hasattr(user.role, 'value') else user.role).strip().upper()
    if role_val not in ["STUDENT", "TRAINER"]:
        raise HTTPException(
            status_code=403, 
            detail=f"Only Trainee (Student/Trainer) accounts can scan QR codes for attendance. You are currently logged in with a '{role_val}' account."
        )

    # 1. Validate the token
    from app.models.setting import SystemSetting
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == "active_qr_secret"))
    setting = result.scalar_one_or_none()
    
    batch_id = None
    is_valid = False
    
    # Check if this is the dynamic/old format or the new permanent secret
    if setting and token == setting.value:
        is_valid = True
    else:
        # Check if it's the JSON payload format (contains batch_id)
        try:
            padded = token + '=' * (-len(token) % 4)
            decoded_bytes = base64.b64decode(padded)
            payload = json.loads(decoded_bytes.decode())
            
            expiration = payload.get("exp")
            if expiration:
                exp_date = datetime.fromisoformat(expiration)
                # Ensure comparison is between aware or naive but not both
                if exp_date.tzinfo is None:
                    exp_date = exp_date.replace(tzinfo=timezone.utc)
                
                if datetime.now(timezone.utc) < exp_date:
                    is_valid = True
                    batch_id = payload.get("b") # Extract batch_id
        except:
            pass

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or outdated QR code. Please scan the current one provided by the trainer.")

    # 1.5 Verify Batch exists to prevent 500 Foreign Key Integrity Errors
    from app.models.course import Batch
    if batch_id:
        batch = await db.get(Batch, batch_id)
        if not batch:
            raise HTTPException(status_code=400, detail="The training batch associated with this QR code is invalid or has been deleted.")

    # 2. Toggle Logic: Punch In if no record for today, or Punch Out if active session
    from app.models.attendance import TimeTracking, Attendance, AttendanceStatus
    from sqlalchemy import and_, func
    
    now = datetime.now(timezone.utc)
    today = now.date()
    
    # Check if there is already a TimeTracking record for today
    result = await db.execute(
        select(TimeTracking).where(
            and_(
                TimeTracking.user_id == user.id,
                func.date(TimeTracking.date) == today
            )
        )
    )
    time_record = result.scalar_one_or_none()
    
    message = ""
    session_info = {}
    
    if not time_record:
        # Case A: First scan of the day -> Punch In
        time_record = TimeTracking(
            user_id=user.id,
            date=datetime.combine(today, time.min, tzinfo=timezone.utc),
            login_time=now
        )
        db.add(time_record)
        
        # Also mark Attendance if batch_id is available
        if batch_id:
            # Check for existing attendance record for this batch/day
            att_result = await db.execute(
                select(Attendance).where(
                    and_(
                        Attendance.student_id == user.id,
                        Attendance.batch_id == batch_id,
                        func.date(Attendance.date) == today
                    )
                )
            )
            att_record = att_result.scalar_one_or_none()
            if not att_record:
                att_record = Attendance(
                    student_id=user.id,
                    batch_id=batch_id,
                    date=datetime.combine(today, time.min, tzinfo=timezone.utc),
                    status=AttendanceStatus.PRESENT,
                    login_time=now
                )
                db.add(att_record)
            else:
                att_record.login_time = now
                att_record.status = AttendanceStatus.PRESENT

        message = "Punch In successful! Your arrival has been recorded."
        session_info = {
            "punch_type": "IN",
            "login_time": now.isoformat(),
            "date": today.isoformat(),
            "user_name": user.name,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "student_id": user.student_id or user.id
        }
    elif time_record.logout_time is None:
        # Case B: Already punched in, no logout yet -> Punch Out
        time_record.logout_time = now
        diff = now - time_record.login_time
        time_record.total_minutes = int(diff.total_seconds() / 60)
        
        # Update Attendance record if active
        att_result = await db.execute(
            select(Attendance).where(
                and_(
                    Attendance.student_id == user.id,
                    func.date(Attendance.date) == today,
                     Attendance.logout_time == None
                )
            ).order_by(Attendance.login_time.desc())
        )
        att_record = att_result.scalar_one_or_none()
        if att_record:
            att_record.logout_time = now
            diff_att = now - att_record.login_time
            att_record.total_hours = round(diff_att.total_seconds() / 3600, 2)
            
        message = f"Punch Out successful! Total active time: {time_record.total_minutes} mins."
        session_info = {
            "punch_type": "OUT",
            "login_time": time_record.login_time.isoformat(),
            "logout_time": now.isoformat(),
            "total_minutes": time_record.total_minutes,
            "date": today.isoformat(),
            "user_name": user.name,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "student_id": user.student_id or user.id
        }
    else:
        # Case C: Already punched out today
        return {
            "status": "success", 
            "message": "You have already completed your time tracking for today. Great work!",
            "session_info": {
                "punch_type": "DONE",
                "login_time": time_record.login_time.isoformat(),
                "logout_time": time_record.logout_time.isoformat(),
                "total_minutes": time_record.total_minutes,
                "date": today.isoformat(),
                "user_name": user.name,
                "role": user.role.value if hasattr(user.role, 'value') else user.role,
                "student_id": user.student_id or user.id
            }
        }
        
    await db.flush()
    return {"status": "success", "message": message, "session_info": session_info}
