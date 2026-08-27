import os
from pathlib import Path
import uvicorn
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, Base, get_db
import app.models  # Ensures all ORM models are registered

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.activity import router as activity_router
from app.api.v1.search import router as search_router
from app.api.v1.profiles import router as profiles_router
from app.api.v1.dataset import router as dataset_router
from app.api.v1.investigations import router as inv_router
from app.api.v1.dashboard import router as dash_router
from app.api.v1.network import router as net_router
from app.api.v1.reports import router as reports_router
from app.api.v1.complaints import router as complaints_router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Initializes database tables safely on startup without crashing health checks.
    """
    try:
        Base.metadata.create_all(bind=engine)
        print("[DATABASE] Tables auto-initialized successfully.")
    except Exception as exc:
        print(f"[DATABASE WARNING] Deferred table auto-creation: {exc}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Robust CORS Configuration supporting single-domain production and localhost dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc)
            }
        }
    )

# Include API Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(activity_router, prefix=settings.API_V1_STR)
app.include_router(search_router, prefix=settings.API_V1_STR)
app.include_router(profiles_router, prefix=settings.API_V1_STR)
app.include_router(dataset_router, prefix=settings.API_V1_STR)
app.include_router(inv_router, prefix=settings.API_V1_STR)
app.include_router(dash_router, prefix=settings.API_V1_STR)
app.include_router(net_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(complaints_router, prefix=settings.API_V1_STR)

# ------------------------------------------------------------------------------
# Health Checks (Liveness and Readiness)
# ------------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
def health_check():
    """Liveness probe returning basic service health."""
    return {
        "status": "ok",
        "service": "Phantix Fake Social Media Profile Detection",
        "version": settings.VERSION
    }

@app.get("/health/ready", tags=["Health"])
def readiness_check(db: Session = Depends(get_db)):
    """Readiness probe checking database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected"
        }
    except Exception as exc:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": "Database connection verification failed"
            }
        )

# ------------------------------------------------------------------------------
# Static Files & Single-Page Application (SPA) Serving
# ------------------------------------------------------------------------------
def resolve_static_dir() -> Path:
    """Resolves the path to the compiled React frontend dist directory."""
    if settings.STATIC_DIR and Path(settings.STATIC_DIR).is_dir():
        return Path(settings.STATIC_DIR).resolve()
    
    # Common candidate locations
    candidates = [
        Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
        Path("/app/frontend/dist"),
        Path(__file__).resolve().parent / "static",
    ]
    for candidate in candidates:
        if candidate.is_dir():
            return candidate
    return candidates[0]

static_dir = resolve_static_dir()

# Mount /assets if the directory exists
assets_dir = static_dir / "assets"
if assets_dir.is_dir():
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    """
    Serves the React Single Page Application (SPA).
    Returns static assets if matching file exists, or index.html for client routes.
    Preserves 404 for unmatched API and system endpoints.
    """
    # Safeguard against catching API, health, or docs endpoints
    if (
        full_path.startswith("api/")
        or full_path == "api"
        or full_path.startswith("health")
        or full_path.startswith("docs")
        or full_path.startswith("redoc")
        or full_path.startswith("openapi.json")
    ):
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Resource '/{full_path}' not found"
                }
            }
        )

    # Check if a specific root static file was requested (e.g. favicon.ico, vite.svg)
    if static_dir.exists():
        potential_file = static_dir / full_path
        if full_path and potential_file.is_file():
            return FileResponse(potential_file)

        # Return the React SPA index.html for all frontend navigation routes
        index_file = static_dir / "index.html"
        if index_file.is_file():
            return FileResponse(index_file)

    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "error": {
                "code": "SPA_NOT_BUILT",
                "message": "Frontend build assets not found. Run 'npm run build' in the frontend directory."
            }
        }
    )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
