/**
 * Shared backend API client.
 *
 * Every call to the FastAPI backend used to repeat
 * `process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"` inline
 * (13 call sites across 5 files) with `credentials: "include"` bolted on
 * separately at each one once the backend started requiring session
 * cookies. One copy here means the base URL and the credentials behavior
 * can't drift between call sites again. See AUDIT_TASKS.md F1.
 *
 * Routed through /api/proxy (src/app/api/proxy/[...path]/route.ts) rather
 * than hitting the backend directly — see that file's docstring for why:
 * HF Spaces' proxy strips Access-Control-Allow-Credentials on cross-origin
 * preflight, which broke every credentialed request from the deployed
 * site. Going through our own same-origin route sidesteps the browser
 * CORS step entirely instead of working around one piece of it.
 */

export const API_BASE_URL = "/api/proxy"

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  /** JSON-serializable body — sets Content-Type and stringifies for you. */
  json?: unknown
}

async function request(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { json, headers, ...rest } = options

  return fetch(`${API_BASE_URL}${path}`, {
    // /api/proxy is same-origin now, so the cookie would be sent by
    // default anyway — "include" is harmless here and kept so nothing
    // subtle breaks if this ever points somewhere cross-origin again. The
    // proxy route itself is what actually forwards the cookie on to
    // FastAPI's app/deps/auth.py, which is what really resolves identity.
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
