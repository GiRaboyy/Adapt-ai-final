"""
FastAPI application entrypoint for Vercel serverless deployment.
Provides health check endpoints for system monitoring.
"""
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
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
        "vercel_env": settings.vercel_env,
        "vercel_url": settings.vercel_url,
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


# =============================================================================
# Courses Endpoints (Storage-based, no DB)
# =============================================================================
#
# STORAGE SETUP REQUIRED:
# Create a bucket named "courses" in your Supabase project:
#   1. Go to Storage → Create bucket → Name: "courses", Public: false
#   2. Set file size limit: 30MB
#   3. Allowed MIME types: application/pdf, text/plain,
#      application/vnd.openxmlformats-officedocument.wordprocessingml.document,
#      application/msword
#
# File structure in bucket:
#   {userId}/{courseId}/files/{filename}       ← original files
#   {userId}/{courseId}/parsed/{filename}.txt  ← parsed text per file
#   {userId}/{courseId}/parsed/combined.txt    ← all text combined
#   {userId}/{courseId}/manifest.json          ← course metadata
# =============================================================================

COURSES_BUCKET = "courses"
MAX_FILE_SIZE = 30 * 1024 * 1024  # 30MB
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".doc", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}


def _parse_pdf_bytes(content: bytes) -> str:
    """Extract text from PDF bytes using pypdf."""
    try:
        from pypdf import PdfReader
        import io
        reader = PdfReader(io.BytesIO(content))
        texts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                texts.append(page_text)
        return "\n".join(texts)
    except Exception as e:
        raise ValueError(f"PDF parse error: {str(e)}")


def _parse_docx_bytes(content: bytes) -> str:
    """Extract text from DOCX bytes using python-docx."""
    try:
        from docx import Document
        import io
        doc = Document(io.BytesIO(content))
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        return "\n".join(paragraphs)
    except Exception as e:
        raise ValueError(f"DOCX parse error: {str(e)}")


def _parse_txt_bytes(content: bytes) -> str:
    """Decode TXT bytes to string."""
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    return content.decode("latin-1", errors="replace")


def _ensure_courses_bucket(supabase) -> None:
    """Ensure the courses bucket exists. Creates/updates it without MIME restrictions.

    We intentionally do NOT set allowed_mime_types here — MIME validation is
    performed at the application level. Setting it on the bucket has caused
    InvalidMimeType 415 errors (e.g. when the browser reports an empty or
    vendor-prefixed MIME type for DOCX files).
    """
    try:
        buckets = supabase.storage.list_buckets()
        exists = any(b.name == COURSES_BUCKET for b in buckets)
        if not exists:
            supabase.storage.create_bucket(
                COURSES_BUCKET,
                options={
                    "public": False,
                    "file_size_limit": MAX_FILE_SIZE,
                    # No allowed_mime_types — allow all; app validates by extension.
                },
            )
            logger.info(f"Created bucket '{COURSES_BUCKET}'")
        else:
            # If the bucket already exists with stale allowed_mime_types restrictions
            # (e.g. created without the application/ prefix), clear them so uploads
            # are not blocked at the storage layer.
            try:
                supabase.storage.update_bucket(
                    COURSES_BUCKET,
                    options={
                        "public": False,
                        "file_size_limit": MAX_FILE_SIZE,
                        "allowed_mime_types": [],  # empty = no restriction
                    },
                )
            except Exception as update_err:
                logger.warning(f"Could not update bucket mime settings (non-fatal): {update_err}")
    except Exception as e:
        logger.warning(f"Could not ensure bucket: {e}")


class FileInfo(BaseModel):
    name: str
    originalName: str
    storagePath: str
    mimeType: str
    size: int


class CourseProcessRequest(BaseModel):
    courseId: str
    userId: str
    title: str
    size: str
    files: List[FileInfo]


class CourseManifestFile(BaseModel):
    fileId: str           # UUID filename in storage e.g. "abc123.pdf"
    name: str             # original file name
    type: str
    size: int
    storagePath: str
    parseStatus: str  # "parsed" | "skipped" | "error"
    parsedPath: Optional[str] = None
    parseError: Optional[str] = None


class CourseManifest(BaseModel):
    courseId: str
    title: str
    size: str
    createdAt: str
    overallStatus: str  # "ready" | "partial" | "error" | "processing"
    textBytes: int
    inviteCode: str
    employeesCount: int = 0
    files: List[CourseManifestFile]


