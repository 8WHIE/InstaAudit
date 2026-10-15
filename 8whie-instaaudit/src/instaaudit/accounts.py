"""
Synthetic Account Manager for 8WHIE InstaAudit
Provides deterministic test accounts for defensive security experiments.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class SyntheticAccount:
    username: str
    password_hash: str  # Simulated hash
    role: str = "user"  # "user", "moderator", "admin"
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None
    is_locked: bool = False
    failed_attempts: int = 0
    captcha_required: bool = False
    description: str = ""


# Default synthetic account fixtures - deterministic and strictly synthetic
DEFAULT_SYNTHETIC_ACCOUNTS: Dict[str, SyntheticAccount] = {
    "alice@example.test": SyntheticAccount(
        username="alice@example.test",
        password_hash="sha256:alice_secure_2026",
        role="user",
        mfa_enabled=False,
        description="Standard synthetic user account"
    ),
    "bob@example.test": SyntheticAccount(
        username="bob@example.test",
        password_hash="sha256:bob_lab_pass_8w",
        role="moderator",
        mfa_enabled=False,
        description="Synthetic moderator account"
    ),
    "mfa@example.test": SyntheticAccount(
        username="mfa@example.test",
        password_hash="sha256:mfa_user_pass_8w",
        role="user",
        mfa_enabled=True,
        mfa_secret="8W7721",
        description="MFA-protected synthetic account"
    ),
    "locked@example.test": SyntheticAccount(
        username="locked@example.test",
        password_hash="sha256:locked_user_pass",
        role="user",
        is_locked=True,
        failed_attempts=5,
        description="Pre-locked synthetic account for lockout resistance tests"
    ),
    "admin@example.test": SyntheticAccount(
        username="admin@example.test",
        password_hash="sha256:admin_super_secret_8w",
        role="admin",
        mfa_enabled=True,
        mfa_secret="8W9900",
        description="Synthetic laboratory administrator account"
    ),
    "bot-001@example.test": SyntheticAccount(
        username="bot-001@example.test",
        password_hash="sha256:bot01_pass",
        role="user",
        description="Synthetic bot profile 1"
    ),
    "bot-002@example.test": SyntheticAccount(
        username="bot-002@example.test",
        password_hash="sha256:bot02_pass",
        role="user",
        description="Synthetic bot profile 2"
    ),
    "bot-003@example.test": SyntheticAccount(
        username="bot-003@example.test",
        password_hash="sha256:bot03_pass",
        role="user",
        description="Synthetic bot profile 3"
    )
}


class AccountRepository:
    def __init__(self, accounts: Optional[Dict[str, SyntheticAccount]] = None):
        self._accounts = accounts if accounts is not None else dict(DEFAULT_SYNTHETIC_ACCOUNTS)

    def get(self, username: str) -> Optional[SyntheticAccount]:
        return self._accounts.get(username)

    def list_all(self) -> List[SyntheticAccount]:
        return list(self._accounts.values())

    def create(
        self,
        username: str,
        password_hash: str,
        role: str = "user",
        mfa_enabled: bool = False,
        mfa_secret: Optional[str] = None,
        description: str = ""
    ) -> SyntheticAccount:
        if not username.endswith(".test") and "@" in username and not username.endswith(".local"):
            # Enforce synthetic TLD (.test or .local)
            username = username.split("@")[0] + "@example.test"
        acc = SyntheticAccount(
            username=username,
            password_hash=password_hash,
            role=role,
            mfa_enabled=mfa_enabled,
            mfa_secret=mfa_secret,
            description=description
        )
        self._accounts[username] = acc
        return acc

    def update_lockout(self, username: str, is_locked: bool) -> None:
        if username in self._accounts:
            self._accounts[username].is_locked = is_locked

    def increment_failed(self, username: str) -> int:
        if username in self._accounts:
            self._accounts[username].failed_attempts += 1
            return self._accounts[username].failed_attempts
        return 0

    def reset_failed(self, username: str) -> None:
        if username in self._accounts:
            self._accounts[username].failed_attempts = 0
            self._accounts[username].is_locked = False
