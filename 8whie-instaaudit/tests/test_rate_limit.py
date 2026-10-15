"""Tests for Rate Limiting Auditor"""
from instaaudit.mock_auth import MockAuthService
from instaaudit.mock_server import MockServer
from instaaudit.rate_limit import RateLimitAuditor


def test_rate_limit_detection():
    svc = MockAuthService(rate_limit_per_minute=4)
    server = MockServer(port=8893, auth_service=svc)
    server.start()
    try:
        auditor = RateLimitAuditor(target_url="http://127.0.0.1:8893")
        res = auditor.audit_login_rate_limit(burst_count=7)
        assert res.requests_sent == 7
        assert res.rate_limited_count > 0
        assert res.status in ("PASS", "WARNING")
    finally:
        server.stop()
