"""
Standardized Security Findings Engine for 8WHIE InstaAudit
Provides unified finding objects with severity rating and evidence tracking.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class Severity(str, Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class Finding:
    finding_id: str
    severity: Severity
    title: str
    description: str
    evidence: str
    impact: str
    recommendation: str
    status: str = "OPEN"

    def to_dict(self) -> dict:
        return {
            "finding_id": self.finding_id,
            "severity": self.severity.value,
            "title": self.title,
            "description": self.description,
            "evidence": self.evidence,
            "impact": self.impact,
            "recommendation": self.recommendation,
            "status": self.status,
        }
