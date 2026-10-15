"""
Synthetic Bot Traffic Simulator for 8WHIE InstaAudit
Simulates non-human authentication burst cadence using synthetic bot fixtures.
Does not contain evasion or camouflage techniques.
"""

import time
from dataclasses import dataclass, field
from typing import Dict, List
import requests
from instaaudit.validator import SafetyValidator


@dataclass
class BotSimulationResult:
    bot_profiles_tested: int
    total_requests: int
    rate_limits_triggered: int
    lockouts_triggered: int
    detection_score: str
    findings: List[str] = field(default_factory=list)


BOT_PROFILES = [
    {"username": "bot-001@example.test", "delay": 0.01, "attempts": 3},
    {"username": "bot-002@example.test", "delay": 0.01, "attempts": 3},
    {"username": "bot-003@example.test", "delay": 0.01, "attempts": 3},
]


class BotSimulator:
    def __init__(self, target_url: str = "http://127.0.0.1:8080"):
        SafetyValidator.validate_target(target_url)
        self.target_url = target_url.rstrip("/")

    def simulate_bot_cadence(self) -> BotSimulationResult:
        SafetyValidator.validate_target(self.target_url)
        rate_limits = 0
        lockouts = 0
        total = 0
        findings = []

        endpoint = f"{self.target_url}/login"

        for bot in BOT_PROFILES:
            for i in range(bot["attempts"]):
                total += 1
                try:
                    resp = requests.post(
                        endpoint,
                        json={"username": bot["username"], "password": f"SimulatedBotPass_{i}!"},
                        timeout=2.0,
                    )
                    if resp.status_code == 429:
                        rate_limits += 1
                    elif resp.status_code == 423:
                        lockouts += 1
                except requests.RequestException:
                    pass
                time.sleep(bot["delay"])

        if rate_limits > 0 or lockouts > 0:
            score = "DEFENDED"
            findings.append("Simulated high-frequency bot traffic was intercepted by rate limiting / lockout.")
        else:
            score = "UNPROTECTED"
            findings.append("Automated bot-cadence login attempts were processed without anomaly detection.")

        return BotSimulationResult(
            bot_profiles_tested=len(BOT_PROFILES),
            total_requests=total,
            rate_limits_triggered=rate_limits,
            lockouts_triggered=lockouts,
            detection_score=score,
            findings=findings,
        )
