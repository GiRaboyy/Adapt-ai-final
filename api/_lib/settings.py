"""
Environment configuration and settings management.
Uses pydantic-settings for type-safe environment variable handling.
"""
import os
from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Supabase configuration
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    
    # Environment identifier
    environment: Literal["local", "preview", "production"] = "local"
    
    # Git commit SHA (optional, injected by Vercel)
    git_sha: str = "unknown"

    # Vercel deployment metadata
    vercel_env: str = "local"
    vercel_url: str = ""
    
    class Config:
        env_file = ".env.local"
        case_sensitive = False


# Global settings instance
settings = Settings(
    supabase_url=os.getenv("SUPABASE_URL", os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")),
    supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
    environment=os.getenv("ENVIRONMENT", "local"),  # type: ignore
    git_sha=os.getenv("GIT_SHA", os.getenv("VERCEL_GIT_COMMIT_SHA", "unknown")),
    vercel_env=os.getenv("VERCEL_ENV", "local"),
    vercel_url=os.getenv("VERCEL_URL", ""),
)
