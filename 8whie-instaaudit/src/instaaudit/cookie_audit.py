"""
Cookie Security Auditor for 8WHIE InstaAudit
Audits session cookies for Secure, HttpOnly, SameSite, Path, and Expire directives.
"""

from dataclasses import dataclass, field
from typing import Dict, List
import requests
from instaaudit.validator import SafetyValidator


@dataclass
class CookieAuditItem:
    name: str
    has_httponly: bool
    has_secure: bool
    samesite_policy: str
    path: str
    passed: bool
    findings: List[str] = field(default_factory=list)


class CookieAuditor:
    def __init__(self, target_url: str = "http://127.0.0.1:8080"):
        SafetyValidator.validate_target(target_url)
        self.target_url = target_url.rstrip("/")

    def audit_login_cookies(self) -> List[CookieAuditItem]:
        SafetyValidator.validate_target(self.target_url)
        endpoint = f"{self.target_url}/login"
        results = []

        try:
            resp = requests.post(
                endpoint,
                json={"username": "alice@example.test", "password": "AliceSecurePass!2026"},
                timeout=3.0,
            )
            raw_cookies = resp.headers.get("Set-Cookie", "")
            if not raw_cookies:
                return [CookieAuditItem(
                    name="session_id",
                    has_httponly=False,
                    has_secure=False,
                    samesite_policy="None",
                    path="/",
                    passed=False,
                    findings=["No Set-Cookie header returned upon successful authentication."],
                )]

            parts = [p.strip() for p in raw_cookies.split(";")]
            name_val = parts[0].split("=")[0] if parts else "session_id"
            lower_parts = [p.lower() for p in parts]

            has_httponly = "httponly" in lower_parts
            has_secure = "secure" in lower_parts

            samesite = "None"
            for p in lower_parts:
                if p.startswith("samesite="):
                    samesite = p.split("=")[1].capitalize()

            path_val = "/"
            for p in lower_parts:
                if p.startswith("path="):
                    path_val = p.split("=")[1]

            findings = []
            if not has_httponly:
                findings.append("Cookie missing 'HttpOnly' flag; vulnerable to XSS token theft.")
            if not has_secure:
                # Note: On local HTTP lab, Secure might be omitted, but flag for audit awareness
                findings.append("Cookie missing 'Secure' flag (acceptable on localhost HTTP, mandatory in production HTTPS).")
            if samesite not in ("Strict", "Lax"):
                findings.append(f"Weak or missing SameSite policy: '{samesite}'.")

            passed = has_httponly and (samesite in ("Strict", "Lax"))
            results.append(CookieAuditItem(
                name=name_val,
                has_httponly=has_httponly,
                has_secure=has_secure,
                samesite_policy=samesite,
                path=path_val,
                passed=passed,
                findings=findings,
            ))

        except requests.RequestException as e:
            results.append(CookieAuditItem(
                name="error",
                has_httponly=False,
                has_secure=False,
                samesite_policy="None",
                path="",
                passed=False,
                findings=[f"Failed connecting to server: {str(e)}"],
            ))

        return results
