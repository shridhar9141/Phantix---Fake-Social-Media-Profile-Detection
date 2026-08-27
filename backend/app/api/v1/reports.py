from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.investigation_report import InvestigationReport
from app.schemas.report import ReportResponse, ReportDetailResponse
from app.services.report_service import (
    create_investigation_report,
    get_report_detail_payload,
    generate_report_html,
    generate_report_pdf
)

router = APIRouter(prefix="", tags=["Investigation Reports"])

@router.post("/investigations/{investigation_id}/reports", response_model=ReportResponse)
def generate_report(
    investigation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a structured report from actual stored investigation signals and saves metadata.
    """
    report = create_investigation_report(db, current_user.id, investigation_id)
    return report

@router.get("/reports", response_model=List[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists authenticated user's generated reports.
    """
    reports = db.query(InvestigationReport).filter(
        InvestigationReport.generated_by_user_id == current_user.id
    ).order_by(InvestigationReport.generated_at.desc()).all()
    return reports

@router.get("/reports/{report_id}", response_model=ReportDetailResponse)
def get_report_detail(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves full report details, signals, related entities, limitations, and disclaimer.
    """
    payload = get_report_detail_payload(db, current_user.id, report_id)
    return payload

@router.get("/reports/{report_id}/download")
def download_report(
    report_id: str,
    format: str = Query("pdf", description="Output format: pdf or html"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Downloads investigation report document in PDF (default) or HTML format.
    """
    payload = get_report_detail_payload(db, current_user.id, report_id)

    if format.lower() == "html":
        html_content = generate_report_html(payload)
        filename = f"Phantix_Report_{payload['report_identifier']}.html"
        return Response(
            content=html_content,
            media_type="text/html",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    # Generate genuine PDF binary
    pdf_bytes = generate_report_pdf(payload)
    filename = f"Phantix_Report_{payload['report_identifier']}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/reports/{report_id}/pdf")
def download_report_pdf(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Convenience endpoint to directly download the report in PDF format.
    """
    payload = get_report_detail_payload(db, current_user.id, report_id)
    pdf_bytes = generate_report_pdf(payload)
    filename = f"Phantix_Report_{payload['report_identifier']}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

