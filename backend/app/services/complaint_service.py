import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.investigation import Investigation
from app.models.complaint import Complaint
from app.models.complaint_evidence import ComplaintEvidence
from app.models.signal import AnalysisSignal
from app.schemas.complaint import ComplaintCreate, ComplaintUpdate, ComplaintDetailResponse, ComplaintResponse, ComplaintEvidenceItem
from app.schemas.investigation import SignalResponse

DECLARATION_TEXT = (
    "I confirm that I have reviewed this information and understand that IdentityTrace "
    "provides automated risk indicators rather than a definitive legal determination of wrongdoing. "
    "This report requests review of the identified target and does not independently establish that illegal activity occurred."
)

def generate_complaint_identifier(db: Session) -> str:
    count = db.query(Complaint).count() + 1
    return f"CMP-2026-{count:06d}"

def create_complaint_draft(db: Session, user_id: str, payload: ComplaintCreate) -> Complaint:
    inv = db.query(Investigation).filter(
        Investigation.id == payload.investigation_id,
        Investigation.user_id == user_id
    ).first()

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investigation record not found or access denied."
        )

    identifier = generate_complaint_identifier(db)

    default_desc = payload.description.strip()
    if not default_desc:
        signals = db.query(AnalysisSignal).filter(AnalysisSignal.investigation_id == inv.id).all()
        sig_names = ", ".join([s.signal_name for s in signals]) if signals else "Automated risk indicators"
        default_desc = (
            f"Automated risk analysis of target {inv.normalized_url} ({inv.platform}) identified a risk score of {inv.risk_score}/100 "
            f"({inv.risk_level} Risk). Primary indicators detected: {sig_names}. Requesting administrative review of suspected suspicious activity."
        )

    complaint = Complaint(
        id=str(uuid.uuid4()),
        complaint_identifier=identifier,
        user_id=user_id,
        investigation_id=inv.id,
        title=payload.title.strip() or f"Suspected Activity Review - {inv.domain}",
        category=payload.category,
        description=default_desc,
        status="DRAFT",
        user_confirmed=False,
        created_at=datetime.utcnow()
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    signals = db.query(AnalysisSignal).filter(AnalysisSignal.investigation_id == inv.id).all()
    for sig in signals:
        is_inc = True if not payload.included_signal_ids else (sig.id in payload.included_signal_ids)
        ev = ComplaintEvidence(
            id=str(uuid.uuid4()),
            complaint_id=complaint.id,
            signal_id=sig.id,
            included=is_inc
        )
        db.add(ev)
    db.commit()
    db.refresh(complaint)

    return complaint

def update_complaint_draft(db: Session, user_id: str, complaint_id: str, payload: ComplaintUpdate) -> Complaint:
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.user_id == user_id
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint draft not found or authorization denied."
        )

    if payload.title is not None:
        complaint.title = payload.title.strip()
    if payload.category is not None:
        complaint.category = payload.category
    if payload.description is not None:
        complaint.description = payload.description.strip()

    if payload.included_signal_ids is not None:
        existing_ev = db.query(ComplaintEvidence).filter(ComplaintEvidence.complaint_id == complaint.id).all()
        for ev in existing_ev:
            ev.included = ev.signal_id in payload.included_signal_ids
        db.commit()

    db.commit()
    db.refresh(complaint)
    return complaint

def confirm_complaint_draft(db: Session, user_id: str, complaint_id: str, confirmed: bool) -> Complaint:
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.user_id == user_id
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint draft not found or authorization denied."
        )

    if not confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit user review confirmation is required to finalize complaint draft."
        )

    complaint.user_confirmed = True
    complaint.status = "READY"
    db.commit()
    db.refresh(complaint)
    return complaint

def get_complaint_detail_payload(db: Session, user_id: str, complaint_id: str) -> Dict[str, Any]:
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.user_id == user_id
    ).first()

    if not complaint:
        complaint = db.query(Complaint).filter(
            Complaint.complaint_identifier == complaint_id,
            Complaint.user_id == user_id
        ).first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint record not found or access denied."
        )

    inv = complaint.investigation

    ev_links = db.query(ComplaintEvidence).filter(ComplaintEvidence.complaint_id == complaint.id).all()
    evidence_items = []
    for ev in ev_links:
        sig = ev.signal
        sig_resp = SignalResponse(
            id=sig.id,
            signal_name=sig.signal_name,
            signal_category=getattr(sig, "signal_category", getattr(sig, "category", "URL Analysis")),
            detected=getattr(sig, "detected", True),
            weight=int(getattr(sig, "weight", getattr(sig, "impact_score", 15))),
            value=getattr(sig, "value", None),
            explanation=sig.explanation or "Risk factor detected.",
            availability=getattr(sig, "availability", "CONFIGURED"),
            created_at=getattr(sig, "created_at", datetime.utcnow())
        ) if sig else None

        evidence_items.append(
            ComplaintEvidenceItem(
                id=ev.id,
                signal_id=ev.signal_id,
                included=ev.included,
                signal=sig_resp
            )
        )

    return {
        "id": complaint.id,
        "complaint_identifier": complaint.complaint_identifier,
        "user_id": complaint.user_id,
        "investigation_id": complaint.investigation_id,
        "title": complaint.title,
        "category": complaint.category,
        "description": complaint.description,
        "status": complaint.status,
        "user_confirmed": complaint.user_confirmed,
        "created_at": complaint.created_at,
        "domain": inv.domain,
        "normalized_url": inv.normalized_url,
        "platform": inv.platform,
        "risk_score": inv.risk_score,
        "risk_level": inv.risk_level,
        "evidence_items": evidence_items,
        "declaration": DECLARATION_TEXT
    }