@app.post("/api/courses/process")
async def process_course(
    body: CourseProcessRequest,
    user: dict = Depends(get_current_user),
):
    """
    Process uploaded course files: parse text, save results, create manifest.

    Called after client has already uploaded files to Supabase Storage.
    Downloads each file, parses it, saves parsed text and manifest.json.
    """
    import json
    import random
    import string
    from datetime import datetime, timezone
    from api._lib.supabase_admin import get_admin_client

    log = get_logger(__name__)
    user_id = user["id"]
    course_id = body.courseId

    def _generate_invite_code(length: int = 6) -> str:
        chars = string.ascii_uppercase + string.digits
        return "".join(random.choices(chars, k=length))

    log.info(f"POST /api/courses/process - userId={user_id}, courseId={course_id}")

    # Security: ensure user can only process their own courses
    if body.userId != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    supabase = get_admin_client()
    _ensure_courses_bucket(supabase)

    parsed_files: List[CourseManifestFile] = []
    combined_parts: List[str] = []
    total_text_bytes = 0

    for file_info in body.files:
        file_path = file_info.storagePath
        name_lower = file_info.originalName.lower()
        ext = "." + name_lower.rsplit(".", 1)[-1] if "." in name_lower else ""

        log.info(f"Processing file: {file_info.originalName} (ext={ext})")

        # Download file from Storage
        try:
            file_bytes = supabase.storage.from_(COURSES_BUCKET).download(file_path)
        except Exception as e:
            log.error(f"Failed to download {file_path}: {e}")
            parsed_files.append(CourseManifestFile(
                fileId=file_info.name,
                name=file_info.originalName,
                type=file_info.mimeType,
                size=file_info.size,
                storagePath=file_path,
                parseStatus="error",
                parseError=f"Download failed: {str(e)}",
            ))
            continue

        # Parse based on extension
        parsed_text: Optional[str] = None
        parse_status = "parsed"
        parse_error: Optional[str] = None

        try:
            if ext == ".pdf":
                parsed_text = _parse_pdf_bytes(file_bytes)
            elif ext in (".txt",):
                parsed_text = _parse_txt_bytes(file_bytes)
            elif ext == ".docx":
                parsed_text = _parse_docx_bytes(file_bytes)
            elif ext == ".doc":
                parse_status = "skipped"
                parse_error = ".doc загружен, парсинг будет позже"
            else:
                parse_status = "skipped"
                parse_error = f"Неподдерживаемый формат: {ext}"
        except ValueError as e:
            parse_status = "error"
            parse_error = str(e)
            log.warning(f"Parse error for {file_info.originalName}: {e}")

        # Save parsed text to Storage
        parsed_path: Optional[str] = None
        if parsed_text is not None:
            parsed_path = f"{user_id}/{course_id}/parsed/{file_info.name}.txt"
            text_bytes = parsed_text.encode("utf-8")
            total_text_bytes += len(text_bytes)
            try:
                supabase.storage.from_(COURSES_BUCKET).upload(
                    parsed_path,
                    text_bytes,
                    {"content-type": "text/plain; charset=utf-8", "upsert": "true"},
                )
                combined_parts.append(
                    f"=== {file_info.originalName} ===\n{parsed_text}"
                )
            except Exception as e:
                log.error(f"Failed to save parsed text for {file_info.originalName}: {e}")
                parse_error = f"Parsed text save failed: {str(e)}"

        parsed_files.append(CourseManifestFile(
            fileId=file_info.name,
            name=file_info.originalName,
            type=file_info.mimeType,
            size=file_info.size,
            storagePath=file_path,
            parseStatus=parse_status,
            parsedPath=parsed_path,
            parseError=parse_error,
        ))

    # Save combined.txt
    if combined_parts:
        combined_text = "\n\n".join(combined_parts).encode("utf-8")
        combined_path = f"{user_id}/{course_id}/parsed/combined.txt"
        try:
            supabase.storage.from_(COURSES_BUCKET).upload(
                combined_path,
                combined_text,
                {"content-type": "text/plain; charset=utf-8", "upsert": "true"},
            )
        except Exception as e:
            log.error(f"Failed to save combined.txt: {e}")

    # Determine overall status
    statuses = [f.parseStatus for f in parsed_files]
    if all(s == "parsed" for s in statuses):
        overall_status = "ready"
    elif any(s == "error" for s in statuses):
        overall_status = "partial" if any(s == "parsed" for s in statuses) else "error"
    else:
        overall_status = "ready"

    # Build and save manifest
    manifest = CourseManifest(
        courseId=course_id,
        title=body.title,
        size=body.size,
        createdAt=datetime.now(timezone.utc).isoformat(),
        overallStatus=overall_status,
        textBytes=total_text_bytes,
        inviteCode=_generate_invite_code(),
        employeesCount=0,
        files=[f.model_dump() for f in parsed_files],
    )

    manifest_path = f"{user_id}/{course_id}/manifest.json"
    manifest_bytes = json.dumps(manifest.model_dump(), ensure_ascii=False, indent=2).encode("utf-8")

    try:
        supabase.storage.from_(COURSES_BUCKET).upload(
            manifest_path,
            manifest_bytes,
            {"content-type": "application/json", "upsert": "true"},
        )
    except Exception as e:
        log.error(f"Failed to save manifest: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save manifest: {str(e)}")

    log.info(f"Course processed - courseId={course_id}, status={overall_status}, files={len(parsed_files)}")

    return {
        "ok": True,
        "manifest": manifest.model_dump(),
    }


