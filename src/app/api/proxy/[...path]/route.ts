/**
 * Same-origin relay to the FastAPI backend.
 *
 * Why this exists: Hugging Face Spaces' front-door proxy deliberately
 * strips `Access-Control-Allow-Credentials` from cross-origin OPTIONS
 * preflight responses (confirmed platform behavior, not something fixable
 * in the FastAPI app's own CORS config — see
 * https://discuss.huggingface.co/t/hugging-face-spaces-proxy-suddenly-stripping-access-control-allow-credentials-header-on-options-preflight/177064).
 * Every credentialed cross-origin request from the browser directly to
 * *.hf.space fails as a result, surfacing only as `TypeError: Load failed`
 * with no CORS-sounding message in Safari.
 *
 * Routing every backend call through this route instead removes the
 * cross-origin request entirely: the browser only ever talks to its own
 * origin (this route), which needs no CORS/preflight step at all. The
 * actual Vercel -> HF Space call below happens server-to-server, which
 * browser CORS enforcement never applies to in the first place.
 *
 * BACKEND_URL is server-only (no NEXT_PUBLIC_ prefix) — the browser never
 * needs to know the real backend address anymore, which also closes off
 * the "wrong NEXT_PUBLIC_BACKEND_URL" class of bug (a misconfigured/wrong
 * port or domain there broke local dev and production separately earlier
 * in this project's history).
 */
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000"

async function relay(req: NextRequest, path: string[]): Promise<NextResponse> {
  const targetUrl = `${BACKEND_URL}/${path.join("/")}${req.nextUrl.search}`

  const headers: Record<string, string> = {
    // The whole point — this is what lets app/deps/auth.py resolve the
    // caller's session server-side, same as it always has.
    cookie: req.headers.get("cookie") || "",
  }
  const contentType = req.headers.get("content-type")
  if (contentType) headers["content-type"] = contentType

  const init: RequestInit = { method: req.method, headers }
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text()
  }

  let res: Response
  try {
    res = await fetch(targetUrl, init)
  } catch (err) {
    console.error(`Proxy relay to ${targetUrl} failed:`, err)
    return NextResponse.json(
      { detail: "Could not reach the backend service." },
      { status: 502 },
    )
  }

  const body = await res.text()
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  })
}

type RouteParams = { params: Promise<{ path: string[] }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  return relay(req, (await params).path)
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return relay(req, (await params).path)
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return relay(req, (await params).path)
}
