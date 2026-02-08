"""
FastAPI application entrypoint for Vercel serverless deployment.
Provides health check endpoints for system monitoring.
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from api._lib.settings import settings
from api._lib.auth import get_current_user
from api._lib.logger import get_logger

# Initialize logger for this module
logger = get_logger(__name__)

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


@app.get("/api/supabase/health")
async def supabase_health():
    """
    Database connectivity check.
    Executes a simple query to verify database connection and measure latency.
    """
    import time
    from api._lib.supabase_admin import get_admin_client
    
    try:
        start_time = time.time()
        
        # Get admin client
        supabase = get_admin_client()
        
        # Execute simple query to app_meta table (or any table that should exist)
        # If app_meta doesn't exist yet, this will fail gracefully
        try:
            response = supabase.table("app_meta").select("*").limit(1).execute()
            latency_ms = int((time.time() - start_time) * 1000)
            
            return {
                "ok": True,
                "message": "Database connected successfully",
                "latency_ms": latency_ms,
            }
        except Exception as query_error:
            # Table might not exist yet (migrations not applied)
            latency_ms = int((time.time() - start_time) * 1000)
            return {
                "ok": False,
                "message": f"Database query failed: {str(query_error)}",
                "latency_ms": latency_ms,
            }
            
    except ValueError as e:
        # Missing environment variables
        return {
            "ok": False,
            "message": f"Configuration error: {str(e)}",
            "latency_ms": 0,
        }
    except Exception as e:
        # Other connection errors
        return {
            "ok": False,
            "message": f"Connection error: {str(e)}",
            "latency_ms": 0,
        }


@app.get("/api/storage/health")
async def storage_health():
    """
    Storage bucket health check.
    Verifies bucket exists (creates if missing) and lists objects.
    """
    from api._lib.supabase_admin import get_admin_client
    
    bucket_name = "adapt-files"
    
    try:
        supabase = get_admin_client()
        
        # Try to get bucket info
        try:
            buckets = supabase.storage.list_buckets()
            bucket_exists = any(b.name == bucket_name for b in buckets)
            
            if not bucket_exists:
                # Create bucket if it doesn't exist
                supabase.storage.create_bucket(
                    bucket_name,
                    options={
                        "public": False,
                        "file_size_limit": 52428800,  # 50MB in bytes
                        "allowed_mime_types": [
                            "text/plain",
                            "application/pdf",
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                            "audio/webm",
                            "audio/mpeg",
                        ],
                    }
                )
                bucket_exists = True
            
            # List objects to verify read access
            files = supabase.storage.from_(bucket_name).list()
            objects_count = len(files) if files else 0
            
            return {
                "ok": True,
                "bucket": bucket_name,
                "objects_count": objects_count,
            }
            
        except Exception as storage_error:
            return {
                "ok": False,
                "message": f"Storage operation failed: {str(storage_error)}",
                "bucket": bucket_name,
                "objects_count": 0,
            }
            
    except Exception as e:
        return {
            "ok": False,
            "message": f"Error: {str(e)}",
            "bucket": bucket_name,
            "objects_count": 0,
        }


@app.post("/api/storage/test-upload")
async def test_upload():
    """
    Test file upload endpoint.
    Uploads a small test file to verify storage write access.
    """
    from datetime import datetime
    from api._lib.supabase_admin import get_admin_client
    
    bucket_name = "adapt-files"
    
    try:
        supabase = get_admin_client()
        
        # Generate timestamped path
        timestamp = datetime.utcnow().isoformat()
        file_path = f"healthcheck/{timestamp}.txt"
        
        # Create test content
        content = f"Health check at {timestamp}".encode('utf-8')
        
        # Upload to storage
        try:
            result = supabase.storage.from_(bucket_name).upload(
                file_path,
                content,
                {"content-type": "text/plain"}
            )
            
            return {
                "ok": True,
                "bucket": bucket_name,
                "path": file_path,
            }
            
        except Exception as upload_error:
            return {
                "ok": False,
                "message": f"Upload failed: {str(upload_error)}",
                "bucket": bucket_name,
                "path": "",
            }
            
    except Exception as e:
        return {
            "ok": False,
            "message": f"Error: {str(e)}",
            "bucket": bucket_name,
            "path": "",
        }


# =============================================================================
# Role Endpoints (authenticated via Supabase JWT)
# =============================================================================

class RoleUpdate(BaseModel):
    role: str


@app.get("/api/profile/role")
async def get_my_role(user: dict = Depends(get_current_user)):
    """Get the current authenticated user's role."""
    from api._lib.supabase_admin import get_admin_client

    logger = get_logger(__name__)
    user_id = user["id"]

    logger.info(f"GET /api/profile/role - user_id={user_id}")

    try:
        supabase = get_admin_client()
        result = supabase.table("profiles").select("role").eq("id", user_id).maybe_single().execute()

        role = result.data["role"] if result.data else None
        logger.info(f"GET /api/profile/role - user_id={user_id}, role={role}")

        return {"role": role}

    except HTTPException:
        # Re-raise auth errors from get_current_user
        raise
    except Exception as e:
        # Log database/connection errors but still return null role
        # (Frontend handles null by redirecting to role selection)
        logger.error(f"GET /api/profile/role - user_id={user_id}, error={type(e).__name__}: {str(e)}")
        return {"role": None}


