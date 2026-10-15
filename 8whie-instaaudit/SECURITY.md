# Security Policy — 8WHIE InstaAudit

## Responsible Use & Scope Policy

8WHIE InstaAudit is engineered strictly for **defensive authentication-security research, hardening, and training** against synthetic accounts and an explicitly authorized local test environment (`localhost`, `127.0.0.1`, `::1`).

### Strict Safety Guardrails
- **No Remote Exploitation**: The software programmatically blocks execution against public domain names, cloud endpoints, and production networks (including Instagram / Meta / Google / Microsoft).
- **No Evasion Techniques**: The framework strictly excludes IP rotation, CAPTCHA bypasses, MFA interception, session hijacking, or credential extraction.
- **Redaction by Design**: Passwords, tokens, OTPs, and authorization headers are scrubbed before reaching console logs, SQLite records, and export reports.

## Reporting a Vulnerability

If you discover a security vulnerability or boundary bypass in 8WHIE InstaAudit, please report it privately:

- **Contact**: Aryan Thakur
- **Telegram**: [https://t.me/Iaaryan](https://t.me/Iaaryan)
- **Channel**: [https://t.me/whiee](https://t.me/whiee)
- **Instagram**: [https://www.instagram.com/imarykt/](https://www.instagram.com/imarykt/)

We will respond promptly within 48 hours to assess and patch the issue.
