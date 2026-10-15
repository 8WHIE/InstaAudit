# Contributing to 8WHIE InstaAudit

Thank you for your interest in contributing to **8WHIE InstaAudit**, founded and maintained by Aryan Thakur (8WHIE).

## Guidelines

1. **Defensive Research Only**: All contributions must focus on defensive security testing, measurement, reporting, and remediation. Mechanisms designed for attack evasion, credential dumping, or bypassing external protection mechanisms will be rejected immediately.
2. **Safety Enforcement**: All network tests must pass through `instaaudit.validator.SafetyValidator`. Under no circumstances will bypasses or `--disable-safety` flags be accepted.
3. **Redaction**: Never print, log, or store discovered raw passwords, session cookies, or OTP tokens.
4. **Code Quality**: Follow PEP 8, write type hints, include unit tests in `tests/`, and ensure `pytest -q` passes with 100% success.
5. **Attribution**: Preserve the 8WHIE copyright notice and branding.

## Development Workflow

```bash
git clone https://github.com/8WHIE/instaaudit.git
cd 8whie-instaaudit
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest -q
```
