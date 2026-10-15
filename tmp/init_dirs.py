#!/usr/bin/env python3
"""
8WHIE InstaAudit Generator Script
Generates the complete 8whie-instaaudit project repository tree with all files,
modules, tests, configurations, datasets, scripts, and examples.
"""

import os
from pathlib import Path

BASE_DIR = Path("/8whie-instaaudit")
BASE_DIR.mkdir(parents=True, exist_ok=True)

# Also create subdirectories
subdirs = [
    "config",
    "data",
    "src/instaaudit",
    "tests",
    "scripts",
    "examples",
]
for sd in subdirs:
    (BASE_DIR / sd).mkdir(parents=True, exist_ok=True)

print("Directories initialized successfully at", BASE_DIR)
