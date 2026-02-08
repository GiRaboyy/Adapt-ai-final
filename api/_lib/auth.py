"""
Authentication dependency for FastAPI.
Verifies Supabase JWT tokens from the Authorization header.
"""
from fastapi import Depends, HTTPException, Request
from api._lib.supabase_admin import get_admin_client


async def get_current_user(request: Request) -> dict:
    """
    Extract and verify the Supabase access token from the Authorization header.
    Returns the authenticated user dict.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty token")

    try:
        supabase = get_admin_client()
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = user_response.user
        return {
            "id": user.id,
            "email": user.email,
            "user_metadata": user.user_metadata or {},
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
