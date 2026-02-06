"""
Supabase admin client using service role key.
This client bypasses Row Level Security (RLS) and should only be used server-side.
"""
from supabase import create_client, Client
from api._lib.settings import settings


def get_supabase_admin() -> Client:
    """
    Create and return a Supabase client with service role key.
    This client has admin privileges and bypasses RLS policies.
    
    Returns:
        Supabase Client instance with service role privileges
    """
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment"
        )
    
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key
    )


# Global admin client instance (lazy loaded)
_admin_client: Client | None = None


def get_admin_client() -> Client:
    """
    Get or create the global admin client instance.
    Uses singleton pattern to avoid creating multiple clients.
    """
    global _admin_client
    if _admin_client is None:
        _admin_client = get_supabase_admin()
    return _admin_client
