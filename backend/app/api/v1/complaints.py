from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.complaint import Complaint
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintUpdate,
    ComplaintConfirm,
    ComplaintResponse,
    ComplaintDetailResponse
)
from app.services.complaint_service import (
    create_complaint_draft,
    update_complaint_draft,
    confirm_complaint_draft,
    get_complaint_detail_payload
)

router = APIRouter(prefix="/complaints", tags=["Incident Complaint Workflow"])

@router.post("", response_model=ComplaintResponse)
def create_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new complaint draft for an investigation.
    """
    complaint = create_complaint_draft(db, current_user.id, payload)
    return complaint

@router.get("", response_model=List[ComplaintResponse])
def list_complaints(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists authenticated user's complaint drafts with optional filtering.
    """
    query = db.query(Complaint).filter(Complaint.user_id == current_user.id)
    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Complaint.category == category)
    
    complaints = query.order_by(Complaint.created_at.desc()).all()
    return complaints

@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
def get_complaint_detail(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves detailed complaint draft with evidence selections and confirmation declaration.
    """
    payload = get_complaint_detail_payload(db, current_user.id, complaint_id)
    return payload

@router.patch("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: str,
    payload: ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates category, title, description, or evidence selections in a complaint draft.
    """
    complaint = update_complaint_draft(db, current_user.id, complaint_id, payload)
    return complaint

@router.post("/{complaint_id}/confirm", response_model=ComplaintResponse)
def confirm_complaint(
    complaint_id: str,
    payload: ComplaintConfirm,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Confirms complaint review and marks status as READY.
    """
    complaint = confirm_complaint_draft(db, current_user.id, complaint_id, payload.user_confirmed)
    return complaint
