from typing import List, Dict, Any, Tuple

class RiskEngine:
    @staticmethod
    def calculate_risk(signals: List[Dict[str, Any]]) -> Tuple[int, str, str]:
        """
        Calculates total score (0-100), risk level (LOW, MEDIUM, HIGH, CRITICAL), and summary string.
        """
        total_score = 0
        detected_signals = []

        for signal in signals:
            if signal.get("detected") and signal.get("availability") == "AVAILABLE":
                weight = signal.get("weight", 0)
                total_score += weight
                detected_signals.append(signal)

        # Cap score at 100
        final_score = min(total_score, 100)

        # Determine Risk Level
        if final_score >= 80:
            risk_level = "CRITICAL"
        elif final_score >= 60:
            risk_level = "HIGH"
        elif final_score >= 30:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Generate Executive Summary
        detected_count = len(detected_signals)
        total_count = len(signals)

        if detected_count == 0:
            summary = (
                f"Automated risk analysis completed with zero active threat indicators detected. "
                f"The target entity demonstrated clean URL structure and standard technical configurations (Risk Score: {final_score}/100 - {risk_level})."
            )
        else:
            top_reasons = [s["signal_name"] for s in sorted(detected_signals, key=lambda x: x["weight"], reverse=True)[:3]]
            reasons_str = ", ".join(top_reasons)
            summary = (
                f"Analysis detected {detected_count} risk indicator(s) out of {total_count} evaluated signals. "
                f"Primary risk drivers include: {reasons_str} (Overall Risk Score: {final_score}/100 - {risk_level})."
            )

        return final_score, risk_level, summary
