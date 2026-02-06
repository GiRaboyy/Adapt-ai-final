"""
FastAPI application entrypoint for Vercel serverless deployment.
Provides health check endpoints for system monitoring.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api._lib.settings import settings

# Create FastAPI app instance
app = FastAPI(
    title="Adapt MVP API",
    description="Backend API for Adapt training platform",
    version="0.1.0",
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """
    Basic health check endpoint.
    Returns application build information and environment identifier.
    """
    return {
        "ok": True,
        "build": settings.git_sha,
        "env": settings.environment,
    }


# Placeholder routes for future implementation
@app.get("/api/supabase/health")
async def supabase_health():
    """Database connectivity check - to be implemented in next commit."""
    return {
        "ok": False,
        "message": "Not implemented yet",
        "latency_ms": 0,
    }


@app.get("/api/storage/health")
async def storage_health():
    """Storage bucket check - to be implemented in next commit."""
    return {
        "ok": False,
        "message": "Not implemented yet",
        "bucket": "adapt-files",
        "objects_count": 0,
    }


@app.post("/api/storage/test-upload")
async def test_upload():
    """Test file upload - to be implemented in next commit."""
    return {
        "ok": False,
        "message": "Not implemented yet",
        "bucket": "adapt-files",
        "path": "",
    }
