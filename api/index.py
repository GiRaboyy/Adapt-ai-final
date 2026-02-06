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
