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

    try:
        supabase = get_admin_client()
        result = supabase.table("profiles").select("role").eq("id", user["id"]).maybe_single().execute()
        return {"role": result.data["role"] if result.data else None}
    except Exception:
        return {"role": None}


@app.post("/api/profile/role")
async def set_my_role(body: RoleUpdate, user: dict = Depends(get_current_user)):
    """Set the current authenticated user's role."""
    from api._lib.supabase_admin import get_admin_client

    if body.role not in ("curator", "employee"):
        raise HTTPException(status_code=400, detail='Role must be "curator" or "employee"')

    try:
        supabase = get_admin_client()

        existing = supabase.table("profiles").select("id").eq("id", user["id"]).maybe_single().execute()

        if existing.data:
            result = supabase.table("profiles").update({"role": body.role}).eq("id", user["id"]).select().single().execute()
        else:
            result = supabase.table("profiles").insert({
                "id": user["id"],
                "email": user.get("email"),
                "full_name": user.get("user_metadata", {}).get("full_name"),
                "role": body.role,
                "org_id": None,
            }).select().single().execute()

        return {"ok": True, "profile": result.data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save role: {str(e)}")


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
        
        insert_result = supabase.table("profiles").insert(new_profile).execute()
        
        return {
            "ok": True,
            "profile": insert_result.data[0] if insert_result.data else new_profile,
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
        
        result = supabase.table("profiles").update(update_data).eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return {
            "ok": True,
            "profile": result.data[0],
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
