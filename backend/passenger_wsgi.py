"""
passenger_wsgi.py — WSGI-to-ASGI bridge for cPanel Passenger.
"""
import sys
import os
import asyncio
import threading
import traceback
import logging

sys.path.insert(0, os.path.dirname(__file__))

def _log(msg):
    sys.stderr.write(f"[passenger_wsgi] {msg}\n")
    sys.stderr.flush()

_log("Module loading...")

_app_failed = False
_asgi_app = None

try:
    from app.main import app as _asgi_app
    _log("FastAPI app imported successfully.")
except Exception as exc:
    _log(f"FATAL: Could not import FastAPI app: {exc}")
    _log(traceback.format_exc())
    _app_failed = True

# --- PREFORK THREADING FIX ---
# Passenger uses a preforking model: it loads this module in a parent process,
# then forks child workers to handle requests. Threads created before fork()
# DO NOT survive in the child. Therefore, we MUST initialize the event loop
# and daemon thread lazily upon the *first* request in the child worker process.

_worker_pid = None
_loop = None
_thread = None
_startup_complete = False
_startup_error = None
_init_lock = threading.Lock()

def _ensure_event_loop():
    """Ensure the asyncio event loop and daemon thread are running in this process."""
    global _worker_pid, _loop, _thread, _startup_complete, _startup_error

    current_pid = os.getpid()
    if _worker_pid == current_pid and _loop is not None:
        return  # Already initialized for this worker

    with _init_lock:
        if _worker_pid == current_pid and _loop is not None:
            return

        _log(f"Initializing asyncio event loop for worker PID {current_pid}")
        _worker_pid = current_pid
        _loop = asyncio.new_event_loop()
        _thread = threading.Thread(target=_loop.run_forever, daemon=True)
        _thread.start()

        if not _app_failed:
            _log("Triggering ASGI lifespan startup...")
            try:
                future = asyncio.run_coroutine_threadsafe(_do_lifespan_startup(), _loop)
                future.result(timeout=35)
                if _startup_complete:
                    _log("ASGI lifespan startup complete ✓")
                elif _startup_error:
                    _log(f"WARNING: ASGI lifespan issue: {_startup_error}")
            except Exception as exc:
                _log(f"WARNING: Lifespan setup exception (non-fatal): {exc}")
                _log(traceback.format_exc())


async def _do_lifespan_startup():
    global _startup_complete, _startup_error
    startup_event = asyncio.Event()
    first_receive = True

    async def receive():
        nonlocal first_receive
        if first_receive:
            first_receive = False
            return {"type": "lifespan.startup"}
        await asyncio.get_event_loop().create_future()
        return {"type": "lifespan.shutdown"}

    async def send(message):
        global _startup_complete, _startup_error
        if message["type"] == "lifespan.startup.complete":
            _startup_complete = True
            startup_event.set()
        elif message["type"] == "lifespan.startup.failed":
            _startup_error = message.get("message", "startup failed")
            startup_event.set()

    scope = {"type": "lifespan", "asgi": {"version": "3.0"}}
    asyncio.ensure_future(_asgi_app(scope, receive, send))

    try:
        await asyncio.wait_for(startup_event.wait(), timeout=30)
    except asyncio.TimeoutError:
        _startup_error = "lifespan startup timed out after 30s"


def application(environ, start_response):
    if _app_failed:
        start_response("500 Internal Server Error", [("Content-Type", "text/plain")])
        return [b"FastAPI app failed to import. Check stderr.log for traceback."]

    # Initialize the asyncio loop lazily if we just forked or just started
    _ensure_event_loop()

    try:
        future = asyncio.run_coroutine_threadsafe(_handle_request(environ), _loop)
        status, headers, body = future.result(timeout=120)
        start_response(status, headers)
        return [body]
    except Exception as exc:
        _log(f"Request error: {exc}")
        _log(traceback.format_exc())
        start_response("500 Internal Server Error", [("Content-Type", "text/plain")])
        return [f"Internal Server Error: {exc}".encode()]


async def _handle_request(environ):
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": environ.get("SERVER_PROTOCOL", "HTTP/1.1").split("/")[-1],
        "method": environ.get("REQUEST_METHOD", "GET"),
        "path": environ.get("PATH_INFO", "/"),
        "query_string": (environ.get("QUERY_STRING", "") or "").encode("latin-1"),
        "root_path": environ.get("SCRIPT_NAME", ""),
        "scheme": environ.get("wsgi.url_scheme", "http"),
        "server": (
            environ.get("SERVER_NAME", "localhost"),
            int(environ.get("SERVER_PORT", "80") or "80"),
        ),
        "headers": _extract_headers(environ),
    }

    body = b""
    try:
        cl = int(environ.get("CONTENT_LENGTH", 0) or 0)
        if cl > 0:
            wsgi_input = environ.get("wsgi.input")
            if wsgi_input:
                body = wsgi_input.read(cl)
    except (ValueError, KeyError, TypeError):
        pass

    status_line = "500 Internal Server Error"
    response_headers = []
    body_parts = []

    _request_returned = False

    async def receive():
        nonlocal _request_returned
        if not _request_returned:
            _request_returned = True
            return {"type": "http.request", "body": body, "more_body": False}
        else:
            # Block waiting for disconnect to prevent FastAPI infinite loop
            await asyncio.get_event_loop().create_future()
            return {"type": "http.disconnect"}

    async def send(message):
        nonlocal status_line, response_headers
        if message["type"] == "http.response.start":
            code = message["status"]
            from http import HTTPStatus
            try:
                phrase = HTTPStatus(code).phrase
            except ValueError:
                phrase = ""
            status_line = f"{code} {phrase}"
            response_headers = [
                (
                    k.decode("latin-1") if isinstance(k, bytes) else k,
                    v.decode("latin-1") if isinstance(v, bytes) else v,
                )
                for k, v in message.get("headers", [])
            ]
        elif message["type"] == "http.response.body":
            body_parts.append(message.get("body", b""))

    await _asgi_app(scope, receive, send)
    return status_line, response_headers, b"".join(body_parts)


def _extract_headers(environ):
    headers = []
    for key, value in environ.items():
        if key.startswith("HTTP_"):
            name = key[5:].lower().replace("_", "-").encode("latin-1")
            headers.append((name, value.encode("latin-1")))
        elif key == "CONTENT_TYPE" and value:
            headers.append((b"content-type", value.encode("latin-1")))
        elif key == "CONTENT_LENGTH" and value:
            headers.append((b"content-length", value.encode("latin-1")))
    return headers

_log("Module fully loaded. Awaiting first request to spawn worker thread.")