@app.get("/api/courses/list")
async def list_courses(user: dict = Depends(get_current_user)):
    """
    List all courses for the authenticated user.
    Reads manifest.json from Storage for each course folder.
    Returns courses sorted by createdAt descending.
    """
    import json
    from api._lib.supabase_admin import get_admin_client

    log = get_logger(__name__)
    user_id = user["id"]

    log.info(f"GET /api/courses/list - userId={user_id}")

    supabase = get_admin_client()
    _ensure_courses_bucket(supabase)

    # List course folders for this user
    try:
        items = supabase.storage.from_(COURSES_BUCKET).list(user_id)
    except Exception as e:
        log.error(f"Failed to list courses for user {user_id}: {e}")
        return {"ok": True, "courses": []}

    if not items:
        return {"ok": True, "courses": []}

    courses = []
    for item in items:
        # Each item is a folder representing a courseId
        course_id = item.get("name") if isinstance(item, dict) else getattr(item, "name", None)
        if not course_id:
            continue

        # Try to download manifest.json
        manifest_path = f"{user_id}/{course_id}/manifest.json"
        try:
            manifest_bytes = supabase.storage.from_(COURSES_BUCKET).download(manifest_path)
            manifest = json.loads(manifest_bytes.decode("utf-8"))
            courses.append(manifest)
        except Exception as e:
            log.warning(f"Could not read manifest for course {course_id}: {e}")
            # Include a placeholder for courses without manifest
            courses.append({
                "courseId": course_id,
                "title": "Неполный курс",
                "size": "unknown",
                "createdAt": "",
                "overallStatus": "error",
                "textBytes": 0,
                "inviteCode": "",
                "employeesCount": 0,
                "files": [],
            })
            continue

    # Sort by createdAt descending (newest first)
    courses.sort(key=lambda c: c.get("createdAt", ""), reverse=True)

    return {"ok": True, "courses": courses}


@app.get("/api/courses/{course_id}")
async def get_course(course_id: str, user: dict = Depends(get_current_user)):
    """
    Get a single course manifest by courseId.
    """
    import json
    from api._lib.supabase_admin import get_admin_client

    log = get_logger(__name__)
    user_id = user["id"]

    supabase = get_admin_client()
    manifest_path = f"{user_id}/{course_id}/manifest.json"
    try:
        manifest_bytes = supabase.storage.from_(COURSES_BUCKET).download(manifest_path)
        manifest = json.loads(manifest_bytes.decode("utf-8"))
    except Exception as e:
        log.error(f"Could not read manifest for course {course_id}: {e}")
        raise HTTPException(status_code=404, detail="Course not found")

    return {"ok": True, "manifest": manifest}


@app.get("/api/courses/{course_id}/files/{file_id}/download")
async def download_course_file(
    course_id: str,
    file_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Return a short-lived signed URL to download a course file.
    file_id is the UUID filename stored in Storage (e.g. "abc123.pdf").
    """
    import json
    from fastapi.responses import JSONResponse
    from api._lib.supabase_admin import get_admin_client

    log = get_logger(__name__)
    user_id = user["id"]

    supabase = get_admin_client()

    # Read manifest to verify the file belongs to this user's course
    manifest_path = f"{user_id}/{course_id}/manifest.json"
    try:
        manifest_bytes = supabase.storage.from_(COURSES_BUCKET).download(manifest_path)
        manifest = json.loads(manifest_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=404, detail="Course not found")

    # Find matching file entry by fileId
    file_entry = next(
        (f for f in manifest.get("files", []) if f.get("fileId") == file_id),
        None,
    )
    if not file_entry:
        raise HTTPException(status_code=404, detail="File not found in course")

    storage_path = file_entry["storagePath"]

    # Create a signed URL valid for 60 seconds
    try:
        result = supabase.storage.from_(COURSES_BUCKET).create_signed_url(
            storage_path, expires_in=60
        )
        signed_url = result.get("signedURL") or result.get("signedUrl")
        if not signed_url:
            raise ValueError(f"No signed URL in response: {result}")
    except Exception as e:
        log.error(f"Failed to create signed URL for {storage_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Could not generate download URL: {str(e)}")

    return {
        "ok": True,
        "url": signed_url,
        "fileName": file_entry.get("name", file_id),
    }
