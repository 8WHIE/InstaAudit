"""
HTTP Mock Server for 8WHIE InstaAudit
Runs a local standalone HTTP server serving synthetic authentication endpoints on 127.0.0.1:8080.
"""

import http.server
import json
import socketserver
import threading
import time
from typing import Any, Optional
from urllib.parse import parse_qs, urlparse
from instaaudit.mock_auth import MockAuthService


class MockAuthHandler(http.server.BaseHTTPRequestHandler):
    auth_service: MockAuthService = MockAuthService(rate_limit_per_minute=30)

    def _set_headers(self, status_code: int = 200, extra_headers: Optional[dict] = None) -> None:
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")

        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/health":
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "status": "online",
                "service": "8WHIE InstaAudit Mock Server",
                "version": "1.0.0"
            }).encode("utf-8"))
            return

        if path == "/captcha":
            cap = self.auth_service.create_captcha_challenge()
            self._set_headers(200)
            self.wfile.write(json.dumps(cap).encode("utf-8"))
            return

        auth_header = self.headers.get("Authorization", "")
        cookie_header = self.headers.get("Cookie", "")
        session_id = None
        if auth_header.startswith("Bearer "):
            session_id = auth_header[7:].strip()
        elif "session_id=" in cookie_header:
            for part in cookie_header.split(";"):
                if part.strip().startswith("session_id="):
                    session_id = part.strip().split("=")[1]

        if path == "/session":
            if not session_id:
                self._set_headers(401)
                self.wfile.write(json.dumps({"status": "unauthorized", "code": 401}).encode("utf-8"))
                return
            status, res = self.auth_service.get_session(session_id)
            self._set_headers(status)
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        if path == "/user/profile":
            if not session_id:
                self._set_headers(401)
                self.wfile.write(json.dumps({"status": "unauthorized", "code": 401}).encode("utf-8"))
                return
            status, sess = self.auth_service.get_session(session_id)
            if status != 200:
                self._set_headers(status)
                self.wfile.write(json.dumps(sess).encode("utf-8"))
                return
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "status": "success",
                "profile": {
                    "username": sess["username"],
                    "role": sess["role"],
                    "synthetic_data": "Standard user dashboard"
                }
            }).encode("utf-8"))
            return

        if path == "/admin/dashboard":
            if not session_id:
                self._set_headers(401)
                self.wfile.write(json.dumps({"status": "unauthorized", "code": 401}).encode("utf-8"))
                return
            status, sess = self.auth_service.get_session(session_id)
            if status != 200 or sess.get("role") != "admin":
                self._set_headers(403)
                self.wfile.write(json.dumps({
                    "status": "forbidden",
                    "code": 403,
                    "message": "Admin authorization required."
                }).encode("utf-8"))
                return
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "status": "success",
                "admin_metrics": {
                    "synthetic_nodes": 4,
                    "active_experiments": 12,
                    "privileged_zone": True
                }
            }).encode("utf-8"))
            return

        self._set_headers(404)
        self.wfile.write(json.dumps({"status": "not_found", "code": 404}).encode("utf-8"))

    def do_POST(self) -> None:
        content_len = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
        try:
            payload = json.loads(post_body)
        except json.JSONDecodeError:
            payload = {}

        parsed = urlparse(self.path)
        path = parsed.path
        client_ip = self.client_address[0]

        if path == "/login":
            username = payload.get("username", "")
            password = payload.get("password", "")
            status, res = self.auth_service.login(username, password, client_id=client_ip)
            extra_headers = {}
            if status == 200 and "session_id" in res:
                extra_headers["Set-Cookie"] = (
                    f"session_id={res['session_id']}; Path=/; HttpOnly; SameSite=Strict"
                )
            elif status == 429 and "retry_after" in res:
                extra_headers["Retry-After"] = str(res["retry_after"])

            self._set_headers(status, extra_headers)
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        if path == "/logout":
            auth_header = self.headers.get("Authorization", "")
            session_id = payload.get("session_id")
            if not session_id and auth_header.startswith("Bearer "):
                session_id = auth_header[7:].strip()
            if not session_id:
                cookie_header = self.headers.get("Cookie", "")
                if "session_id=" in cookie_header:
                    for part in cookie_header.split(";"):
                        if part.strip().startswith("session_id="):
                            session_id = part.strip().split("=")[1]

            status, res = self.auth_service.logout(session_id or "")
            extra_headers = {"Set-Cookie": "session_id=; Path=/; Max-Age=0; HttpOnly"}
            self._set_headers(status, extra_headers)
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        if path == "/mfa":
            challenge_id = payload.get("challenge_id", "")
            otp = payload.get("otp", "")
            status, res = self.auth_service.verify_mfa(challenge_id, otp)
            extra_headers = {}
            if status == 200 and "session_id" in res:
                extra_headers["Set-Cookie"] = (
                    f"session_id={res['session_id']}; Path=/; HttpOnly; SameSite=Strict"
                )
            self._set_headers(status, extra_headers)
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        if path == "/captcha":
            challenge_id = payload.get("challenge_id", "")
            solution = payload.get("solution", "")
            status, res = self.auth_service.verify_captcha(challenge_id, solution)
            self._set_headers(status)
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        self._set_headers(404)
        self.wfile.write(json.dumps({"status": "not_found", "code": 404}).encode("utf-8"))

    def log_message(self, format: str, *args: Any) -> None:
        # Suppress noisy standard HTTP logs during automated test runs
        return


class ThreadedTCPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class MockServer:
    def __init__(
        self,
        host: str = "127.0.0.1",
        port: int = 8080,
        auth_service: Optional[MockAuthService] = None,
    ):
        self.host = host
        self.port = port
        self.auth_service = auth_service or MockAuthService(rate_limit_per_minute=30)
        self.server: Optional[ThreadedTCPServer] = None
        self.thread: Optional[threading.Thread] = None

    def start(self) -> None:
        if self.server:
            return
        bound_auth = self.auth_service

        class BoundHandler(MockAuthHandler):
            auth_service = bound_auth

        self.server = ThreadedTCPServer((self.host, self.port), BoundHandler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        time.sleep(0.1)

    def stop(self) -> None:
        if self.server:
            self.server.shutdown()
            self.server.server_close()
            self.server = None
            self.thread = None
