"""
Synthetic CAPTCHA Challenge Auditor for 8WHIE InstaAudit
Validates challenge issuance, expiration, failed retries, and exhaustion locks.
Does NOT contain CAPTCHA solvers or bypasses.
"""

from dataclasses import dataclass
from typing import List
from instaaudit.mock_auth import MockAuthService


@dataclass
class CaptchaTestResult:
    test_name: str
    passed: bool
    status_code: int
    details: str


class CaptchaAuditor:
    def __init__(self, auth_service: MockAuthService):
        self.auth_service = auth_service

    def run_all_captcha_tests(self) -> List[CaptchaTestResult]:
        results = []

        # 1. Challenge issuance
        challenge = self.auth_service.create_captcha_challenge()
        cid = challenge["challenge_id"]
        results.append(CaptchaTestResult(
            test_name="Challenge Generation",
            passed=bool(cid and challenge.get("question")),
            status_code=200,
            details="Synthetic CAPTCHA generated with valid challenge_id"
        ))

        # 2. Valid solution
        st_val, _ = self.auth_service.verify_captcha(cid, "8WHIE-SAFE")
        results.append(CaptchaTestResult(
            test_name="Valid Solution Acceptance",
            passed=(st_val == 200),
            status_code=st_val,
            details="Correct synthetic response verified challenge"
        ))

        # 3. Invalid solution rejection
        ch2 = self.auth_service.create_captcha_challenge()
        cid2 = ch2["challenge_id"]
        st_bad, _ = self.auth_service.verify_captcha(cid2, "INCORRECT_GUESS")
        results.append(CaptchaTestResult(
            test_name="Incorrect Solution Rejection",
            passed=(st_bad == 401),
            status_code=st_bad,
            details="Incorrect CAPTCHA solution correctly blocked"
        ))

        # 4. Retry limit exhaustion
        for _ in range(4):
            self.auth_service.verify_captcha(cid2, "FAIL")
        st_lock, _ = self.auth_service.verify_captcha(cid2, "8WHIE-SAFE")
        results.append(CaptchaTestResult(
            test_name="CAPTCHA Attempt Exhaustion",
            passed=(st_lock == 423 or st_lock == 400),
            status_code=st_lock,
            details="Exceeded attempts triggers lock or challenge invalidation"
        ))

        return results
