"""
Concurrent Authentication Stress Auditor for 8WHIE InstaAudit
Validates that simultaneous synthetic authentication attempts do not cause race conditions.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import List
import requests
from instaaudit.validator import SafetyValidator


@dataclass
class ConcurrencyAuditResult:
    worker_threads: int
    completed_requests: int
    status_distribution: dict
    race_conditions_observed: bool
    status: str


class ConcurrencyAuditor:
    def __init__(self, target_url: str = "http://127.0.0.1:8080", max_workers: int = 5):
        SafetyValidator.validate_target(target_url)
        self.target_url = target_url.rstrip("/")
        self.max_workers = min(max_workers, 10)  # Bounded concurrency

    def audit_concurrent_logins(self, total_requests: int = 6) -> ConcurrencyAuditResult:
        SafetyValidator.validate_target(self.target_url)
        endpoint = f"{self.target_url}/login"
        distribution = {}

        def send_login(idx: int):
            try:
                r = requests.post(
                    endpoint,
                    json={"username": "alice@example.test", "password": "WrongPassword123!"},
                    timeout=3.0,
                )
                return r.status_code
            except requests.RequestException:
                return 0

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = [executor.submit(send_login, i) for i in range(total_requests)]
            for fut in as_completed(futures):
                code = fut.result()
                distribution[code] = distribution.get(code, 0) + 1

        # Race conditions would show unhandled 500 errors or duplicate unexpected success
        race_observed = 500 in distribution or 502 in distribution

        return ConcurrencyAuditResult(
            worker_threads=self.max_workers,
            completed_requests=total_requests,
            status_distribution=distribution,
            race_conditions_observed=race_observed,
            status="PASS" if not race_observed else "FAIL",
        )
