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


@router.post("/change-password")
async def change_own_password(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Allow any authenticated user to change their own password."""
    current_password = body.get("current_password", "")
    new_password = body.get("new_password", "")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Both current_password and new_password are required")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    if not verify_password(current_password, user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    user.password = get_password_hash(new_password)
    await db.flush()
    return {"status": "password_changed"}

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
import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates in meters using haversine formula."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.post("/attendance/scan")
async def scan_attendance_qr(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    token = body.get("qr_token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing QR token")
        
    from app.models.user import Role
    role_val = str(user.role.value if hasattr(user.role, 'value') else user.role).strip().upper()

    # Super Admins are exempt from punch-in
    if role_val == "SUPER_ADMIN":
        raise HTTPException(
            status_code=403, 
            detail="Super Admins are exempt from punch-in requirements."
        )

    # --- Geolocation radius check ---
    from app.models.setting import SystemSetting
    scan_lat = body.get("latitude")
    scan_lng = body.get("longitude")
    
    if scan_lat is not None and scan_lng is not None:
        # Fetch office location settings
        loc_result = await db.execute(select(SystemSetting).where(SystemSetting.key == "office_latitude"))
        lat_setting = loc_result.scalar_one_or_none()
        loc_result2 = await db.execute(select(SystemSetting).where(SystemSetting.key == "office_longitude"))
        lng_setting = loc_result2.scalar_one_or_none()
        loc_result3 = await db.execute(select(SystemSetting).where(SystemSetting.key == "office_radius_meters"))
        radius_setting = loc_result3.scalar_one_or_none()
        
        if lat_setting and lng_setting:
            office_lat = float(lat_setting.value)
            office_lng = float(lng_setting.value)
            allowed_radius = float(radius_setting.value) if radius_setting else 200.0
            
            distance = haversine_distance(float(scan_lat), float(scan_lng), office_lat, office_lng)
            if distance > allowed_radius:
                raise HTTPException(
                    status_code=403,
                    detail=f"You are {int(distance)}m away from the office. QR scan is only allowed within {int(allowed_radius)}m radius. Please move closer to the institute."
                )

    # --- Validate QR token ---
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == "active_qr_secret"))
    setting = result.scalar_one_or_none()
    
    is_valid = False
    
    # Check against the persistent global QR secret
    if setting and token == setting.value:
        is_valid = True
    else:
        # Fallback: check old JSON payload format (batch-specific QR)
        try:
            padded = token + '=' * (-len(token) % 4)
            decoded_bytes = base64.b64decode(padded)
            payload = json.loads(decoded_bytes.decode())
            expiration = payload.get("exp")
            if expiration:
                exp_date = datetime.fromisoformat(expiration)
                if exp_date.tzinfo is None:
                    exp_date = exp_date.replace(tzinfo=timezone.utc)
                if datetime.now(timezone.utc) < exp_date:
                    is_valid = True
        except:
            pass

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired QR code. Please scan the current one displayed at the institute.")

    # --- Punch In/Out Toggle (TimeTracking only) ---
    from app.models.attendance import TimeTracking
    from sqlalchemy import and_, func
    
    # Calculate IST as naive datetime (DB stores naive)
    utc_now = datetime.utcnow()
    now = utc_now + timedelta(hours=5, minutes=30)
    today = now.date()
    
    result = await db.execute(
        select(TimeTracking).where(
            and_(
                TimeTracking.user_id == user.id,
                func.date(TimeTracking.date) == today
            )
        ).order_by(TimeTracking.login_time.desc())
    )
    time_record = result.scalars().first()
    
    message = ""
    session_info = {}
    
    if not time_record:
        # Case A: Punch In
        time_record = TimeTracking(
            user_id=user.id,
            date=datetime.combine(today, time.min),
            login_time=now
        )
        db.add(time_record)
        
        message = "Punch In successful! Your arrival has been recorded."
        session_info = {
            "punch_type": "IN",
            "login_time": now.isoformat(),
            "date": today.isoformat(),
            "user_name": user.name,
            "role": role_val,
            "student_id": user.student_id or user.id
        }
    elif time_record.logout_time is None:
        # Case B: Punch Out
        time_record.logout_time = now
        diff = now - time_record.login_time
        time_record.total_minutes = int(diff.total_seconds() / 60)
        
        hours = time_record.total_minutes // 60
        mins = time_record.total_minutes % 60
        duration_str = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"
            
        message = f"Punch Out successful! Duration: {duration_str}."
        session_info = {
            "punch_type": "OUT",
            "login_time": time_record.login_time.isoformat(),
            "logout_time": now.isoformat(),
            "total_minutes": time_record.total_minutes,
            "duration": duration_str,
            "date": today.isoformat(),
            "user_name": user.name,
            "role": role_val,
            "student_id": user.student_id or user.id
        }
    else:
        # Case C: Already completed today
        hours = (time_record.total_minutes or 0) // 60
        mins = (time_record.total_minutes or 0) % 60
        duration_str = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"
        
        return {
            "status": "DONE", 
            "message": f"Today's session is already completed. Duration: {duration_str}.",
            "session_info": {
                "punch_type": "DONE",
                "login_time": time_record.login_time.isoformat(),
                "logout_time": time_record.logout_time.isoformat(),
                "total_minutes": time_record.total_minutes,
                "duration": duration_str,
                "date": today.isoformat(),
                "user_name": user.name,
                "role": role_val,
                "student_id": user.student_id or user.id
            }
        }
        
    await db.flush()
    return {"status": "success", "message": message, "session_info": session_info}
