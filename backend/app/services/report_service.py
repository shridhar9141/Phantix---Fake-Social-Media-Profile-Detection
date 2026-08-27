import io
import uuid
import unicodedata
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.models.investigation import Investigation
from app.models.investigation_report import InvestigationReport
from app.models.signal import AnalysisSignal
from app.models.connection import Connection
from app.models.profile import Profile
from app.models.profile_connection import ProfileConnection
from app.schemas.report import ReportDetailResponse, ReportResponse
from app.schemas.investigation import SignalResponse, ConnectionResponse

DISCLAIMER_TEXT = (
    "This assessment is generated from automated risk indicators and available analysis data. "
    "A HIGH or CRITICAL risk classification is not, by itself, proof that a person, account, "
    "organization, or website has committed illegal or malicious activity. Human review and "
    "additional verification may be required before taking action."
)

ANALYSIS_LIMITATIONS = [
    "Analysis is based strictly on public data and signals available to Phantix / IdentityTrace at time of inspection.",
    "SSRF-safe isolated sandbox fetch limits deep web interactions or authenticated private API access.",
    "External threat intelligence APIs (e.g. VirusTotal/Google Safe Browsing) require configured system API keys.",
    "Automated heuristic scores indicate probability metrics rather than legal determinations."
]

def safe_text(s: Any) -> str:
    """Sanitizes text and normalizes unicode for ReportLab PDF rendering."""
    if s is None:
        return ""
    norm = unicodedata.normalize("NFKD", str(s))
    clean = norm.encode("latin-1", "replace").decode("latin-1").replace("?", " ")
    return clean.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def generate_report_identifier(db: Session) -> str:
    count = db.query(InvestigationReport).count() + 1
    return f"ITR-2026-{count:06d}"

