"""
Redacting Security Logger for 8WHIE InstaAudit
Automatically redacts passwords, tokens, cookies, authorization secrets, and OTPs.
"""

import logging
import re
import sys
from typing import Optional

SENSITIVE_KEYS = ["password", "token", "otp", "cookie", "session_id", "authorization", "secret"]

REDACTION_REGEX = re.compile(
    r'(?i)\b(password|token|otp|cookie|session_id|authorization|secret)\b(\s*[:=]\s*["\']?)([^"\'\s,;]+)',
    re.IGNORECASE
)


class RedactingFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = REDACTION_REGEX.sub(r'\1\2[REDACTED]', record.msg)
        return True


def get_logger(name: str = "instaaudit", level: str = "INFO", log_file: Optional[str] = None) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    if not logger.handlers:
        console_handler = logging.StreamHandler(sys.stdout)
        fmt = logging.Formatter("[%(asctime)s] [%(levelname)s] [8WHIE-InstaAudit] %(message)s", "%Y-%m-%d %H:%M:%S")
        console_handler.setFormatter(fmt)
        console_handler.addFilter(RedactingFilter())
        logger.addHandler(console_handler)

        if log_file:
            file_handler = logging.FileHandler(log_file, encoding="utf-8")
            file_handler.setFormatter(fmt)
            file_handler.addFilter(RedactingFilter())
            logger.addHandler(file_handler)

    return logger
