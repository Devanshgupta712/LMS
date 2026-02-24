from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from datetime import datetime, date, time
import os, uuid, base64, json

from app.database import get_db
from app.models.user import User
from app.models.registration import Document
from app.schemas.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.middleware.auth import create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
            sa = User(email=body.email, password=pwd_context.hash(body.password), name="Super Admin", role=Role.SUPER_ADMIN, is_active=True)
            db.add(sa)
            await db.flush()

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not pwd_context.verify(body.password, user.password):
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

    hashed = pwd_context.hash(body.password)

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
        
    try:
        # Decode base64 — add padding if needed to prevent errors
        padded = token + '=' * (-len(token) % 4)
        decoded_bytes = base64.b64decode(padded)
        payload = json.loads(decoded_bytes.decode())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid QR code format: {e}")
        
    expiration = payload.get("exp")
    if not expiration:
        raise HTTPException(status_code=400, detail="Invalid token payload")
        
    try:
        exp_date = datetime.fromisoformat(expiration)
        if datetime.utcnow() > exp_date:
            raise HTTPException(status_code=400, detail="This QR code has expired")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid expiration date in token")
        
    payload_type = payload.get("type")
    
    if payload_type in ["GENERAL_LOGIN", "PUNCH_IN", "PUNCH_OUT"]:
        from app.models.attendance import TimeTracking
        from sqlalchemy import and_, func
        
        now = datetime.utcnow()
        today = now.date()
        
        # Check if there is already a record for today
        result = await db.execute(
            select(TimeTracking).where(
                and_(
                    TimeTracking.user_id == user.id,
                    func.date(TimeTracking.date) == today
                )
            )
        )
        record = result.scalar_one_or_none()
        
        # Determine intended action based on payload_type or toggle behavior
        action = payload_type
        if action == "GENERAL_LOGIN":
            # Backward compatibility / generic toggle
            action = "PUNCH_OUT" if (record and record.logout_time is None) else "PUNCH_IN"

        if action == "PUNCH_IN":
            if record:
                return {"status": "success", "message": "You have already punched in for today."}
            
            # First scan: Punch In
            record = TimeTracking(
                user_id=user.id,
                date=datetime.combine(today, time.min),
                login_time=now
            )
            db.add(record)
            message = "Punch In successful! Have a great day."
        
        elif action == "PUNCH_OUT":
            if not record:
                raise HTTPException(status_code=400, detail="You must Punch In first.")
            if record.logout_time:
                return {"status": "success", "message": "You have already punched out for today."}
            
            # Second scan: Punch Out
            record.logout_time = now
            # Calculate total minutes
            diff = now - record.login_time
            record.total_minutes = int(diff.total_seconds() / 60)
            message = f"Punch Out successful! Total session: {record.total_minutes} mins"
            
        await db.flush()
        return {"status": "success", "message": message}

    # Original Batch-specific logic
    batch_id = payload.get("b")
    date_str = payload.get("d")
    if not batch_id or not date_str:
        raise HTTPException(status_code=400, detail="Missing batch or date info in token")
        
    # Check if student is in batch
    from app.models.course import BatchStudent
    bs_result = await db.execute(
        select(BatchStudent).where(BatchStudent.batch_id == batch_id, BatchStudent.student_id == user.id)
    )
    if not bs_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You are not enrolled in this batch")
        
    # Mark attendance - check by date only (ignoring time)
    from app.models.attendance import Attendance
    from sqlalchemy import func
    
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    existing = await db.execute(
        select(Attendance).where(
            Attendance.student_id == user.id,
            Attendance.batch_id == batch_id,
            func.date(Attendance.date) == date_obj.date()
        )
    )
    if existing.scalar_one_or_none():
        return {"status": "success", "message": "Attendance already marked for today."}
        
    record = Attendance(
        student_id=user.id,
        batch_id=batch_id,
        date=date_obj,
        status="PRESENT",
        remarks="Scanned QR Code"
    )
    db.add(record)
    await db.flush()
    
    return {"status": "success", "message": "Successfully marked Present!"}
