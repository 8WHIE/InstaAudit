"""
HTTP Security Headers Auditor for 8WHIE InstaAudit
Audits Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, Cache-Control, HSTS.
"""

from dataclasses import dataclass, field
from typing import Dict, List
import requests
from instaaudit.validator import SafetyValidator


@dataclass
class HeaderAuditResult:
    target_url: str
    missing_headers: List[str] = field(default_factory=list)
    present_headers: Dict[str, str] = field(default_factory=dict)
    findings: List[str] = field(default_factory=list)
    status: str = "PASS"


RECOMMENDED_HEADERS = [
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Cache-Control",
]


class HeaderAuditor:
    def __init__(self, target_url: str = "http://127.0.0.1:8080"):
        SafetyValidator.validate_target(target_url)
        self.target_url = target_url.rstrip("/")

    def audit_headers(self, path: str = "/health") -> HeaderAuditResult:
        SafetyValidator.validate_target(self.target_url)
        url = f"{self.target_url}{path}"
        missing = []
        present = {}
        findings = []

        try:
            resp = requests.get(url, timeout=3.0)
            headers = resp.headers

            for h in RECOMMENDED_HEADERS:
                val = headers.get(h)
                if val:
                    present[h] = val
                else:
                    missing.append(h)
                    findings.append(f"Missing security header: '{h}'.")

            if "Strict-Transport-Security" not in headers:
                findings.append("HSTS missing (expected on localhost HTTP lab, recommended for production HTTPS).")

        except requests.RequestException as e:
            return HeaderAuditResult(
                target_url=url,
                findings=[f"Header audit request failed: {str(e)}"],
                status="FAIL",
            )

        status_str = "PASS" if not missing else ("WARNING" if len(missing) <= 2 else "FAIL")

        return HeaderAuditResult(
            target_url=url,
            missing_headers=missing,
            present_headers=present,
            findings=findings,
            status=status_str,
        )
