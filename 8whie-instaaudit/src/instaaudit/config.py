"""
Configuration loader and validator for 8WHIE InstaAudit
"""

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional


@dataclass
class ServerConfig:
    host: str = "127.0.0.1"
    port: int = 8080
    rate_limit_per_minute: int = 5
    lockout_threshold: int = 3
    lockout_duration_seconds: int = 60
    session_timeout_seconds: int = 300

    @property
    def base_url(self) -> str:
        return f"http://{self.host}:{self.port}"


@dataclass
class TestingConfig:
    max_password_attempts: int = 5
    request_delay_seconds: float = 0.05
    timeout_seconds: float = 5.0
    stop_on_rate_limit: bool = True
    stop_on_lockout: bool = True


@dataclass
class LoggingConfig:
    level: str = "INFO"
    redact_secrets: bool = True
    log_to_file: bool = True
    log_file: str = "instaaudit.log"


class Config:
    def __init__(
        self,
        server: Optional[ServerConfig] = None,
        testing: Optional[TestingConfig] = None,
        logging: Optional[LoggingConfig] = None,
    ):
        self.server = server or ServerConfig()
        self.testing = testing or TestingConfig()
        self.logging = logging or LoggingConfig()

    @classmethod
    def load(cls, path: Optional[str] = None) -> "Config":
        if not path:
            return cls()
        p = Path(path)
        if not p.exists():
            return cls()
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)

        s_data = data.get("server", {})
        t_data = data.get("testing", {})
        l_data = data.get("logging", {})

        return cls(
            server=ServerConfig(**s_data),
            testing=TestingConfig(**t_data),
            logging=LoggingConfig(**l_data),
        )
