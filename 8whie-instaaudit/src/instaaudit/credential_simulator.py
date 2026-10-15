"""
Credential-Stuffing Simulation Engine for 8WHIE InstaAudit
Evaluates defense against credential replay and credential-stuffing patterns
strictly using synthetic test fixtures. Rejects external dumps.
"""

import time
from dataclasses import dataclass, field
from typing import Any, Dict, List
import requests
from instaaudit.validator import SafetyValidator


@dataclass
class CredentialStuffingResult:
    total_pairs_tested: int
    unique_usernames: int
    rate_limited_count: int
    lockout_count: int
    successful_count: int
    passwords_reused_detected: int
    defensive_score: str
    remediation_notes: List[str] = field(default_factory=list)


class CredentialSimulator:
    def __init__(
        self,
        target_url: str = "http://127.0.0.1:8080",
        max_pairs: int = 10,
        request_delay: float = 0.05,
    ):
        SafetyValidator.validate_target(target_url)
        self.target_url = target_url.rstrip("/")
        self.max_pairs = min(max_pairs, 30)
        self.request_delay = request_delay

    def simulate(self, credentials: List[Dict[str, str]]) -> CredentialStuffingResult:
        SafetyValidator.validate_target(self.target_url)
        # Validate that credentials are synthetic
        for item in credentials:
            u = item.get("username", "")
            if not (u.endswith(".test") or u.endswith(".local") or "@example" in u):
                raise ValueError(
                    f"Safety Violation: Non-synthetic credential detected '{u}'. "
                    "Only synthetic test accounts are permitted in 8WHIE InstaAudit."
                )

        pairs = credentials[:self.max_pairs]
        usernames = set(p["username"] for p in pairs)
        passwords = [p["password"] for p in pairs]
        reuse_detected = len(passwords) - len(set(passwords))

        rate_limited_count = 0
        lockout_count = 0
        successful_count = 0
        remediation_notes = []

        for pair in pairs:
            try:
                resp = requests.post(
                    f"{self.target_url}/login",
                    json={"username": pair["username"], "password": pair["password"]},
                    timeout=3.0,
                )
                if resp.status_code == 429:
                    rate_limited_count += 1
                elif resp.status_code == 423:
                    lockout_count += 1
                elif resp.status_code == 200:
                    successful_count += 1
            except requests.RequestException:
                pass

            time.sleep(self.request_delay)

        if rate_limited_count > 0 or lockout_count > 0:
            score = "DEFENDED"
            remediation_notes.append("Defensive controls triggered during simulated credential stuffing.")
        else:
            score = "NEEDS_HARDENING"
            remediation_notes.append("Implement IP and account rate limiting to mitigate distributed credential stuffing.")

        if reuse_detected > 0:
            remediation_notes.append("Credential dataset exhibits password reuse across distinct synthetic users.")

        return CredentialStuffingResult(
            total_pairs_tested=len(pairs),
            unique_usernames=len(usernames),
            rate_limited_count=rate_limited_count,
            lockout_count=lockout_count,
            successful_count=successful_count,
            passwords_reused_detected=reuse_detected,
            defensive_score=score,
            remediation_notes=remediation_notes,
        )
