#!/usr/bin/env bash
# 8WHIE InstaAudit — Automated Setup Script
# Copyright (c) 2026 Aryan Thakur — 8WHIE.
# Supports Kali Linux, Ubuntu, Debian, and Linux environments without root.

set -e

echo "=========================================================="
echo "  8WHIE InstaAudit — Setup & Verification"
echo "  Founder: Aryan Thakur | Brand: 8WHIE"
echo "=========================================================="

echo "[1/6] Checking Python 3..."
if ! command -v python3 &> /dev/null; then
    echo "[-] Error: python3 is not installed. Please install Python 3.10+."
    exit 1
fi
PYTHON_VER=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "[+] Detected Python $PYTHON_VER"

echo "[2/6] Checking / Creating virtual environment..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "[+] Created virtual environment in .venv"
fi

source .venv/bin/activate
echo "[+] Activated .venv"

echo "[3/6] Checking pip..."
python3 -m pip install --upgrade pip setuptools wheel

echo "[4/6] Installing dependencies and package..."
pip install -r requirements.txt
pip install -e .

echo "[5/6] Running automated test suite..."
pytest -q

echo "[6/6] Verifying CLI..."
instaaudit --version

echo ""
echo "=========================================================="
echo "[+] Setup successfully completed!"
echo "Safe quickstart example commands:"
echo "  source .venv/bin/activate"
echo "  instaaudit --help"
echo "  instaaudit policy-check --password 'SecureLabPass!2026'"
echo "  instaaudit accounts list"
echo "  instaaudit mfa-test"
echo "  instaaudit captcha-test"
echo "  instaaudit full-audit"
echo "=========================================================="
