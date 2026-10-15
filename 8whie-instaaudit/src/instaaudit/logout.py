"""
Logout Invalidation Auditor for 8WHIE InstaAudit
Validates that session tokens are completely revoked and cannot access protected resources post-logout.
"""

from dataclasses import dataclass, field
from typing import List
from instaaudit.mock_auth import MockAuthService


@dataclass
class LogoutAuditResult:
    session_revoked_on_server: bool
    protected_resource_blocked_post_logout: bool
    status: str
    findings: List[str] = field(default_factory=list)


class LogoutAuditor:
    def __init__(self, auth_service: MockAuthService):
        self.auth_service = auth_service

    def audit_logout_invalidation(self) -> LogoutAuditResult:
        findings = []

        # Login
        status, res = self.auth_service.login("alice@example.test", "AliceSecurePass!2026")
        session_id = res.get("session_id", "")

        # Verify active
        self.auth_service.get_session(session_id)

        # Logout
        l_status, _ = self.auth_service.logout(session_id)
        revoked = (l_status == 200 and session_id not in self.auth_service.sessions)

        # Re-probe protected resource
        p_status, _ = self.auth_service.get_session(session_id)
        blocked = (p_status == 401)

        if not revoked:
            findings.append("Session record still remains in server memory after logout invocation.")
        if not blocked:
            findings.append("Revoked session token was still permitted to query protected resources.")

        status_str = "PASS" if (revoked and blocked) else "FAIL"

        return LogoutAuditResult(
            session_revoked_on_server=revoked,
            protected_resource_blocked_post_logout=blocked,
            status=status_str,
            findings=findings,
        )
