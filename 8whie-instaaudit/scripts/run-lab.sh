#!/usr/bin/env bash
# 8WHIE InstaAudit — Run Full Lab Workflow
# Copyright (c) 2026 Aryan Thakur — 8WHIE.

set -e

if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

echo "[+] Starting 8WHIE InstaAudit Defensive Lab Server..."
python3 -c "from instaaudit.mock_server import MockServer; import time; s = MockServer(port=8080); s.start(); print('[+] Server listening on http://127.0.0.1:8080'); time.sleep(0.5)" &
SERVER_PID=$!

sleep 1

echo "[+] Running complete safe audit suite..."
instaaudit full-audit

echo "[+] Terminating lab server..."
kill $SERVER_PID 2>/dev/null || true

echo "[+] Lab execution finished cleanly."