def create_investigation_report(db: Session, user_id: str, investigation_id: str) -> InvestigationReport:
    inv = db.query(Investigation).filter(
        Investigation.id == investigation_id,
        Investigation.user_id == user_id
    ).first()

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investigation record not found or access denied."
        )

    existing = db.query(InvestigationReport).filter(
        InvestigationReport.investigation_id == investigation_id,
        InvestigationReport.generated_by_user_id == user_id
    ).first()

    if existing:
        return existing

    identifier = generate_report_identifier(db)
    report_type = "HIGH_RISK_INCIDENT" if inv.risk_score >= 60 else "STANDARD_SUMMARY"

    report = InvestigationReport(
        id=str(uuid.uuid4()),
        report_identifier=identifier,
        investigation_id=inv.id,
        generated_by_user_id=user_id,
        report_type=report_type,
        risk_score=inv.risk_score,
        risk_level=inv.risk_level,
        status="GENERATED",
        generated_at=datetime.utcnow()
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

def get_report_detail_payload(db: Session, user_id: str, report_id: str) -> Dict[str, Any]:
    report = db.query(InvestigationReport).filter(
        InvestigationReport.id == report_id,
        InvestigationReport.generated_by_user_id == user_id
    ).first()

    if not report:
        report = db.query(InvestigationReport).filter(
            InvestigationReport.report_identifier == report_id,
            InvestigationReport.generated_by_user_id == user_id
        ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investigation report not found or authorization denied."
        )

    inv = report.investigation

    # Fetch actual signals
    signals_query = db.query(AnalysisSignal).filter(AnalysisSignal.investigation_id == inv.id).all()
    signal_responses = [
        SignalResponse(
            id=s.id,
            signal_name=s.signal_name,
            signal_category=getattr(s, "signal_category", getattr(s, "category", "URL Analysis")),
            detected=getattr(s, "detected", True),
            weight=int(getattr(s, "weight", getattr(s, "impact_score", 15))),
            value=getattr(s, "value", None),
            explanation=s.explanation or "Risk factor detected during inspection.",
            availability=getattr(s, "availability", "CONFIGURED"),
            created_at=getattr(s, "created_at", datetime.utcnow())
        )
        for s in signals_query
    ]

    # Fetch Profile info if available
    profile = db.query(Profile).filter(Profile.investigation_id == inv.id).first()
    if not profile:
        from urllib.parse import urlparse
        parsed_u = urlparse(inv.normalized_url)
        u_parts = [p for p in parsed_u.path.split("/") if p]
        if u_parts:
            u_handle = u_parts[0].lstrip("@")
            profile = db.query(Profile).filter(
                Profile.username == u_handle,
                Profile.platform == inv.platform
            ).first()

    profile_data: Optional[Dict[str, Any]] = None
    if profile:
        profile_data = {
            "id": profile.id,
            "username": profile.username,
            "display_name": profile.display_name,
            "platform": profile.platform,
            "profile_url": profile.profile_url,
            "profile_image_url": profile.profile_image_url,
            "bio": profile.bio,
            "followers_count": profile.followers_count,
            "following_count": profile.following_count,
            "posts_count": profile.posts_count,
            "is_verified": getattr(profile, "is_verified", False),
            "is_private": getattr(profile, "is_private", False),
            "availability": profile.raw_data.get("availability", {}) if isinstance(profile.raw_data, dict) else {}
        }

    # Fetch actual connections
    connections_list: List[ConnectionResponse] = []
    if profile:
        profile_conns = db.query(ProfileConnection).filter(
            (ProfileConnection.profile_id_1 == profile.id) | (ProfileConnection.profile_id_2 == profile.id)
        ).all()

        for pc in profile_conns:
            other_id = pc.profile_id_2 if pc.profile_id_1 == profile.id else pc.profile_id_1
            other_prof = db.query(Profile).filter(Profile.id == other_id).first()
            if other_prof:
                connections_list.append(
                    ConnectionResponse(
                        id=str(pc.id),
                        source_entity_id=str(pc.profile_id_1),
                        target_entity_id=str(pc.profile_id_2),
                        connection_type=pc.connection_type,
                        connection_reason=getattr(pc, "explanation", getattr(pc, "connection_reason", "Related profile similarity match")),
                        similarity_score=float(pc.similarity_score),
                        target_domain=other_prof.username or other_prof.display_name or "Entity",
                        target_platform=other_prof.platform,
                        created_at=getattr(pc, "created_at", datetime.utcnow())
                    )
                )

    # Compute authenticity verdict
    risk_score = report.risk_score or 0
    if risk_score < 30:
        verdict = "AUTHENTIC / REAL PROFILE"
        verdict_badge = "VERIFIED AUTHENTIC (LOW RISK)"
        verdict_color = "#059669"
        verdict_desc = "Target demonstrates legitimate behavioral patterns, normal follower-to-following ratios, and zero active threat indicators."
    elif risk_score < 60:
        verdict = "ELEVATED RISK / SUSPICIOUS"
        verdict_badge = "ELEVATED RISK (MODERATE)"
        verdict_color = "#d97706"
        verdict_desc = "Target exhibits elevated risk parameters or minor anomalies. Manual review recommended."
    else:
        verdict = "POTENTIAL FAKE / IMPERSONATOR"
        verdict_badge = "HIGH RISK / LIKELY FAKE"
        verdict_color = "#dc2626"
        verdict_desc = "Multiple high-severity risk indicators detected, such as brand spoofing, abnormal follow ratios, or bot creation patterns."

    return {
        "id": report.id,
        "report_identifier": report.report_identifier,
        "investigation_id": inv.id,
        "generated_by_user_id": report.generated_by_user_id,
        "report_type": report.report_type,
        "risk_score": report.risk_score,
        "risk_level": report.risk_level,
        "status": report.status,
        "generated_at": report.generated_at,
        "target_type": inv.entity_type,
        "original_url": inv.original_url,
        "normalized_url": inv.normalized_url,
        "domain": inv.domain,
        "platform": inv.platform,
        "profile": profile_data,
        "verdict": verdict,
        "verdict_badge": verdict_badge,
        "verdict_color": verdict_color,
        "verdict_desc": verdict_desc,
        "signals": signal_responses,
        "connections": connections_list,
        "summary": inv.summary or "Multiple automated risk indicators were detected during analysis.",
        "limitations": ANALYSIS_LIMITATIONS,
        "disclaimer": DISCLAIMER_TEXT
    }

def generate_report_pdf(payload: Dict[str, Any]) -> bytes:
    """
    Renders an official, beautifully styled cybersecurity & profile authenticity forensic PDF report using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom ReportLab Paragraph Styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        textColor=colors.HexColor("#0f172a"),
        leading=18,
        spaceAfter=2
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        textColor=colors.HexColor("#6366f1"),
        leading=11,
        textTransform="uppercase"
    )
    meta_style = ParagraphStyle(
        "MetaText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        textColor=colors.HexColor("#64748b"),
        leading=10
    )
    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=colors.HexColor("#1e293b"),
        leading=13,
        spaceBefore=8,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        textColor=colors.HexColor("#334155"),
        leading=11
    )
    bold_body_style = ParagraphStyle(
        "BoldBody",
        parent=body_style,
        fontName="Helvetica-Bold"
    )
    disclaimer_style = ParagraphStyle(
        "DisclaimerText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        textColor=colors.HexColor("#78350f"),
        leading=9.5
    )

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph(safe_text("PHANTIX / IDENTITYTRACE CYBER INTELLIGENCE"), subtitle_style),
            Paragraph(safe_text(f"REPORT ID: {payload['report_identifier']}"), ParagraphStyle('HRight', parent=meta_style, alignment=TA_RIGHT, fontName='Helvetica-Bold'))
        ],
        [
            Paragraph(safe_text("PROFILE AUTHENTICITY & FORENSIC INVESTIGATION REPORT"), title_style),
            Paragraph(safe_text(f"Generated: {payload['generated_at']}"), ParagraphStyle('DRight', parent=meta_style, alignment=TA_RIGHT))
        ]
    ]
    t_header = Table(header_data, colWidths=[360, 180])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0f172a"), spaceBefore=2, spaceAfter=8))

    # 2. Authenticity Verdict Box
    verdict_hex = payload.get("verdict_color", "#059669")
    verdict_color = colors.HexColor(verdict_hex)
    verdict_text = payload.get("verdict", "AUTHENTIC / REAL PROFILE")
    verdict_badge = payload.get("verdict_badge", "VERIFIED AUTHENTIC (LOW RISK)")
    verdict_desc = payload.get("verdict_desc", "")

    verdict_table_data = [
        [
            Paragraph(safe_text(f"<b>FINAL AUTHENTICITY CLASSIFICATION: {verdict_text}</b>"), ParagraphStyle('VTitle', fontName='Helvetica-Bold', fontSize=10.5, textColor=verdict_color, leading=13)),
            Paragraph(safe_text(f"<b>HEURISTIC RISK SCORE: {payload['risk_score']}/100</b> ({payload['risk_level']} RISK)"), ParagraphStyle('VScore', fontName='Helvetica-Bold', fontSize=9.5, textColor=colors.HexColor("#0f172a"), alignment=TA_RIGHT, leading=12))
        ],
        [
            Paragraph(safe_text(verdict_desc), ParagraphStyle('VDesc', fontName='Helvetica', fontSize=8, textColor=colors.HexColor("#334155"), leading=10)),
            Paragraph(safe_text(f"Status: {verdict_badge}"), ParagraphStyle('VStat', fontName='Helvetica-Bold', fontSize=8, textColor=verdict_color, alignment=TA_RIGHT, leading=10))
        ]
    ]
    t_verdict = Table(verdict_table_data, colWidths=[360, 180])
    t_verdict.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1.5, verdict_color),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_verdict)
    story.append(Spacer(1, 8))

    # 3. Target Profile Information
    story.append(Paragraph(safe_text("1. TARGET PROFILE & IDENTITY METRICS"), h2_style))

    prof = payload.get("profile") or {}
    prof_username = prof.get("username") or payload.get("domain") or "Target"
    prof_display = prof.get("display_name") or prof_username
    prof_bio = prof.get("bio") or "No public bio provided."
    followers_str = f"{prof.get('followers_count'):,}" if prof.get("followers_count") is not None else "Unavailable / Restricted"
    following_str = f"{prof.get('following_count'):,}" if prof.get("following_count") is not None else "Unavailable / Restricted"
    posts_str = f"{prof.get('posts_count'):,}" if prof.get("posts_count") is not None else "Unavailable / Restricted"
    target_url_str = payload.get("normalized_url") or payload.get("original_url") or ""

    profile_table_data = [
        [
            Paragraph(safe_text("<b>Target Identifier:</b>"), body_style),
            Paragraph(safe_text(f"@{prof_username}"), bold_body_style),
            Paragraph(safe_text("<b>Target Platform:</b>"), body_style),
            Paragraph(safe_text(f"{payload.get('platform', 'Social Media')} ({payload.get('target_type', 'Profile')})"), body_style),
        ],
        [
            Paragraph(safe_text("<b>Display Name:</b>"), body_style),
            Paragraph(safe_text(prof_display), body_style),
            Paragraph(safe_text("<b>Target URL:</b>"), body_style),
            Paragraph(safe_text(target_url_str), body_style),
        ],
        [
            Paragraph(safe_text("<b>Followers:</b>"), body_style),
            Paragraph(safe_text(followers_str), bold_body_style),
            Paragraph(safe_text("<b>Following:</b>"), body_style),
            Paragraph(safe_text(following_str), bold_body_style),
        ],
        [
            Paragraph(safe_text("<b>Total Posts:</b>"), body_style),
            Paragraph(safe_text(posts_str), body_style),
            Paragraph(safe_text("<b>Bio / Description:</b>"), body_style),
            Paragraph(safe_text(prof_bio), body_style),
        ]
    ]

    t_profile = Table(profile_table_data, colWidths=[95, 175, 95, 175])
    t_profile.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_profile)
    story.append(Spacer(1, 8))

    # 4. Multi-Signal Detection Breakdown
    story.append(Paragraph(safe_text(f"2. FORENSIC RISK INDICATORS & SIGNAL ANALYSIS ({len(payload['signals'])} Evaluated)"), h2_style))

    signal_rows = [
        [
            Paragraph(safe_text("<b>Signal Indicator</b>"), ParagraphStyle('TH1', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#0f172a"))),
            Paragraph(safe_text("<b>Category</b>"), ParagraphStyle('TH2', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#0f172a"))),
            Paragraph(safe_text("<b>Status</b>"), ParagraphStyle('TH3', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#0f172a"))),
            Paragraph(safe_text("<b>Weight</b>"), ParagraphStyle('TH4', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#0f172a"))),
            Paragraph(safe_text("<b>Forensic Analysis Details</b>"), ParagraphStyle('TH5', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#0f172a"))),
        ]
    ]

    for s in payload["signals"]:
        status_text = "DETECTED" if s.detected else ("CLEAN" if s.availability == "AVAILABLE" else "UNAVAILABLE")
        status_color = "#dc2626" if s.detected else ("#059669" if s.availability == "AVAILABLE" else "#d97706")
        weight_str = f"+{s.weight}" if s.detected else "+0"

        signal_rows.append([
            Paragraph(safe_text(s.signal_name), bold_body_style),
            Paragraph(safe_text(s.signal_category), body_style),
            Paragraph(safe_text(f"<b>{status_text}</b>"), ParagraphStyle('SCol', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.HexColor(status_color))),
            Paragraph(safe_text(weight_str), ParagraphStyle('WCol', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#0f172a"))),
            Paragraph(safe_text(f"{s.explanation} <i>({s.value or ''})</i>"), body_style),
        ])

    t_signals = Table(signal_rows, colWidths=[110, 85, 60, 45, 240])
    t_signals.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(t_signals)
    story.append(Spacer(1, 8))

    # 5. Entity Relationships (if any)
    if payload.get("connections"):
        story.append(Paragraph(safe_text(f"3. DETECTED ENTITY RELATIONSHIPS ({len(payload['connections'])} Linked Profiles)"), h2_style))
        conn_rows = [
            [
                Paragraph(safe_text("<b>Connection Type</b>"), ParagraphStyle('CTH1', fontName='Helvetica-Bold', fontSize=8)),
                Paragraph(safe_text("<b>Linked Entity</b>"), ParagraphStyle('CTH2', fontName='Helvetica-Bold', fontSize=8)),
                Paragraph(safe_text("<b>Similarity Explanation</b>"), ParagraphStyle('CTH3', fontName='Helvetica-Bold', fontSize=8)),
            ]
        ]
        for c in payload["connections"]:
            conn_rows.append([
                Paragraph(safe_text(c.connection_type), bold_body_style),
                Paragraph(safe_text(f"{c.target_domain} ({c.target_platform})"), body_style),
                Paragraph(safe_text(c.connection_reason), body_style),
            ])
        t_conns = Table(conn_rows, colWidths=[130, 130, 280])
        t_conns.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING', (0,0), (-1,-1), 5),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t_conns)
        story.append(Spacer(1, 8))

    # 6. Analysis Scope & Limitations
    story.append(Paragraph(safe_text("3. SCOPE LIMITATIONS & COMPLIANCE"), h2_style))
    limitations_text = "<br/>".join([f"• {safe_text(item)}" for item in payload["limitations"]])
    story.append(Paragraph(limitations_text, body_style))
    story.append(Spacer(1, 6))

    # 7. Legal Disclaimer
    disclaimer_box = [
        [
            Paragraph(safe_text(f"<b>LEGAL NOTICE & DISCLAIMER:</b> {payload['disclaimer']}"), disclaimer_style)
        ]
    ]
    t_disclaimer = Table(disclaimer_box, colWidths=[540])
    t_disclaimer.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fffbeb")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#fcd34d")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_disclaimer)

    doc.build(story)
    return buffer.getvalue()

def generate_report_html(payload: Dict[str, Any]) -> str:
    signals_html = ""
    for s in payload["signals"]:
        signals_html += f"""
        <div style="border-left: 3px solid #06b6d4; padding-left: 12px; margin-bottom: 12px;">
            <div style="font-weight: bold; font-size: 13px; color: #0f172a;">{safe_text(s.signal_name)} <span style="font-size: 11px; color: #64748b;">({safe_text(s.signal_category)})</span></div>
            <div style="font-size: 12px; color: #334155; margin-top: 4px;">Impact Weight: <strong>+{s.weight}</strong> — {safe_text(s.explanation)}</div>
        </div>
        """
    if not signals_html:
        signals_html = "<p style='font-size: 12px; color: #64748b;'>No specific risk signals detected.</p>"

    connections_html = ""
    for c in payload.get("connections", []):
        connections_html += f"""
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; margin-bottom: 8px; font-size: 12px;">
            <strong>{safe_text(c.connection_type)}</strong>: {safe_text(c.connection_reason)} ({safe_text(c.target_domain)} - {safe_text(c.target_platform)})
        </div>
        """
    if not connections_html:
        connections_html = "<p style='font-size: 12px; color: #64748b;'>No related entity connections identified during analysis.</p>"

    limitations_html = "".join([f"<li style='margin-bottom: 4px;'>{safe_text(item)}</li>" for item in payload["limitations"]])

    verdict_badge = payload.get("verdict_badge", "AUTHENTIC PROFILE")
    verdict_color = payload.get("verdict_color", "#059669")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8"/>
        <title>{safe_text(payload['report_identifier'])} - Phantix Report</title>
        <style>
            body {{ font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 40px; line-height: 1.5; }}
            .header {{ border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }}
            .badge {{ display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; font-family: monospace; }}
            .verdict-box {{ background: #f8fafc; border: 2px solid {verdict_color}; padding: 14px; border-radius: 8px; margin-bottom: 20px; }}
            .section {{ margin-bottom: 24px; }}
            .section-title {{ font-size: 14px; font-weight: bold; text-transform: uppercase; color: #475569; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }}
            .disclaimer {{ background: #fffbe6; border: 1px solid #ffe58f; padding: 12px; border-radius: 6px; font-size: 11px; color: #856404; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1 style="font-size: 20px; margin: 0; color: #0f172a;">PHANTIX / IDENTITYTRACE INVESTIGATION INTELLIGENCE REPORT</h1>
            <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">
                Report ID: <strong>{safe_text(payload['report_identifier'])}</strong> | Generated: {safe_text(str(payload['generated_at']))}
            </p>
        </div>

        <div class="verdict-box">
            <h2 style="margin: 0 0 6px 0; color: {verdict_color}; font-size: 16px;">
                CLASSIFICATION: {safe_text(payload.get('verdict', 'AUTHENTIC PROFILE'))}
            </h2>
            <p style="margin: 0; font-size: 13px; color: #334155;">
                Risk Score: <strong>{payload['risk_score']}/100</strong> ({payload['risk_level']} RISK) — {safe_text(payload.get('verdict_desc', ''))}
            </p>
        </div>

        <div class="section">
            <div class="section-title">1. Target Subject</div>
            <p style="font-size: 13px; margin: 4px 0;"><strong>Target URL:</strong> {safe_text(payload['original_url'])}</p>
            <p style="font-size: 13px; margin: 4px 0;"><strong>Platform / Domain:</strong> {safe_text(payload['platform'])} ({safe_text(payload['domain'])})</p>
            <p style="font-size: 13px; margin: 4px 0;"><strong>Entity Type:</strong> {safe_text(payload['target_type'])}</p>
        </div>

        <div class="section">
            <div class="section-title">2. Detected Risk Indicators</div>
            {signals_html}
        </div>

        <div class="section">
            <div class="section-title">3. Related Entity Relationships</div>
            {connections_html}
        </div>

        <div class="section">
            <div class="section-title">4. Analysis Limitations</div>
            <ul style="font-size: 11px; color: #475569; padding-left: 20px;">
                {limitations_html}
            </ul>
        </div>

        <div class="disclaimer">
            <strong>IMPORTANT LEGAL DISCLAIMER:</strong> {safe_text(payload['disclaimer'])}
        </div>
    </body>
    </html>
    """
    return html
