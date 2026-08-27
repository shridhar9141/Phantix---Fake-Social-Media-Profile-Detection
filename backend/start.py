import os
import sys
import uvicorn

if __name__ == "__main__":
    port_str = os.getenv("PORT", "8000")
    try:
        port = int(port_str)
    except (ValueError, TypeError):
        port = 8000

    print("==========================================================")
    print(f"[STARTUP] Phantix Production Server starting on 0.0.0.0:{port}")
    print(f"[STARTUP] Environment: {os.getenv('ENVIRONMENT', 'production')}")
    print(f"[STARTUP] Database: {'PostgreSQL URL detected' if os.getenv('DATABASE_URL') else 'Local fallback SQLite'}")
    print(f"[STARTUP] Firebase Project: {os.getenv('FIREBASE_PROJECT_ID', 'fake-social-media-detect-4bf0a')}")
    print("==========================================================")

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True
    )
