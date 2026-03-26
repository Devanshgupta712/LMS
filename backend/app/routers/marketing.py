from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_roles
from app.models.user import User, Role
from app.models.lead import Lead, LeadActivity
from app.schemas.schemas import LeadCreate, LeadUpdate, LeadOut

router = APIRouter(prefix="/api/marketing", tags=["Marketing"])


@router.get("/leads")
async def list_leads(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lead).order_by(Lead.created_at.desc()))
    leads = result.scalars().all()
    out = []
    for l in leads:
        assignee = await db.get(User, l.assigned_to_id) if l.assigned_to_id else None
        act_q = await db.execute(select(func.count(LeadActivity.id)).where(LeadActivity.lead_id == l.id))
        out.append(LeadOut(
            id=l.id, name=l.name, email=l.email, phone=l.phone,
            source=l.source, status=l.status.value, notes=l.notes,
            assigned_to_name=assignee.name if assignee else None,
            activity_count=act_q.scalar() or 0,
            created_at=l.created_at,
        ))
    return out


@router.post("/leads", status_code=201)
async def create_lead(
    body: LeadCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MARKETER)),
):
    lead = Lead(
        name=body.name, email=body.email, phone=body.phone,
        source=body.source, notes=body.notes,
        assigned_to_id=body.assigned_to_id,
    )
    db.add(lead)
    await db.flush()
    await db.refresh(lead)
    return LeadOut(
        id=lead.id, name=lead.name, email=lead.email, phone=lead.phone,
        source=lead.source, status=lead.status.value, notes=lead.notes,
        created_at=lead.created_at,
    )


@router.patch("/leads/{lead_id}")
async def update_lead(
    lead_id: str,
    body: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MARKETER)),
):
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if body.status:
        lead.status = body.status
    if body.notes is not None:
        lead.notes = body.notes
    await db.flush()
    return {"status": "updated"}


import io
import csv
from fastapi.responses import StreamingResponse
from datetime import datetime

@router.get("/reports/export")
async def export_marketing_report(
    start_date: str = "",
    end_date: str = "",
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MARKETER))
):
    query = select(Lead)
    if start_date:
        query = query.where(Lead.created_at >= datetime.strptime(start_date, "%Y-%m-%d"))
    if end_date:
        query = query.where(Lead.created_at <= datetime.strptime(end_date, "%Y-%m-%d"))
        
    result = await db.execute(query.order_by(Lead.created_at.desc()))
    leads = result.scalars().all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Created At", "Name", "Email", "Phone", "Status", "Source", "Assigned To", "Notes"
    ])
    
    for lead in leads:
        assigned_user = await db.get(User, lead.assigned_to_id) if lead.assigned_to_id else None
        writer.writerow([
            lead.created_at.strftime("%Y-%m-%d %H:%M") if lead.created_at else "",
            lead.name,
            lead.email or "",
            lead.phone or "",
            lead.status.value if hasattr(lead.status, "value") else lead.status,
            lead.source or "",
            assigned_user.name if assigned_user else "Unassigned",
            lead.notes or ""
        ])
        
    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=leads_report.csv"
    return response


# ─── Lead Activities ──────────────────────────────────
@router.get("/leads/{lead_id}/activities")
async def list_activities(lead_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LeadActivity).where(LeadActivity.lead_id == lead_id).order_by(LeadActivity.created_at.desc())
    )
    return [
        {
            "id": a.id, "type": a.type, "message": a.message,
            "scheduled_at": a.scheduled_at, "sent_at": a.sent_at,
            "response": a.response, "created_at": a.created_at,
        }
        for a in result.scalars().all()
    ]


@router.post("/leads/{lead_id}/activities", status_code=201)
async def create_activity(
    lead_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    activity = LeadActivity(
        lead_id=lead_id,
        type=body.get("type", "NOTE"),
        message=body.get("message"),
        user_id=user.id,
    )
    db.add(activity)
    await db.flush()
    return {"status": "created"}
