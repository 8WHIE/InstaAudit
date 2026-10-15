"""
Account Lockout Testing Engine for 8WHIE InstaAudit
Validates consecutive failure lockout thresholds and resistance to brute-force locking.
"""

import time
from dataclasses import dataclass, field
from typing import List
import requests
from instaaudit.validator import SafetyValidator


@dataclass
class LockoutTestResult:
    target_username: str
    failures_sent: int
    lockout_achieved: bool
    status: str  # "PASS", "FAIL"
    findings: List[str] = field(default_factory=list)
    recommendation: str = ""


class LockoutAuditor:
    def __init__(self, target_url: str = "http://127.0.0.1:8080"):
        SafetyValidator.validate_target(target_url)
        self.target_url = target_url.rstrip("/")

    def audit_account_lockout(
        self,
        username: str = "alice@example.test",
        max_probes: int = 6
    ) -> LockoutTestResult:
        SafetyValidator.validate_target(self.target_url)
        max_probes = min(max_probes, 10)
        lockout = False
        findings = []

        endpoint = f"{self.target_url}/login"

        for i in range(max_probes):
            try:
                resp = requests.post(
                    endpoint,
                    json={"username": username, "password": f"InvalidPassword_{i}!"},
                    timeout=2.0,
                )
                if resp.status_code == 423 or resp.json().get("status") == "account_locked":
                    lockout = True
                    break
            except requests.RequestException:
                pass
            time.sleep(0.02)

        if lockout:
            status = "PASS"
            rec = "Maintain progressive delay and temporary lockouts on consecutive authentication failures."
        else:
            status = "FAIL"
            findings.append(f"Account '{username}' was not locked after {max_probes} consecutive failed logins.")
            rec = "Enforce temporary lockout (e.g. 5 failures -> 15-minute lockout) with secure unlock workflows."

        return LockoutTestResult(
            target_username=username,
            failures_sent=i + 1,
            lockout_achieved=lockout,
            status=status,
            findings=findings,
            recommendation=rec,
        )
