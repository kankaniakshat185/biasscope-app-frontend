"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Loader2, Database, Network, Key, AlertTriangle, TrendingUp } from "lucide-react"

export default function IntelligenceLayer({ searchId }: { searchId: string }) {
  const [intel, setIntel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("events")

  useEffect(() => {
    async function fetchIntel() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/results/${searchId}/intelligence`)
        if (!res.ok) throw new Error("Failed to fetch intelligence layer")
        const data = await res.json()
        setIntel(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchIntel()
    const interval = setInterval(() => {
      fetchIntel()
    }, 10000)

    return () => clearInterval(interval)
  }, [searchId])

  if (loading && !intel) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-400 mt-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500 mb-4" />
        <p className="text-gray-500 font-mono text-sm">Building Intelligence Graph (Phase 2 Background Task)...</p>
      </div>
    )
  }

  if (!intel || !intel.metrics) return null

  if (intel.metrics.canonicalClaims === 0 && !loading) {
    return null;
  }

  return (
    <div className="mt-16 pt-8 border-t-4 border-black">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-sekuya)] uppercase">
            Claim Intelligence <span className="text-sm bg-yellow-300 px-2 py-1 ml-2 border border-black font-mono">BETA</span>
          </h2>
          <p className="text-gray-600 mt-2 max-w-2xl text-sm">
            BiasScope extracts verifiable facts from articles, clusters them into canonical claims, and detects cross-source events.
          </p>
        </div>
      </div>

      {/* Debug Metrics */}
      <div className="bg-gray-100 p-4 border-2 border-black mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-xs flex flex-wrap gap-6 print:hidden">
        <div className="flex items-center gap-2"><Database className="w-4 h-4" /> <span className="font-bold">DEBUG METRICS:</span></div>
        <div>Articles Processed: {intel.metrics.articlesProcessed}</div>
        <div>Claims Extracted: {intel.metrics.claimsExtracted}</div>
        <div>Canonical Claims: {intel.metrics.canonicalClaims}</div>
        <div>Clusters: {intel.metrics.clusters}</div>
        <div>Events: {intel.metrics.events}</div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-black mb-6 print:hidden">
        <button 
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 font-bold uppercase tracking-widest text-sm transition-colors ${activeTab === 'events' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
        >
          Event Explorer
        </button>
        <button 
          onClick={() => setActiveTab("clusters")}
          className={`px-4 py-2 font-bold uppercase tracking-widest text-sm transition-colors ${activeTab === 'clusters' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
        >
          Cluster Explorer
        </button>
        <button 
          onClick={() => setActiveTab("claims")}
          className={`px-4 py-2 font-bold uppercase tracking-widest text-sm transition-colors ${activeTab === 'claims' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
        >
          Claim Explorer
        </button>
      </div>

      <div className="space-y-6">
        
        {/* EVENT EXPLORER */}
        <div className={activeTab === "events" ? "block" : "hidden print:block"}>
          <div className="space-y-4">
            <h3 className="font-bold text-xl uppercase border-b border-gray-300 pb-2 hidden print:block">Top Events</h3>
            {intel.events.length === 0 && <p className="text-gray-500 italic">No events detected yet. Events require 2+ sources, 2+ claims, and 3+ evidence pieces.</p>}
            {intel.events.map((ev: any, idx: number) => (
              <Card key={idx} className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader className="bg-gray-50 border-b border-black py-3">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg font-bold">{ev.title}</CardTitle>
                    <Badge variant="outline" className="border-black font-mono shrink-0 text-xs">
                      <TrendingUp className="w-3 h-3 mr-1 inline" />
                      {(ev.importanceScore || 0).toFixed(1)}
                    </Badge>
                  </div>
                  {ev.description && (
                    <p className="text-sm text-gray-600 mt-1">{ev.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-2 font-mono text-xs text-gray-600">
                    <span>Sources: {ev.sourceCount}</span>
                    <span>Claims: {ev.claimCount || '—'}</span>
                    <span>Evidence: {ev.evidenceCount}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ev.sources?.map((s: string, sidx: number) => (
                      <Badge key={sidx} variant="secondary" className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  {ev.clusters?.length > 0 && (
                    <>
                      <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Related Claim Clusters</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {ev.clusters.map((cl: string, cidx: number) => (
                          <li key={cidx}>{cl}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CLUSTER EXPLORER */}
        <div className={activeTab === "clusters" ? "block" : "hidden"}>
          <div className="space-y-4">
            {intel.clusters.length === 0 && <p className="text-gray-500 italic">No clusters formed yet.</p>}
            {intel.clusters.map((cl: any, idx: number) => (
              <Card key={idx} className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader className="bg-gray-50 border-b border-black py-3">
                  <div className="text-xs font-bold uppercase text-gray-500 mb-1">Cluster Title</div>
                  <CardTitle className="text-lg font-bold">{cl.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {cl.canonicalClaim && cl.canonicalClaim !== cl.title && (
                    <div>
                      <h4 className="text-xs font-bold uppercase text-gray-500 mb-1">Canonical Claim</h4>
                      <p className="text-sm font-semibold text-gray-900 bg-yellow-50 p-2 border border-yellow-200">{cl.canonicalClaim}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Supporting Claims</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
                      {cl.claims.filter((c: string) => c !== cl.canonicalClaim).map((c: string, cidx: number) => (
                        <li key={cidx}>{c}</li>
                      ))}
                      {cl.claims.filter((c: string) => c !== cl.canonicalClaim).length === 0 && (
                        <li className="text-gray-400 italic">All claims canonicalized into one.</li>
                      )}
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm font-mono bg-gray-100 p-3 border border-gray-300">
                    <div>
                      <div className="font-bold text-gray-500 uppercase text-xs mb-1">Sources</div>
                      <div className="text-blue-700">{cl.sources?.join(", ") || '—'}</div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-500 uppercase text-xs mb-1">Evidence Count</div>
                      <div>{cl.evidenceCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CLAIM EXPLORER */}
        <div className={activeTab === "claims" ? "block" : "hidden print:block"}>
          <div className="space-y-4">
            <h3 className="font-bold text-xl uppercase border-b border-gray-300 pb-2 hidden print:block mt-8">Top Canonical Claims</h3>
            {intel.claims.length === 0 && <p className="text-gray-500 italic">No claims extracted yet.</p>}
            {intel.claims.slice(0, activeTab === "claims" ? 50 : 10).map((claim: any, idx: number) => (
              <ClaimCard key={idx} claim={claim} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function ClaimCard({ claim }: { claim: any }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <Card className="border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
      <CardHeader className="py-3 cursor-pointer bg-white" onClick={() => setExpanded(!expanded)}>
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-base font-bold text-gray-900 leading-tight">
            {claim.canonicalClaim}
          </CardTitle>
          <Badge variant="outline" className="border-black font-mono shrink-0">
            {claim.confidence.toFixed(2)} Conf
          </Badge>
        </div>
        <div className="flex gap-4 mt-2 font-mono text-xs text-gray-600">
          <span>Evidence Count: {claim.evidenceCount}</span>
          <span>Unique Sources: {claim.sources.length}</span>
          <span className="ml-auto text-blue-600 hover:underline print:hidden">{expanded ? 'Hide Evidence ▲' : 'Show Evidence ▼'}</span>
        </div>
      </CardHeader>
      
      <div className="hidden print:block mt-4 mb-4">
        <CardContent className="pt-0 pb-4 bg-gray-50 border-t border-dashed border-gray-300">
          <h4 className="text-xs font-bold uppercase text-gray-500 mt-4 mb-3">Supporting Evidence</h4>
          <div className="space-y-3">
            {claim.evidence.map((ev: any, idx: number) => (
              <div key={idx} className="bg-white p-3 border border-gray-200 text-sm break-inside-avoid">
                <p className="italic text-gray-800">&quot;{ev.sentence}&quot;</p>
                <div className="mt-2 text-xs text-gray-500 flex justify-between">
                  <span className="font-bold text-black">{ev.source}</span>
                  <span>{ev.publishedAt ? new Date(ev.publishedAt).toLocaleDateString() : 'Unknown Date'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </div>

      {expanded && (
        <CardContent className="pt-0 pb-4 bg-gray-50 border-t border-dashed border-gray-300 print:hidden">
          <h4 className="text-xs font-bold uppercase text-gray-500 mt-4 mb-3">Supporting Evidence</h4>
          <div className="space-y-3">
            {claim.evidence.map((ev: any, idx: number) => (
              <div key={idx} className="bg-white p-3 border border-gray-200 text-sm">
                <p className="italic text-gray-800">&quot;{ev.sentence}&quot;</p>
                <div className="mt-2 text-xs text-gray-500 flex justify-between">
                  <span className="font-bold text-black">{ev.source}</span>
                  <span>{ev.publishedAt ? new Date(ev.publishedAt).toLocaleDateString() : 'Unknown Date'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
