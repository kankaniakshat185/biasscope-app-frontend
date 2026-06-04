"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Loader2, Database, TrendingUp, ChevronDown, ChevronUp } from "lucide-react"

export default function IntelligenceLayer({ searchId }: { searchId: string }) {
  const [intel, setIntel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("events")

  useEffect(() => {
    async function fetchIntel() {
      try {
        let res;
        let data;
        if (typeof searchId === 'string' && searchId.startsWith('demo-')) {
          const topic = decodeURIComponent(searchId.replace('demo-', ''))
          res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/demo/${topic}`)
          if (!res.ok) throw new Error("Demo snapshot not found")
          const fullResult = await res.json()
          data = fullResult.intelligence
        } else {
          res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/results/${searchId}/intelligence`)
          if (!res.ok) throw new Error("Failed to fetch intelligence layer")
          data = await res.json()
        }
        setIntel(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchIntel()
    const interval = setInterval(() => { fetchIntel() }, 10000)
    return () => clearInterval(interval)
  }, [searchId])

  if (loading && !intel) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-400 mt-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500 mb-4" />
        <p className="text-gray-500 font-mono text-sm">Building Intelligence Graph...</p>
      </div>
    )
  }

  if (!intel || !intel.metrics) return null
  if (intel.metrics.canonicalClaims === 0 && !loading) return null

  return (
    <div className="mt-12 pt-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-sekuya)] uppercase flex items-center flex-wrap gap-3">
            Claim Intelligence 
            <span className="text-sm bg-yellow-300 px-2 py-1 border border-black font-mono tracking-normal leading-none">BETA</span>
          </h2>
          <p className="text-gray-600 mt-2 max-w-none text-sm">
            BiasScope extracts verifiable facts, clusters them into canonical claims, and detects cross-source events.
          </p>
        </div>
      </div>

      {/* Debug Metrics */}
      <div className="bg-gray-100 p-4 border-2 border-black mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-xs flex flex-wrap gap-6 print:hidden">
        <div className="flex items-center gap-2"><Database className="w-4 h-4" /> <span className="font-bold">METRICS:</span></div>
        <div>Articles: {intel.metrics.articlesProcessed}</div>
        <div>Claims: {intel.metrics.claimsExtracted}</div>
        <div>Clusters: {intel.metrics.clusters}</div>
        <div>Events: {intel.metrics.events}</div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-black mb-6 print:hidden">
        {["events", "clusters", "claims"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-bold uppercase tracking-widest text-sm transition-colors ${
              activeTab === tab ? 'bg-black text-white' : 'hover:bg-gray-200'
            }`}
          >
            {tab === "events" ? "Event Explorer" : tab === "clusters" ? "Cluster Explorer" : "Claim Explorer"}
          </button>
        ))}
      </div>

      <div className="space-y-6">

        {/* ══ EVENT EXPLORER ══ */}
        <div className={activeTab === "events" ? "block" : "hidden print:block"}>
          <div className="space-y-4">
            <h3 className="font-bold text-xl uppercase border-b border-gray-300 pb-2 hidden print:block">Top Events</h3>
            {intel.events.length === 0 && <p className="text-gray-500 italic">No events detected yet.</p>}
            {intel.events.map((ev: any, idx: number) => (
              <EventCard key={idx} event={ev} />
            ))}
          </div>
        </div>

        {/* ══ CLUSTER EXPLORER ══ */}
        <div className={activeTab === "clusters" ? "block" : "hidden"}>
          <div className="space-y-4">
            {intel.clusters.length === 0 && <p className="text-gray-500 italic">No clusters formed yet.</p>}
            {intel.clusters.map((cl: any, idx: number) => (
              <ClusterCard key={idx} cluster={cl} />
            ))}
          </div>
        </div>

        {/* ══ CLAIM EXPLORER ══ */}
        <div className={activeTab === "claims" ? "block" : "hidden print:block"}>
          <div className="space-y-4">
            <h3 className="font-bold text-xl uppercase border-b border-gray-300 pb-2 hidden print:block mt-8">Extracted Claims</h3>
            {intel.claims.length === 0 && <p className="text-gray-500 italic">No claims extracted yet.</p>}
            {intel.claims.slice(0, 50).map((claim: any, idx: number) => (
              <RawClaimCard key={idx} claim={claim} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

/* ── Event Card ─────────────────────────────────────────────────── */

function EventCard({ event }: { event: any }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="bg-gray-50 border-b border-black py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg font-bold">{event.title}</CardTitle>
          <Badge variant="outline" className="border-black font-mono shrink-0 text-xs">
            <TrendingUp className="w-3 h-3 mr-1 inline" />
            {(event.importanceScore || 0).toFixed(1)}
          </Badge>
        </div>
        {event.description && (
          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
        )}

        {/* Canonical Claim — displayed ONCE (Issue 2 fix) */}
        {event.canonicalClaim && (
          <div className="mt-2 bg-yellow-50 border border-yellow-200 p-2">
            <span className="text-xs font-bold uppercase text-yellow-700">Canonical Claim: </span>
            <span className="text-sm text-gray-900">{event.canonicalClaim}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-4 mt-2 font-mono text-xs text-gray-600">
          <span>Sources: {event.sourceCount}</span>
          <span>Claims: {event.claimCount}</span>
          <span>Evidence: {event.evidenceCount}</span>
          <span className="ml-auto text-blue-600 print:hidden flex items-center gap-1">
            {expanded ? <><ChevronUp className="w-3 h-3" /> Hide Evidence</> : <><ChevronDown className="w-3 h-3" /> Show Evidence</>}
          </span>
        </div>
      </CardHeader>

      {/* Source badges */}
      <CardContent className="pt-3 pb-2">
        <div className="flex flex-wrap gap-2">
          {event.sources?.map((s: string, sidx: number) => (
            <Badge key={sidx} variant="secondary" className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200">
              {s}
            </Badge>
          ))}
        </div>
      </CardContent>

      {/* Evidence (expandable) — each evidence matches its claim (Issue 1 fix) */}
      {expanded && event.evidence?.length > 0 && (
        <CardContent className="pt-0 pb-4 bg-gray-50 border-t border-dashed border-gray-300 print:hidden">
          <h4 className="text-xs font-bold uppercase text-gray-500 mt-3 mb-2">Supporting Evidence</h4>
          <div className="space-y-2">
            {event.evidence.map((ev: any, idx: number) => (
              <div key={idx} className="bg-white p-3 border border-gray-200 text-sm">
                <p className="italic text-gray-800">&quot;{ev.sentence}&quot;</p>
                <div className="mt-1 text-xs text-gray-500 flex justify-between">
                  <span className="font-bold text-black">{ev.source}</span>
                  <span>{ev.publishedAt ? new Date(ev.publishedAt).toLocaleDateString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {/* Print version */}
      <div className="hidden print:block">
        <CardContent className="pt-0 pb-4 bg-gray-50 border-t border-dashed border-gray-300">
          <h4 className="text-xs font-bold uppercase text-gray-500 mt-3 mb-2">Supporting Evidence</h4>
          <div className="space-y-2">
            {event.evidence?.slice(0, 5).map((ev: any, idx: number) => (
              <div key={idx} className="bg-white p-2 border border-gray-200 text-sm break-inside-avoid">
                <p className="italic text-gray-800">&quot;{ev.sentence}&quot;</p>
                <div className="mt-1 text-xs text-gray-500 flex justify-between">
                  <span className="font-bold text-black">{ev.source}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

/* ── Cluster Card ───────────────────────────────────────────────── */

function ClusterCard({ cluster }: { cluster: any }) {
  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="bg-gray-50 border-b border-black py-3">
        <div className="text-xs font-bold uppercase text-gray-500 mb-1">Cluster</div>
        <CardTitle className="text-lg font-bold">{cluster.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">

        {/* Canonical claim — displayed ONCE (Issue 2) */}
        {cluster.canonicalClaim && (
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-500 mb-1">Canonical Claim</h4>
            <p className="text-sm font-semibold text-gray-900 bg-yellow-50 p-2 border border-yellow-200">
              {cluster.canonicalClaim}
            </p>
          </div>
        )}

        {/* Raw supporting claims (original text, not canonical) */}
        {cluster.claims?.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Supporting Claims ({cluster.claimCount || cluster.claims.length})</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
              {cluster.claims.map((c: any, cidx: number) => {
                const text = typeof c === 'string' ? c : (c.canonicalClaim || c.id || "Unknown Claim");
                return <li key={cidx}>{text}</li>;
              })}
            </ul>
          </div>
        )}

        {/* Cluster-level evidence (Issue 1 fix) */}
        {cluster.evidence?.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Evidence ({cluster.evidenceCount})</h4>
            <div className="space-y-2">
              {cluster.evidence.slice(0, 5).map((ev: any, idx: number) => (
                <div key={idx} className="bg-white p-2 border border-gray-200 text-sm">
                  <p className="italic text-gray-800">&quot;{ev.sentence}&quot;</p>
                  <div className="mt-1 text-xs text-gray-500">
                    <span className="font-bold text-black">{ev.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metrics (Issue 3 — cluster-level, consistent) */}
        <div className="grid grid-cols-3 gap-4 text-sm font-mono bg-gray-100 p-3 border border-gray-300">
          <div>
            <div className="font-bold text-gray-500 uppercase text-xs mb-1">Sources</div>
            <div className="text-blue-700">{cluster.sourceCount}</div>
          </div>
          <div>
            <div className="font-bold text-gray-500 uppercase text-xs mb-1">Evidence</div>
            <div>{cluster.evidenceCount}</div>
          </div>
          <div>
            <div className="font-bold text-gray-500 uppercase text-xs mb-1">Consensus</div>
            <div>{(cluster.consensusScore || 0).toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Raw Claim Card ─────────────────────────────────────────────── */

function RawClaimCard({ claim }: { claim: any }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
      <CardHeader className="py-3 cursor-pointer bg-white" onClick={() => setExpanded(!expanded)}>
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-base font-bold text-gray-900 leading-tight">
            {claim.canonicalClaim}
          </CardTitle>
          <div className="flex gap-2 shrink-0">
            <Badge variant="outline" className="border-gray-300 font-mono text-xs">
              {claim.claimType}
            </Badge>
            <Badge variant="outline" className="border-black font-mono text-xs">
              {claim.confidence.toFixed(2)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-4 mt-2 font-mono text-xs text-gray-600">
          <span>Evidence: {claim.evidenceCount}</span>
          <span>Sources: {claim.sources.length}</span>
          <span className="ml-auto text-blue-600 hover:underline print:hidden">
            {expanded ? 'Hide ▲' : 'Show Evidence ▼'}
          </span>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4 bg-gray-50 border-t border-dashed border-gray-300 print:hidden">
          <div className="space-y-2 mt-3">
            {claim.evidence.map((ev: any, idx: number) => (
              <div key={idx} className="bg-white p-3 border border-gray-200 text-sm">
                <p className="italic text-gray-800">&quot;{ev.sentence}&quot;</p>
                <div className="mt-1 text-xs text-gray-500 flex justify-between">
                  <span className="font-bold text-black">{ev.source}</span>
                  <span>{ev.publishedAt ? new Date(ev.publishedAt).toLocaleDateString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
