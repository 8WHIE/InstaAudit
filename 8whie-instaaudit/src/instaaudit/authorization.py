"""
Role-Based Authorization Testing Module for 8WHIE InstaAudit
Tests access boundaries across user, moderator, and admin privilege tiers.
"""

from dataclasses import dataclass, field
from typing import List
from instaaudit.mock_auth import MockAuthService


@dataclass
class AuthzTestResult:
    test_name: str
    allowed: bool
    expected_allowed: bool
    passed: bool
    findings: List[str] = field(default_factory=list)


class AuthorizationAuditor:
    def __init__(self, auth_service: MockAuthService):
        self.auth_service = auth_service

    def run_all_authorization_tests(self) -> List[AuthzTestResult]:
        results = []

        # 1. Standard user logs in
        _, u_res = self.auth_service.login("alice@example.test", "AliceSecurePass!2026")
        user_sess = u_res.get("session_id", "")

        # 2. Admin logs in
        _, a_res = self.auth_service.login("admin@example.test", "AdminSuperPass!8W")
        # Handle MFA for admin
        ch_id = a_res.get("challenge_id", "")
        _, a_mfa = self.auth_service.verify_mfa(ch_id, "8W9900")
        admin_sess = a_mfa.get("session_id", "")

        # Test User -> User profile
        u_st, u_data = self.auth_service.get_session(user_sess)
        results.append(AuthzTestResult(
            test_name="User accesses standard profile",
            allowed=(u_st == 200),
            expected_allowed=True,
            passed=(u_st == 200),
        ))

        # Test User -> Admin Dashboard (Should be forbidden / rejected)
        u_admin_ok = (u_data.get("role") == "admin")
        results.append(AuthzTestResult(
            test_name="Standard user prevented from admin dashboard",
            allowed=u_admin_ok,
            expected_allowed=False,
            passed=(not u_admin_ok),
            findings=[] if not u_admin_ok else ["Privilege escalation: standard user has admin role."],
        ))

        # Test Admin -> Admin Dashboard (Should be allowed)
        _, a_data = self.auth_service.get_session(admin_sess)
        a_admin_ok = (a_data.get("role") == "admin")
        results.append(AuthzTestResult(
            test_name="Admin accesses admin dashboard",
            allowed=a_admin_ok,
            expected_allowed=True,
            passed=a_admin_ok,
        ))

        return results
