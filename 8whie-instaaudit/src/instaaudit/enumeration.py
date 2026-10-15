"""
Account Enumeration Resistance Auditor for 8WHIE InstaAudit
Measures status codes, response bodies, and timing differences between valid and invalid usernames.
"""

import time
from dataclasses import dataclass, field
from typing import List
import requests
from instaaudit.validator import SafetyValidator


@dataclass
class EnumerationAuditResult:
    status_consistent: bool
    response_body_consistent: bool
    timing_delta_ms: float
    resistance_status: str  # "PASS", "WARNING", "FAIL"
    findings: List[str] = field(default_factory=list)


class EnumerationAuditor:
    def __init__(self, target_url: str = "http://127.0.0.1:8080"):
        SafetyValidator.validate_target(target_url)
        self.target_url = target_url.rstrip("/")

    def audit_enumeration_resistance(
        self,
        existing_user: str = "alice@example.test",
        non_existing_user: str = "nonexistent_fake_99@example.test"
    ) -> EnumerationAuditResult:
        SafetyValidator.validate_target(self.target_url)
        endpoint = f"{self.target_url}/login"
        findings = []

        # Probe existing user with wrong password
        t0 = time.perf_counter()
        r_exist = requests.post(endpoint, json={"username": existing_user, "password": "WrongPassword1!"}, timeout=3.0)
        t_exist = (time.perf_counter() - t0) * 1000

        # Probe non-existing user with wrong password
        t1 = time.perf_counter()
        r_non = requests.post(endpoint, json={"username": non_existing_user, "password": "WrongPassword1!"}, timeout=3.0)
        t_non = (time.perf_counter() - t1) * 1000

        # Compare status codes
        status_consistent = (r_exist.status_code == r_non.status_code)
        if not status_consistent:
            findings.append(
                f"Status code mismatch: Existing user got {r_exist.status_code}, non-existing got {r_non.status_code}."
            )

        # Compare response body structure / error message
        body_exist = r_exist.text.strip()
        body_non = r_non.text.strip()
        body_consistent = (body_exist == body_non)
        if not body_consistent:
            findings.append("Response content or error text differs between valid and invalid usernames.")

        timing_delta = abs(t_exist - t_non)
        if timing_delta > 150.0:
            findings.append(f"Noticeable timing discrepancy observed: {timing_delta:.1f}ms delta.")

        if status_consistent and body_consistent and timing_delta <= 150.0:
            resistance = "PASS"
        elif status_consistent and body_consistent:
            resistance = "WARNING"
        else:
            resistance = "FAIL"

        return EnumerationAuditResult(
            status_consistent=status_consistent,
            response_body_consistent=body_consistent,
            timing_delta_ms=round(timing_delta, 2),
            resistance_status=resistance,
            findings=findings,
        )
