/**
 * IntelligenceLayer's four `phase2Status` render states (R16, AUDIT_TASKS.md).
 *
 * This is the render-gate that R5 fixed — it used to check only
 * `canonicalClaims === 0`, which is also true while the backend's Phase 2
 * pipeline is still running, so the whole section silently rendered
 * nothing (not even a loading state) for the first 10-30s of every normal
 * search. These tests pin that each of the four backend `status` values
 * ("pending" | "processing" | "complete" | "failed") produces the correct,
 * distinct UI — not just that *something* renders.
 */
import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import IntelligenceLayer from "./IntelligenceLayer"

vi.mock("../../../lib/api", () => ({
  api: { get: vi.fn() },
}))

import { api } from "../../../lib/api"

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body } as Response
}

function intelWith(overrides: Record<string, unknown>) {
  return {
    status: "complete",
    metrics: { articlesProcessed: 1, claimsExtracted: 1, canonicalClaims: 1, clusters: 0, events: 0 },
    events: [],
    clusters: [],
    claims: [],
    ...overrides,
  }
}

beforeEach(() => {
  // shouldAdvanceTime keeps real wall-clock time passing in the background
  // (so Testing Library's findBy*/waitFor internal polling, which uses
  // real setTimeout, doesn't deadlock) while still letting tests fast
  // -forward the component's own setInterval(..., 10000) explicitly via
  // vi.advanceTimersByTimeAsync() below.
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  vi.mocked(api.get).mockReset()
})

describe("IntelligenceLayer status states", () => {
  it("shows a processing state while status is pending", async () => {
    vi.mocked(api.get).mockResolvedValue(jsonResponse(intelWith({ status: "pending", metrics: { articlesProcessed: 5, claimsExtracted: 0, canonicalClaims: 0, clusters: 0, events: 0 } })))

    render(<IntelligenceLayer searchId="search-1" />)

    expect(await screen.findByText(/extracting claims, clustering evidence/i)).toBeInTheDocument()
    expect(screen.queryByText(/claim intelligence/i)).not.toBeInTheDocument()
  })

  it("shows the same processing state while status is processing", async () => {
    vi.mocked(api.get).mockResolvedValue(jsonResponse(intelWith({ status: "processing", metrics: { articlesProcessed: 5, claimsExtracted: 2, canonicalClaims: 0, clusters: 0, events: 0 } })))

    render(<IntelligenceLayer searchId="search-1" />)

    expect(await screen.findByText(/extracting claims, clustering evidence/i)).toBeInTheDocument()
  })

  it("shows a failure state when status is failed", async () => {
    vi.mocked(api.get).mockResolvedValue(jsonResponse(intelWith({ status: "failed" })))

    render(<IntelligenceLayer searchId="search-1" />)

    expect(await screen.findByText(/claim intelligence pipeline failed/i)).toBeInTheDocument()
  })

  it("renders nothing when status is complete with zero claims (genuinely empty, not still working)", async () => {
    vi.mocked(api.get).mockResolvedValue(jsonResponse(intelWith({ status: "complete", metrics: { articlesProcessed: 5, claimsExtracted: 0, canonicalClaims: 0, clusters: 0, events: 0 } })))

    const { container } = render(<IntelligenceLayer searchId="search-1" />)

    await waitFor(() => expect(api.get).toHaveBeenCalled())
    expect(screen.queryByText(/extracting claims/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/claim intelligence pipeline failed/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/claim intelligence/i)).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it("renders the full explorer once status is complete with claims present", async () => {
    vi.mocked(api.get).mockResolvedValue(jsonResponse(intelWith({ status: "complete" })))

    render(<IntelligenceLayer searchId="search-1" />)

    expect(await screen.findByText(/claim intelligence/i)).toBeInTheDocument()
  })

  it("stops polling once status flips from processing to complete", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce(jsonResponse(intelWith({ status: "processing", metrics: { articlesProcessed: 5, claimsExtracted: 0, canonicalClaims: 0, clusters: 0, events: 0 } })))
      .mockResolvedValue(jsonResponse(intelWith({ status: "complete" })))

    render(<IntelligenceLayer searchId="search-1" />)
    expect(await screen.findByText(/extracting claims/i)).toBeInTheDocument()

    // Advance past the 10s poll interval and let the resolved "complete"
    // response's state update flush.
    await vi.advanceTimersByTimeAsync(10000)
    expect(await screen.findByText(/claim intelligence/i)).toBeInTheDocument()

    const callsAfterComplete = vi.mocked(api.get).mock.calls.length
    await vi.advanceTimersByTimeAsync(30000)
    // No further polling once status is "complete" — clearInterval must
    // have actually fired, not just been scheduled to.
    expect(vi.mocked(api.get).mock.calls.length).toBe(callsAfterComplete)
  })
})
