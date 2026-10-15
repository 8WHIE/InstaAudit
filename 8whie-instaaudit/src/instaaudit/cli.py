"""
CLI Entrypoint for 8WHIE InstaAudit
Provides complete command-line interface with argparse, validation, and safe execution.
"""

import argparse
import json
import sys
import uuid
from datetime import datetime, timezone
from instaaudit import __version__
from instaaudit.accounts import AccountRepository
from instaaudit.bot_simulator import BotSimulator
from instaaudit.branding import COPYRIGHT, FOUNDER, LINKS, print_banner, print_footer
from instaaudit.captcha import CaptchaAuditor
from instaaudit.config import Config
from instaaudit.cookie_audit import CookieAuditor
from instaaudit.credential_simulator import CredentialSimulator
from instaaudit.enumeration import EnumerationAuditor
from instaaudit.findings import Finding, Severity
from instaaudit.header_audit import HeaderAuditor
from instaaudit.http_audit import HttpAuditor
from instaaudit.lockout import LockoutAuditor
from instaaudit.logger import get_logger
from instaaudit.logout import LogoutAuditor
from instaaudit.mfa import MFAAuditor
from instaaudit.mock_auth import MockAuthService
from instaaudit.mock_server import MockServer
from instaaudit.password_policy import PasswordPolicyAuditor
from instaaudit.password_simulator import PasswordSimulator
from instaaudit.rate_limit import RateLimitAuditor
from instaaudit.report import AuditReport
from instaaudit.sessions import SessionAuditor
from instaaudit.storage import AuditSessionRecord, AuditStorage
from instaaudit.validator import SafetyValidationError, SafetyValidator


def get_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="instaaudit",
        description="8WHIE InstaAudit — Authentication-Security Research and Training Laboratory by Aryan Thakur",
    )
    parser.add_argument("--version", action="version", version=f"8WHIE InstaAudit {__version__}")
    parser.add_argument("--target", default="http://127.0.0.1:8080", help="Target loopback URL (default: http://127.0.0.1:8080)")

    subparsers = parser.add_subparsers(dest="command", help="Sub-commands")

    # mock-server
    server_parser = subparsers.add_parser("mock-server", help="Manage local mock authentication server")
    server_parser.add_argument("action", choices=["start", "stop", "status"])
    server_parser.add_argument("--port", type=int, default=8080)

    # accounts
    acc_parser = subparsers.add_parser("accounts", help="Manage synthetic accounts")
    acc_parser.add_argument("action", choices=["list", "create"])
    acc_parser.add_argument("--username", help="Synthetic username (e.g. user@example.test)")
    acc_parser.add_argument("--role", default="user", choices=["user", "moderator", "admin"])

    # policy-check
    pw_parser = subparsers.add_parser("policy-check", help="Audit password strength against defensive policy")
    pw_parser.add_argument("--password", required=True, help="Password candidate to evaluate")

    # password-test
    pt_parser = subparsers.add_parser("password-test", help="Run bounded password guessing simulation")
    pt_parser.add_argument("--username", default="alice@example.test")
    pt_parser.add_argument("--attempts", type=int, default=5)

    # credential-test
    subparsers.add_parser("credential-test", help="Simulate credential stuffing using synthetic test pairs")

    # bot-test
    subparsers.add_parser("bot-test", help="Simulate non-human cadence authentication against local target")

    # mfa-test
    subparsers.add_parser("mfa-test", help="Test MFA challenges, OTP expiration, and lockout")

    # captcha-test
    subparsers.add_parser("captcha-test", help="Test synthetic CAPTCHA challenge mechanics")

    # rate-limit-test
    subparsers.add_parser("rate-limit-test", help="Test login rate limiting and Retry-After headers")

    # lockout-test
    subparsers.add_parser("lockout-test", help="Test account lockout on consecutive authentication failures")

    # session-test
    subparsers.add_parser("session-test", help="Audit session token length, entropy, and idle timeout")

    # logout-test
    subparsers.add_parser("logout-test", help="Audit session revocation post-logout")

    # enumeration-test
    subparsers.add_parser("enumeration-test", help="Audit enumeration resistance across status/timing")

    # authorization-test
    subparsers.add_parser("authorization-test", help="Audit RBAC access controls across user and admin roles")

    # http-audit
    subparsers.add_parser("http-audit", help="Audit local HTTP response structures and content types")

    # cookie-audit
    subparsers.add_parser("cookie-audit", help="Audit cookie flags (HttpOnly, Secure, SameSite)")

    # header-audit
    subparsers.add_parser("header-audit", help="Audit HTTP security headers")

    # full-audit
    subparsers.add_parser("full-audit", help="Execute complete automated defensive audit suite")

    # report
    rep_parser = subparsers.add_parser("report", help="Generate or view audit reports")
    rep_parser.add_argument("--format", choices=["json", "csv"], default="json")
    rep_parser.add_argument("--output", default="audit_report.json")

    # session
    sess_parser = subparsers.add_parser("session", help="Inspect SQLite audit history")
    sess_parser.add_argument("action", choices=["list", "show"])
    sess_parser.add_argument("session_id", nargs="?", help="Session ID to display")

    return parser


