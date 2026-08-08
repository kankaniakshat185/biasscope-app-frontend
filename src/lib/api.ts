/**
 * Shared backend API client.
 *
 * Every call to the FastAPI backend used to repeat
 * `process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"` inline
 * (13 call sites across 5 files) with `credentials: "include"` bolted on
 * separately at each one once the backend started requiring session
 * cookies. One copy here means the base URL and the credentials behavior
 * can't drift between call sites again. See AUDIT_TASKS.md F1.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  /** JSON-serializable body — sets Content-Type and stringifies for you. */
  json?: unknown
}

async function request(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { json, headers, ...rest } = options

  return fetch(`${API_BASE_URL}${path}`, {
    // The backend resolves the caller's identity from the Better Auth
    // session cookie (see biasscope-hf-backend/app/deps/auth.py) — every
    // request needs to carry it, not just the ones that happen to need auth.
    credentials: "include",
    headers: json !== undefined ? { "Content-Type": "application/json", ...headers } : headers,
    body: json !== undefined ? JSON.stringify(json) : undefined,
    ...rest,
  })
}

export const api = {
  get: (path: string, options?: ApiRequestOptions) =>
    request(path, { method: "GET", ...options }),

  post: (path: string, json?: unknown, options?: ApiRequestOptions) =>
    request(path, { method: "POST", json, ...options }),

  delete: (path: string, options?: ApiRequestOptions) =>
    request(path, { method: "DELETE", ...options }),
}
