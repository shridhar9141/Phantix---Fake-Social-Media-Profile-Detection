import os
import sys

# Ensure stdout and stderr flush immediately for Railway logs
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(line_buffering=True)

from app.main import app
import uvicorn

if __name__ == "__main__":
    port_str = os.getenv("PORT", "8000")
    try:
        port = int(port_str)
    except (ValueError, TypeError):
        port = 8000

    print("==========================================================", flush=True)
    print(f"[STARTUP] Phantix Production Server starting on 0.0.0.0:{port}", flush=True)
    print(f"[STARTUP] Working Directory: {os.getcwd()}", flush=True)
    print(f"[STARTUP] Environment: {os.getenv('ENVIRONMENT', 'production')}", flush=True)
    print(f"[STARTUP] Database: {'PostgreSQL URL configured' if os.getenv('DATABASE_URL') else 'SQLite fallback (zero-config startup)'}", flush=True)
    print(f"[STARTUP] Firebase Project: {os.getenv('FIREBASE_PROJECT_ID', 'fake-social-media-detect-4bf0a')}", flush=True)
    print("==========================================================", flush=True)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True
    )
