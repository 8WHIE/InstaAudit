# 8WHIE InstaAudit — Authentication-Security Research & Training Laboratory

![8WHIE InstaAudit](https://img.shields.io/badge/Brand-8WHIE-blue.svg)
![Founder-Aryan_Thakur](https://img.shields.io/badge/Founder-Aryan%20Thakur-red.svg)
![Category](https://img.shields.io/badge/Category-Security%20Research%20%26%20Development-black.svg)
![Python](https://img.shields.io/badge/Python-3.10%2B-green.svg)
![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)
![Coverage](https://img.shields.io/badge/Tests-21%2F21%20Passing-success.svg)

**8WHIE InstaAudit** is an original, defensive authentication-security research and training framework created by **Aryan Thakur (8WHIE)**. The platform provides a laboratory where attack-like authentication scenarios can be safely reproduced against synthetic accounts and an explicitly authorized local test environment (`localhost`, `127.0.0.1`, `::1`), producing defensive measurements, security logging, audit findings, and remediation guidance.

---

## 🏛️ Brand & Attribution

- **Brand**: **8WHIE**
- **Project**: **InstaAudit**
- **Founder & Owner**: **Aryan Thakur**
- **Category**: Security Research & Development
- **Copyright**: Copyright (c) 2026 Aryan Thakur — 8WHIE.

### Official Profiles & Channels
- **Instagram — 8WHIE Brand**: [https://www.instagram.com/8WHIE_/](https://www.instagram.com/8WHIE_/)
- **Instagram — Aryan Thakur**: [https://www.instagram.com/imarykt/](https://www.instagram.com/imarykt/)
- **Telegram — 8WHIE Channel**: [https://t.me/whiee](https://t.me/whiee)
- **Telegram — Contact**: [https://t.me/Iaaryan](https://t.me/Iaaryan)
- **YouTube — 8WHIE**: [https://www.youtube.com/@8WHIE](https://www.youtube.com/@8WHIE)
- **GitHub — 8WHIE**: [https://github.com/8WHIE](https://github.com/8WHIE)

> **Disclaimer**: 8WHIE InstaAudit is an independent defensive security research laboratory. It is NOT affiliated with, sponsored by, or endorsed by Instagram, Meta Platforms, Inc., or any third-party company. All simulations execute exclusively against local synthetic loopback targets.

---

## 🛡️ Architecture & Security Model

8WHIE InstaAudit enforces a strict two-layer architecture:

### Layer A — Defensive Security Testing
- **Authentication Testing**: Verification of valid/invalid logins, generic error handling.
- **Password-Policy Auditing**: Length, entropy, character distribution, sequence detection, and breach-wordlist matching.
- **Rate-Limit Testing**: Burst threshold detection, HTTP 429 compliance, and `Retry-After` header analysis.
- **Account-Lockout Testing**: Consecutive failure thresholds, lockout recovery timers.
- **MFA Challenge Testing**: Valid OTP, expired OTP, OTP reuse prevention, and MFA exhaustion lockout.
- **CAPTCHA Testing**: Challenge issuance, solution validation, and retry exhaustion locks.
- **Session Security**: Session token entropy, session invalidation, and idle timeouts.
- **Logout Testing**: Server-side token revocation and post-logout access blocking.
- **HTTP & Cookie Analysis**: `HttpOnly`, `Secure`, `SameSite`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Cache-Control`.
- **Account Enumeration Resistance**: Timing analysis and response payload consistency between existing and non-existing accounts.
- **Role-Based Authorization (RBAC)**: Access tier boundaries between `user`, `moderator`, and `admin`.

### Layer B — Controlled Attack Simulation (Strictly Local)
- **Safe Targets Only**: `localhost`, `127.0.0.1`, `::1`.
- **Hard Safety Validator**: Programmatically halts execution if a public domain or remote host is specified.
- **Simulations Provided**: Bounded password-guessing, synthetic credential stuffing, high-cadence bot traffic, and concurrent authentication requests.
- **Strict Non-Features**: Does **NOT** contain mechanisms for bypassing MFA, bypassing CAPTCHA, stealing credentials, stealing session cookies, evading rate limits, rotating IPs/proxies/Tor, or targeting external platforms.
- **Redaction Engine**: Passwords, OTPs, tokens, and cookies are automatically redacted from console logs and SQLite databases.

---

## 🚀 Installation & Setup

### Standard Linux / macOS / Kali Linux
```bash
# Clone repository
git clone https://github.com/8WHIE/instaaudit.git
cd 8whie-instaaudit

# Execute automated setup script (creates .venv, installs dependencies, runs tests)
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Manual Installation
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e .
pytest -q
```

---

## 💻 CLI Command Reference

| Command | Description |
|---|---|
| `instaaudit --help` | Display CLI usage and subcommands |
| `instaaudit --version` | Display current framework version |
| `instaaudit mock-server start` | Start local synthetic authentication server |
| `instaaudit mock-server status` | Query health status of local mock server |
| `instaaudit accounts list` | View registered synthetic test accounts |
| `instaaudit accounts create` | Create a new synthetic account |
| `instaaudit policy-check --password <PWD>` | Audit password complexity and entropy |
| `instaaudit password-test` | Run bounded password guessing simulation |
| `instaaudit credential-test` | Simulate credential stuffing with synthetic pairs |
| `instaaudit bot-test` | Test defenses against non-human login cadence |
| `instaaudit mfa-test` | Validate multi-factor authentication controls |
| `instaaudit captcha-test` | Audit synthetic CAPTCHA challenge mechanics |
| `instaaudit rate-limit-test` | Test burst request thresholds and HTTP 429 |
| `instaaudit lockout-test` | Test consecutive failure account lockout |
| `instaaudit session-test` | Audit session ID entropy and idle timeout |
| `instaaudit logout-test` | Verify post-logout token invalidation |
| `instaaudit enumeration-test` | Verify account enumeration resistance |
| `instaaudit authorization-test` | Validate RBAC boundaries (user vs admin) |
| `instaaudit http-audit` | Audit HTTP status codes and content types |
| `instaaudit cookie-audit` | Check HttpOnly, SameSite, and Secure flags |
| `instaaudit header-audit` | Audit defensive HTTP security headers |
| `instaaudit full-audit` | Run full consolidated audit and export reports |
| `instaaudit session list` | View past audit records stored in SQLite |
| `instaaudit session show <ID>` | View details of a specific audit session |

---

## 🧪 Synthetic Test Accounts

The local lab uses predefined, safe synthetic fixtures:

| Account | Role | MFA | Initial State |
|---|---|---|---|
| `alice@example.test` | `user` | No | Active |
| `bob@example.test` | `moderator` | No | Active |
| `mfa@example.test` | `user` | Yes (`8W7721`) | Active |
| `locked@example.test` | `user` | No | Pre-Locked |
| `admin@example.test` | `admin` | Yes (`8W9900`) | Privileged |
| `bot-001@example.test` | `user` | No | Bot fixture |

---

## 📊 Full Audit Output Example

```text
8WHIE InstaAudit Results
====================================
Authentication         PASS
Password Policy        PASS
Password Simulation    PASS
Credential Simulation  PASS
Bot Simulation         PASS
Rate Limiting          PASS
Lockout                PASS
MFA                    PASS
CAPTCHA                PASS
Sessions               PASS
Logout                 PASS
Enumeration            PASS
Authorization          PASS
HTTP Security          PASS
Headers                PASS
Cookies                WARNING
Logging                PASS
====================================
Findings: 1
Critical: 0
High:     0
Medium:   0
Low:      1
====================================

[+] Audit session stored to SQLite: audit_3f1a9b2c
[+] Consolidated reports exported: audit_report.json, audit_report.csv
```

---

## 🔒 Security Model & Responsible Use Policy

1. **Local Test Environment Only**: Network requests are strictly limited to `localhost`, `127.0.0.1`, and `::1`.
2. **Defensive Focus**: The objective is assessing, measuring, and hardening defensive controls.
3. **No Credential Exfiltration**: Secrets, passwords, OTPs, and tokens are scrubbed before logging or persistent storage.
4. **Zero Exploitation Features**: No evasion mechanisms, no distributed proxies, and no target brute-force bypasses.

---

## 📜 License & Copyright

Released under the **MIT License**.
Copyright (c) 2026 **Aryan Thakur — 8WHIE**.