@app.post("/api/profile/role")
async def set_my_role(body: RoleUpdate, user: dict = Depends(get_current_user)):
    """Set the current authenticated user's role using atomic UPSERT."""
    from api._lib.supabase_admin import get_admin_client

    logger = get_logger(__name__)
    user_id = user["id"]

    if body.role not in ("curator", "employee"):
        logger.warning(f"POST /api/profile/role - user_id={user_id}, invalid_role={body.role}")
        raise HTTPException(status_code=400, detail='Role must be "curator" or "employee"')

    logger.info(f"POST /api/profile/role - user_id={user_id}, role={body.role}")

    try:
        supabase = get_admin_client()

        # Use UPSERT to atomically insert or update
        # Supabase upsert automatically handles ON CONFLICT
        # Note: In supabase-py, .select() after .upsert() is not supported
        # We perform upsert first, then fetch the result with a separate SELECT
        supabase.table("profiles").upsert(
            {
                "id": user_id,
                "email": user.get("email"),
                "full_name": user.get("user_metadata", {}).get("full_name"),
                "role": body.role,
                "org_id": None,
            }
        ).execute()

        # Fetch the updated profile with a separate SELECT query
        result = supabase.table("profiles").select("*").eq("id", user_id).maybe_single().execute()

        # Check if we got data back
        if result.data:
            logger.info(f"POST /api/profile/role - user_id={user_id}, role={body.role}, success=True")
            return {"ok": True, "profile": result.data}
        else:
            logger.error(f"POST /api/profile/role - user_id={user_id}, profile not found after upsert")
            raise HTTPException(status_code=500, detail="Profile not found after upsert")

    except HTTPException:
        raise
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        logger.error(
            f"POST /api/profile/role - user_id={user_id}, role={body.role}, "
            f"error={error_type}, message={error_msg}"
        )
        raise HTTPException(status_code=500, detail=f"Failed to save role: {error_msg}")


# =============================================================================
# Auth Check Endpoints
# =============================================================================

class EmailCheckRequest(BaseModel):
    """Request body for checking email status."""
    email: str


