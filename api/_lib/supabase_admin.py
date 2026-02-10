"""
Supabase admin client built from component packages (storage3, gotrue, postgrest).
Replaces the monolithic supabase==2.9.1 SDK to eliminate unused sub-packages:
- realtime (websockets) — not used, ~1.5 MB + websockets dep
- supafunc — not used, ~0.1 MB

Exposes the same .storage, .auth, and .table() interface as supabase.Client
so that api/index.py and api/_lib/auth.py require zero changes.
"""
from storage3 import SyncStorageClient
from gotrue import SyncGoTrueClient
from postgrest import SyncPostgrestClient

from api._lib.settings import settings


class _AdminClient:
    """
    Duck-typed Supabase admin client built from storage3, gotrue, postgrest.
    Interface is identical to supabase.Client for the methods used in this project.
    """

    def __init__(self, url: str, service_role_key: str) -> None:
        base_url = url.rstrip("/")
        base_headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
        }

        self.storage = SyncStorageClient(
            url=f"{base_url}/storage/v1",
            headers=base_headers,
        )

        self.auth = SyncGoTrueClient(
            url=f"{base_url}/auth/v1",
            headers=base_headers,
        )

        self._postgrest = SyncPostgrestClient(
            base_url=f"{base_url}/rest/v1",
            headers={
                **base_headers,
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )

    def table(self, table_name: str):
        return self._postgrest.from_(table_name)


_admin_client: "_AdminClient | None" = None


def get_admin_client() -> _AdminClient:
    """
    Get or create the global admin client instance (singleton).
    Uses service role key — bypasses RLS, server-side only.
    """
    global _admin_client
    if _admin_client is None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment"
            )
        _admin_client = _AdminClient(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _admin_client