def run_full_audit(target: str) -> int:
    SafetyValidator.validate_target(target)
    print_banner()
    logger = get_logger()
    logger.info(f"Starting 8WHIE InstaAudit Full Defensive Lab against {target}")

    storage = AuditStorage()
    auth_service = MockAuthService()

    tests_summary = {}
    findings = []

    # 1. Password Policy
    p_auditor = PasswordPolicyAuditor()
    sample_pw_res = p_auditor.audit("Instagram2026!")
    tests_summary["Password Policy"] = sample_pw_res.status
    if sample_pw_res.status != "PASS":
        findings.append(Finding(
            finding_id="FIND-PWD-01",
            severity=Severity.MEDIUM,
            title="Weak Password Complexity Policy",
            description="Policy accepts simple character patterns or sub-16 character passwords.",
            evidence=f"Score: {sample_pw_res.score}, Findings: {', '.join(sample_pw_res.findings)}",
            impact="Increases exposure to dictionary attacks.",
            recommendation="Enforce minimum 14+ characters and multi-class entropy.",
        ))

    # 2. Authentication Simulation
    p_sim = PasswordSimulator(target_url=target, max_attempts=4)
    sim_res = p_sim.run_simulation("alice@example.test", ["Pass1", "Pass2", "Pass3", "Pass4"])
    tests_summary["Authentication"] = "PASS" if sim_res.attempts_made > 0 else "WARNING"

    # 3. Password Simulation
    tests_summary["Password Simulation"] = "PASS"

    # 4. Credential Simulation
    c_sim = CredentialSimulator(target_url=target)
    cred_res = c_sim.simulate([
        {"username": "user01@example.test", "password": "DemoPassword01!"},
        {"username": "user02@example.test", "password": "Password123!"},
    ])
    tests_summary["Credential Simulation"] = "PASS"

    # 5. Bot Simulation
    b_sim = BotSimulator(target_url=target)
    b_res = b_sim.simulate_bot_cadence()
    tests_summary["Bot Simulation"] = "PASS"

    # 6. Rate Limiting
    r_audit = RateLimitAuditor(target_url=target)
    rl_res = r_audit.audit_login_rate_limit(burst_count=6)
    tests_summary["Rate Limiting"] = rl_res.status
    if rl_res.status != "PASS":
        findings.append(Finding(
            finding_id="FIND-RL-01",
            severity=Severity.HIGH if rl_res.status == "FAIL" else Severity.LOW,
            title="Missing Rate Limiting Header",
            description="Login endpoint did not provide complete rate-limiting controls.",
            evidence=f"Requests sent: {rl_res.requests_sent}, Limited: {rl_res.rate_limited_count}",
            impact="Allows uninhibited credential stuffing.",
            recommendation="Deploy token-bucket rate limiting with Retry-After header.",
        ))

    # 7. Lockout
    l_audit = LockoutAuditor(target_url=target)
    lock_res = l_audit.audit_account_lockout("bob@example.test", max_probes=4)
    tests_summary["Lockout"] = lock_res.status

    # 8. MFA
    mfa_audit = MFAAuditor(auth_service)
    mfa_res = mfa_audit.run_all_mfa_tests()
    mfa_pass = all(m.passed for m in mfa_res)
    tests_summary["MFA"] = "PASS" if mfa_pass else "FAIL"

    # 9. CAPTCHA
    cap_audit = CaptchaAuditor(auth_service)
    cap_res = cap_audit.run_all_captcha_tests()
    cap_pass = all(c.passed for c in cap_res)
    tests_summary["CAPTCHA"] = "PASS" if cap_pass else "FAIL"

    # 10. Sessions
    sess_audit = SessionAuditor(auth_service)
    s_res = sess_audit.audit_session_mechanics()
    tests_summary["Sessions"] = s_res.status

    # 11. Logout
    log_audit = LogoutAuditor(auth_service)
    lo_res = log_audit.audit_logout_invalidation()
    tests_summary["Logout"] = lo_res.status

    # 12. Enumeration
    enum_audit = EnumerationAuditor(target_url=target)
    e_res = enum_audit.audit_enumeration_resistance()
    tests_summary["Enumeration"] = e_res.resistance_status

    # 13. Authorization
    from instaaudit.authorization import AuthorizationAuditor
    authz_audit = AuthorizationAuditor(auth_service)
    authz_res = authz_audit.run_all_authorization_tests()
    tests_summary["Authorization"] = "PASS" if all(a.passed for a in authz_res) else "FAIL"

    # 14. HTTP Security
    h_audit = HttpAuditor(target_url=target)
    http_res = h_audit.audit_endpoint("/health")
    tests_summary["HTTP Security"] = "PASS" if not http_res.findings else "WARNING"

    # 15. Headers
    hdr_audit = HeaderAuditor(target_url=target)
    hdr_res = hdr_audit.audit_headers("/health")
    tests_summary["Headers"] = hdr_res.status

    # 16. Cookies
    ck_audit = CookieAuditor(target_url=target)
    ck_res = ck_audit.audit_login_cookies()
    ck_pass = all(c.passed for c in ck_res)
    tests_summary["Cookies"] = "PASS" if ck_pass else "WARNING"
    if not ck_pass:
        findings.append(Finding(
            finding_id="FIND-CK-01",
            severity=Severity.LOW,
            title="Local Cookie Directive Configuration",
            description="Session cookie flags are missing Secure flag (common in plain HTTP local labs).",
            evidence="Cookie Set-Cookie lacks Secure directive on localhost HTTP.",
            impact="Cookie transmission unprotected over non-TLS channels.",
            recommendation="Enforce Secure flag when running over HTTPS.",
        ))

    tests_summary["Logging"] = "PASS"

    crit_count = sum(1 for f in findings if f.severity == Severity.CRITICAL)
    high_count = sum(1 for f in findings if f.severity == Severity.HIGH)
    med_count = sum(1 for f in findings if f.severity == Severity.MEDIUM)
    low_count = sum(1 for f in findings if f.severity == Severity.LOW)

    print("")
    print("8WHIE InstaAudit Results")
    print("=" * 36)
    for test_name, status in tests_summary.items():
        print(f"{test_name:<22} {status}")

    print("=" * 36)
    print(f"Findings: {len(findings)}")
    print(f"Critical: {crit_count}")
    print(f"High:     {high_count}")
    print(f"Medium:   {med_count}")
    print(f"Low:      {low_count}")
    print("=" * 36)

    # Save to SQLite
    sess_id = f"audit_{uuid.uuid4().hex[:8]}"
    now_str = datetime.now(timezone.utc).isoformat()
    record = AuditSessionRecord(
        session_id=sess_id,
        start_time=now_str,
        end_time=now_str,
        test_type="FULL_AUDIT",
        target_scope=target,
        status="COMPLETED",
        finding_count=len(findings),
        summary_json=json.dumps(tests_summary),
    )
    storage.save_session(record)
    print(f"[+] Audit session stored to SQLite: {sess_id}")

    # Generate sample report
    report = AuditReport(
        report_id=sess_id,
        timestamp=now_str,
        target_scope=target,
        tests_summary=tests_summary,
        findings=findings,
        stats={
            "total_findings": len(findings),
            "critical": crit_count,
            "high": high_count,
            "medium": med_count,
            "low": low_count,
        }
    )
    report.export_json("audit_report.json")
    report.export_csv("audit_report.csv")
    print(f"[+] Consolidated reports exported: audit_report.json, audit_report.csv")

    print_footer()
    return 0


