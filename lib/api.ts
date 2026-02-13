/**
 * Helper for calling FastAPI backend with Supabase auth token.
 */
import { createClient } from '@/lib/supabase/client';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set JSON content-type for non-FormData bodies (FormData sets its own boundary)
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(path, { ...options, headers });
}

/**
 * Robustly parse a fetch Response as JSON.
 *
 * - Reads body as text first (stream can only be consumed once)
 * - If content-type is JSON and response is not OK → extracts detail/message from body
 * - If content-type is not JSON and response is not OK → throws with HTTP status + body preview
 * - If response is OK → returns parsed JSON
 */
export async function safeJson<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  const ct = res.headers.get('content-type') ?? '';
  const isJson = ct.includes('application/json');

  if (!res.ok) {
    if (isJson) {
      try {
        const parsed = JSON.parse(text);
        const msg = parsed?.detail ?? parsed?.message ?? parsed?.error ?? `HTTP ${res.status}`;
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
        }
        throw e;
      }
    }
    // Non-JSON error (e.g. 413 from proxy, nginx HTML page)
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  // Success path — response must be JSON
  if (!isJson) {
    throw new Error(`Expected JSON response but got "${ct || 'unknown content-type'}"`);
  }

  return JSON.parse(text) as T;
}
