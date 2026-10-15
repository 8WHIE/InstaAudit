"""
HTTP Security Auditor for 8WHIE InstaAudit
Audits status codes, redirects, content types, error handling, and security properties.
"""

from dataclasses import dataclass, field
from typing import Dict, List
import requests
from instaaudit.validator import SafetyValidator


@dataclass
class HttpAuditResult:
    target_url: str
    status_code: int
    content_type: str
    is_json: bool
    redirect_count: int
    findings: List[str] = field(default_factory=list)


class HttpAuditor:
    def __init__(self, target_url: str = "http://127.0.0.1:8080"):
        SafetyValidator.validate_target(target_url)
        self.target_url = target_url.rstrip("/")

    def audit_endpoint(self, path: str = "/health") -> HttpAuditResult:
        SafetyValidator.validate_target(self.target_url)
        url = f"{self.target_url}{path}"
        findings = []

        try:
            resp = requests.get(url, timeout=3.0, allow_redirects=True)
            status = resp.status_code
            ctype = resp.headers.get("Content-Type", "")
            is_json = "application/json" in ctype
            redirects = len(resp.history)

            if not is_json and path in ("/session", "/login", "/health"):
                findings.append(f"Endpoint '{path}' did not return application/json content type.")

            if resp.status_code >= 500:
                findings.append(f"Server error {resp.status_code} received from '{path}'.")

        except requests.RequestException as e:
            return HttpAuditResult(
                target_url=url,
                status_code=0,
                content_type="",
                is_json=False,
                redirect_count=0,
                findings=[f"Failed to connect to endpoint: {str(e)}"],
            )

        return HttpAuditResult(
            target_url=url,
            status_code=status,
            content_type=ctype,
            is_json=is_json,
            redirect_count=redirects,
            findings=findings,
        )