@app.post("/api/auth/check-email")
async def check_email_status(body: EmailCheckRequest):
    """
    Check if an email is registered and if the account is confirmed.
    Returns: { exists: bool, confirmed: bool | null }
    """
    from api._lib.supabase_admin import get_admin_client

    try:
        supabase = get_admin_client()

        # Use admin API to get users list
        try:
            # List users and find by email
            # Note: In production, consider pagination for large user bases
            response = supabase.auth.admin.list_users()

            # Extract users from response
            users = response if isinstance(response, list) else getattr(response, 'users', [])

            # Find user with matching email (case-insensitive)
            user = next((u for u in users if u.email and u.email.lower() == body.email.lower()), None)

            if not user:
                return {
                    "exists": False,
                    "confirmed": None,
                }

            # Check if email is confirmed
            is_confirmed = user.email_confirmed_at is not None

            return {
                "exists": True,
                "confirmed": is_confirmed,
            }

        except Exception as auth_error:
            raise HTTPException(status_code=500, detail=f"Auth check failed: {str(auth_error)}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# =============================================================================
# Profile Management Endpoints
# =============================================================================

class ProfileCreate(BaseModel):
    """Request body for creating/updating a profile."""
    user_id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str = "curator"


class ProfileUpdate(BaseModel):
    """Request body for updating profile fields."""
    full_name: Optional[str] = None
    role: Optional[str] = None
    org_id: Optional[str] = None


@app.post("/api/profiles/ensure")
async def ensure_profile(profile: ProfileCreate):
    """
    Ensure a profile exists for the given user.
    Creates if not exists, returns existing if found.
    Uses service role key to bypass RLS.
    """
    from api._lib.supabase_admin import get_admin_client
    
    try:
        supabase = get_admin_client()
        
        # Check if profile exists
        result = supabase.table("profiles").select("*").eq("id", profile.user_id).maybe_single().execute()
        
        if result.data:
            # Profile exists, return it
            return {
                "ok": True,
                "profile": result.data,
                "created": False,
            }
        
        # Create new profile
        new_profile = {
            "id": profile.user_id,
            "email": profile.email,
            "full_name": profile.full_name,
            "role": profile.role,
            "org_id": None,
        }

        # Insert the profile (supabase-py doesn't support .select() after .insert())
        supabase.table("profiles").insert(new_profile).execute()

        # Fetch the inserted profile with a separate SELECT query
        fetch_result = supabase.table("profiles").select("*").eq("id", profile.user_id).maybe_single().execute()

        return {
            "ok": True,
            "profile": fetch_result.data if fetch_result.data else new_profile,
            "created": True,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile operation failed: {str(e)}")


@app.patch("/api/profiles/{user_id}")
async def update_profile(user_id: str, updates: ProfileUpdate):
    """
    Update a user's profile.
    Uses service role key to bypass RLS.
    """
    from api._lib.supabase_admin import get_admin_client
    
    try:
        supabase = get_admin_client()
        
        # Build update dict with only provided fields
        update_data = {}
        if updates.full_name is not None:
            update_data["full_name"] = updates.full_name
        if updates.role is not None:
            update_data["role"] = updates.role
        if updates.org_id is not None:
            update_data["org_id"] = updates.org_id
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Perform update (supabase-py doesn't guarantee .data in response)
        supabase.table("profiles").update(update_data).eq("id", user_id).execute()

        # Fetch the updated profile with a separate SELECT query
        result = supabase.table("profiles").select("*").eq("id", user_id).maybe_single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")

        return {
            "ok": True,
            "profile": result.data,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")


@app.get("/api/profiles/{user_id}")
async def get_profile(user_id: str):
    """
    Get a user's profile.
    Uses service role key to bypass RLS.
    """
    from api._lib.supabase_admin import get_admin_client
    
    try:
        supabase = get_admin_client()
        
        result = supabase.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return {
            "ok": True,
            "profile": result.data,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fetch failed: {str(e)}")


# =============================================================================
# Demo Request Endpoints
# =============================================================================

class DemoRequestCreate(BaseModel):
    """Request body for creating a demo request from landing page."""
    name: str
    email: str
    company: str
    telegram: str
    source: Optional[str] = "landing_page"

@app.post("/api/demo-request")
async def create_demo_request(body: DemoRequestCreate):
    """
    Create a new demo request from the landing page.
    Public endpoint (no auth required).
    Stores request in database for follow-up.

    Returns:
        {"ok": true, "message": "..."}

    Raises:
        HTTPException: 400 for validation errors, 500 for database errors
    """
    from api._lib.supabase_admin import get_admin_client

    # Validate email format
    import re
    email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_pattern, body.email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Validate required fields
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if not body.company.strip():
        raise HTTPException(status_code=400, detail="Company is required")
    if not body.telegram.strip():
        raise HTTPException(status_code=400, detail="Telegram is required")

    try:
        supabase = get_admin_client()

        # Create demo request record
        demo_request = {
            "name": body.name.strip(),
            "email": body.email.strip().lower(),
            "company": body.company.strip(),
            "telegram": body.telegram.strip(),
            "source": body.source,
            "status": "new",
        }

        result = supabase.table("demo_requests").insert(demo_request).execute()

        logger.info(
            f"Demo request created - email={body.email}, company={body.company}, source={body.source}"
        )

        return {
            "ok": True,
            "message": "Спасибо! Мы свяжемся с вами в Telegram.",
        }

    except Exception as e:
        logger.error(f"Failed to create demo request - error={type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit request")