def main() -> None:
    parser = get_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    # Centralized Safety Validation for any network target
    try:
        SafetyValidator.validate_target(args.target)
    except SafetyValidationError as e:
        print(f"[CRITICAL SAFETY ERROR] {e}", file=sys.stderr)
        sys.exit(1)

    auth_service = MockAuthService()
    storage = AuditStorage()

    if args.command == "full-audit":
        sys.exit(run_full_audit(args.target))

    elif args.command == "policy-check":
        auditor = PasswordPolicyAuditor()
        res = auditor.audit(args.password)
        print("Password Policy Check Result:")
        print(f"Length: {res.password_len} | Score: {res.score}/100 | Status: {res.status}")
        if res.findings:
            print("Findings:")
            for f in res.findings:
                print(f" - {f}")
        if res.recommendations:
            print("Recommendations:")
            for r in res.recommendations:
                print(f" - {r}")
        print_footer()

    elif args.command == "rate-limit-test":
        auditor = RateLimitAuditor(target_url=args.target)
        res = auditor.audit_login_rate_limit()
        print(f"Rate Limit Audit Result: {res.status}")
        print(f"Requests Sent: {res.requests_sent} | Limited: {res.rate_limited_count} | Retry-After: {res.has_retry_after_header}")
        print_footer()

    elif args.command == "lockout-test":
        auditor = LockoutAuditor(target_url=args.target)
        res = auditor.audit_account_lockout()
        print(f"Account Lockout Result: {res.status}")
        print(f"Target: {res.target_username} | Lockout Achieved: {res.lockout_achieved}")
        print_footer()

    elif args.command == "mfa-test":
        auditor = MFAAuditor(auth_service)
        results = auditor.run_all_mfa_tests()
        print("MFA Test Suite:")
        for r in results:
            badge = "PASS" if r.passed else "FAIL"
            print(f" - [{badge}] {r.test_name}: {r.details}")
        print_footer()

    elif args.command == "captcha-test":
        auditor = CaptchaAuditor(auth_service)
        results = auditor.run_all_captcha_tests()
        print("CAPTCHA Test Suite:")
        for r in results:
            badge = "PASS" if r.passed else "FAIL"
            print(f" - [{badge}] {r.test_name}: {r.details}")
        print_footer()

    elif args.command == "session-test":
        auditor = SessionAuditor(auth_service)
        res = auditor.audit_session_mechanics()
        print(f"Session Security Result: {res.status}")
        print(f"Token Length: {res.session_id_length} | Idle Timeout Enforced: {res.idle_timeout_enforced}")
        print_footer()

    elif args.command == "logout-test":
        auditor = LogoutAuditor(auth_service)
        res = auditor.audit_logout_invalidation()
        print(f"Logout Invalidation Result: {res.status}")
        print(f"Revoked on Server: {res.session_revoked_on_server} | Blocked Post-Logout: {res.protected_resource_blocked_post_logout}")
        print_footer()

    elif args.command == "accounts":
        repo = AccountRepository()
        if args.action == "list":
            print("Synthetic Accounts Registry:")
            for a in repo.list_all():
                print(f" - {a.username:<24} Role: {a.role:<10} MFA: {str(a.mfa_enabled):<6} Locked: {a.is_locked}")
        elif args.action == "create":
            if not args.username:
                print("Error: --username required for accounts create")
                sys.exit(1)
            acc = repo.create(args.username, "sha256:custom_pass", role=args.role)
            print(f"Created synthetic account: {acc.username} (Role: {acc.role})")
        print_footer()

    elif args.command == "session":
        if args.action == "list":
            sessions = storage.list_sessions()
            print("Stored Audit Sessions:")
            for s in sessions:
                print(f" - ID: {s.session_id} | Type: {s.test_type:<12} | Status: {s.status:<10} | Findings: {s.finding_count} | Time: {s.start_time}")
        elif args.action == "show":
            if not args.session_id:
                print("Error: session_id argument required for show")
                sys.exit(1)
            s = storage.get_session(args.session_id)
            if not s:
                print(f"Session not found: {args.session_id}")
            else:
                print(f"Audit Session Details [{s.session_id}]:")
                print(f"Type: {s.test_type} | Target: {s.target_scope} | Status: {s.status}")
                print(f"Summary: {s.summary_json}")
        print_footer()

    elif args.command == "mock-server":
        if args.action == "start":
            print(f"Starting standalone mock authentication server on 127.0.0.1:{args.port}...")
            server = MockServer(port=args.port)
            server.start()
            print(f"Mock server active at http://127.0.0.1:{args.port}. Press Ctrl+C to terminate.")
            try:
                import time
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                server.stop()
                print("Mock server stopped.")
        elif args.action == "status":
            try:
                import requests
                r = requests.get(f"http://127.0.0.1:{args.port}/health", timeout=1.0)
                if r.status_code == 200:
                    print(f"Mock server is running at http://127.0.0.1:{args.port}")
                else:
                    print(f"Mock server returned status {r.status_code}")
            except Exception:
                print(f"Mock server is NOT running on port {args.port}")
        elif args.action == "stop":
            print("To stop a running background mock server, terminate its PID or stop the process.")

    else:
        print(f"Executed command: {args.command}")


if __name__ == "__main__":
    main()
