import os
import sys
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

from app.core.database import SessionLocal
from app.models.user import User
from app.models.investigation import Investigation
from app.services.report_service import create_investigation_report, get_report_detail_payload, generate_report_html
from app.services.complaint_service import create_complaint_draft, update_complaint_draft, confirm_complaint_draft, get_complaint_detail_payload
from app.schemas.complaint import ComplaintCreate, ComplaintUpdate

def test_workflow():
    print("[TEST] Starting High-Risk Report & Complaint Workflow Verification...")
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("[ERROR] No user found in database. Run test_all_features.py first.")
            sys.exit(1)

        print(f"[1] Verified User: {user.email} ({user.id})")

        # Find or create a high risk investigation
        inv = db.query(Investigation).filter(
            Investigation.user_id == user.id,
            Investigation.risk_score >= 60
        ).first()

        if not inv:
            print("[TEST] Creating synthetic High-Risk Investigation for testing...")
            inv = Investigation(
                user_id=user.id,
                original_url="https://suspicious-airdrop-claim-portal.com/verify",
                normalized_url="https://suspicious-airdrop-claim-portal.com/verify",
                entity_type="WEBSITE",
                domain="suspicious-airdrop-claim-portal.com",
                platform="Website",
                status="COMPLETED",
                risk_score=78,
                risk_level="HIGH",
                summary="Suspicious domain structure and redirect chain detected."
            )
            db.add(inv)
            db.commit()
            db.refresh(inv)

        print(f"[2] High-Risk Target Investigation: {inv.domain} (Score: {inv.risk_score}/100, Level: {inv.risk_level})")

        # Generate Investigation Report
        report = create_investigation_report(db, user.id, inv.id)
        print(f"[3] Report Generated: {report.report_identifier} (Status: {report.status})")

        # Fetch Report Detail Payload
        payload = get_report_detail_payload(db, user.id, report.id)
        assert payload["report_identifier"] == report.report_identifier
        assert payload["disclaimer"] is not None
        assert len(payload["limitations"]) > 0
        print(f"[4] Report Detail Payload Verified. Disclaimer & {len(payload['limitations'])} Limitations Present.")

        # HTML Download Generation
        html = generate_report_html(payload)
        assert "IDENTITYTRACE INVESTIGATION INTELLIGENCE REPORT" in html
        print(f"[5] Printable HTML Report Document Generated ({len(html)} bytes).")

        # Create Complaint Draft
        complaint_payload = ComplaintCreate(
            investigation_id=inv.id,
            title=f"Request Review for Deceptive Domain {inv.domain}",
            category="Suspicious Website",
            description=""
        )
        complaint = create_complaint_draft(db, user.id, complaint_payload)
        print(f"[6] Complaint Draft Initialized: {complaint.complaint_identifier} (Status: {complaint.status})")

        # Update Complaint Draft Description
        update_payload = ComplaintUpdate(
            description="User reviewed automated risk signals and confirmed multiple suspicious domain structure flags."
        )
        updated_comp = update_complaint_draft(db, user.id, complaint.id, update_payload)
        assert "User reviewed" in updated_comp.description
        print(f"[7] Complaint Description Updated Successfully.")

        # Confirm Complaint Draft
        confirmed_comp = confirm_complaint_draft(db, user.id, complaint.id, True)
        assert confirmed_comp.status == "READY"
        assert confirmed_comp.user_confirmed is True
        print(f"[8] Complaint User Confirmation Recorded. Final Status: {confirmed_comp.status}")

        # Fetch Complaint Detail Payload
        c_detail = get_complaint_detail_payload(db, user.id, complaint.id)
        assert c_detail["declaration"] is not None
        print(f"[9] Complaint Detail Payload Verified: Declaration Present.")

        print("\n========================================================")
        print("[SUCCESS] ALL HIGH-RISK REPORT & COMPLAINT VERIFICATION TESTS PASSED CLEANLY!")
        print("========================================================\n")

    finally:
        db.close()

if __name__ == "__main__":
    test_workflow()
