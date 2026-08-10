"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { SentimentOverTime, BiasDistribution, SourceDistribution } from "../../../components/Charts"
import { Loader2, Info, BellRing } from "lucide-react"
import IntelligenceLayer from "./IntelligenceLayer"
import { authClient } from "../../../lib/auth-client"
import { api } from "../../../lib/api"

// Mirrors the tier labels returned by get_source_reliability() in
// app/services/nlp.py on the backend — this is styling only, not a second
// copy of the domain-to-tier mapping itself (see A3 in AUDIT_TASKS.md).
const RELIABILITY_STYLES: Record<string, string> = {
  High: "bg-green-100 text-green-800 border-green-300",
  Medium: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Mixed: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Low: "bg-red-100 text-red-800 border-red-300",
  Unknown: "bg-gray-200 text-gray-700 border-gray-300",
}

export default function DashboardPage() {
  const params = useParams()
  const { id } = params
  const { data: session } = authClient.useSession()
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [filterBias, setFilterBias] = useState<string | null>(null)
  const [subscribing, setSubscribing] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = async () => {
    if (!session?.user?.id || !data?.query) return
    setSubscribing(true)
    try {
      if (subscribed) {
        // userId no longer passed — the backend resolves it from the session cookie.
        const res = await api.delete(`/subscriptions?topic=${encodeURIComponent(data.query)}`)
        if (res.ok) setSubscribed(false)
      } else {
        const res = await api.post("/subscriptions", { topic: data.query })
        if (res.ok) setSubscribed(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubscribing(false)
    }
  }

  // Check if initially subscribed
  useEffect(() => {
    if (session?.user?.id && data?.query) {
      api.get("/subscriptions")
        .then(res => res.json())
        .then(subs => {
          if (Array.isArray(subs) && subs.some((s: any) => s.topic === data.query.toLowerCase())) {
            setSubscribed(true)
          }
        })
        .catch(err => console.error(err))
    }
  }, [session, data?.query])

  useEffect(() => {
    async function fetchData() {
      try {
        let res;
        if (typeof id === 'string' && id.startsWith('demo-')) {
          const topic = decodeURIComponent(id.replace('demo-', ''))
          res = await api.get(`/demo/${topic}`)
          if (!res.ok) throw new Error("We couldn't load the demo snapshot for this topic.")
          const result = await res.json()
          setData(result.search)
        } else {
          res = await api.get(`/results/${id}`)
          if (!res.ok) throw new Error("We couldn't find any news articles for this specific topic. Try searching for a broader term or a more recent event.")
          const result = await res.json()
          if (!result || !result.articles || result.articles.length === 0) {
            throw new Error("We couldn't find any valid news articles for this specific topic. The sources may have been filtered out due to irrelevance.")
          }
          setData(result)
        }
      } catch (err: any) {
        console.error(err)
        setErrorMsg(err.message || "An unexpected error occurred while fetching the analysis.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-gray-900 bg-gray-50">
      <Loader2 className="w-12 h-12 animate-spin text-black mb-4" />
      <div className="font-bold uppercase tracking-widest text-xs font-mono animate-pulse">Running Analysis Pipeline...</div>
    </div>
  )

  if (errorMsg || !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center text-slate-900 bg-gray-50">
      <div className="max-w-md w-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
        <h2 className="text-2xl font-bold font-[family-name:var(--font-oswald)] uppercase mb-4 text-red-600">Analysis Failed</h2>
        <p className="text-gray-700 font-medium">{errorMsg || "Results not found."}</p>
        <button onClick={() => window.location.href = '/'} className="mt-8 w-full px-6 py-3 bg-black text-white font-bold uppercase tracking-widest text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] transition-all">Return Home</button>
      </div>
    </div>
  )

  const insights = data.insights && data.insights[0] ? data.insights[0] : null
  const articles = data.articles || []
  
  // Calculate source frequency for the chart
  const sourceDist = articles.reduce((acc: any, article: any) => {
    acc[article.source] = (acc[article.source] || 0) + 1
    return acc
  }, {})

  const displayedArticles = filterBias ? articles.filter((a: any) => a.biasLabel === filterBias) : articles
  
  const renderWithBoldCitations = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span key={i} className="font-bold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-[#F6F6F6] font-[family-name:var(--font-geist-sans)] min-h-screen text-[#1A1A1A] flex flex-col">
      
      {/* Sticky Horizontal Nav Bar - Full Width */}
      <div className="sticky top-[80px] z-40 bg-[#F6F6F6] border-b-4 border-black py-4 px-6 print:hidden hidden md:block w-full">
        <ul className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-black max-w-7xl mx-auto w-full">
          <li><a href="#overview" className="hover:underline underline-offset-4 decoration-2">Overview</a></li>
          <li><a href="#bias-visuals" className="hover:underline underline-offset-4 decoration-2">Bias Visuals</a></li>
          <li><a href="#source-distribution" className="hover:underline underline-offset-4 decoration-2">SOURCES</a></li>
          <li><a href="#intelligence-layer" className="hover:underline underline-offset-4 decoration-2">Intelligence</a></li>
          <li><a href="#source-articles" className="hover:underline underline-offset-4 decoration-2">Source Articles</a></li>
        </ul>
      </div>

      <div className="max-w-7xl mx-auto space-y-16 w-full px-12 py-10 flex-1">
        
        {/* Header — same bordered/shadowed card treatment as the metrics
            bar and every other section below, so it doesn't read as a
            leftover unstyled element sitting above the "real" dashboard. */}
        <div id="overview" className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 scroll-mt-32">
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-sekuya)]">Intelligence Dashboard</h1>
              <p className="text-black-500 mt-2 flex flex-row items-center gap-2">
                Analysis for Topic: <span className="font-semibold text-blue-600 truncate max-w-[200px] md:max-w-[400px]" title={data.query}>{data.query}</span> <span>in <span className="capitalize">{data.category || 'General'}</span></span>
              </p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {session && (
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className={`print:hidden h-12 flex-1 sm:w-48 uppercase tracking-widest font-bold rounded-none px-2 text-[10px] flex items-center justify-center gap-2 border-2 border-black transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none ${
                    subscribed
                      ? "bg-[#FFF200] text-black hover:bg-red-500 hover:text-white group"
                      : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  <BellRing className="w-4 h-4 shrink-0" />
                  <span className="group-hover:hidden truncate">{subscribed ? "Subscribed" : subscribing ? "Loading..." : "Track Weekly"}</span>
                  <span className="hidden group-hover:block truncate">{subscribed ? "Unsubscribe" : ""}</span>
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="print:hidden h-12 flex-1 sm:w-48 bg-black text-white border-2 border-black rounded-none hover:bg-gray-800 uppercase tracking-widest font-bold px-2 text-[10px] flex items-center justify-center transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Download Report
              </button>
            </div>
          </div>
          
          {/* Metric Cards - Unified Metrics Bar */}
          {insights && (
            <div className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white flex flex-col lg:flex-row divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-black">
              {/* Data Funnel */}
              <div className="flex-1 p-5 flex flex-col">
                <div className="uppercase tracking-widest text-xs font-bold border-b-2 border-black pb-2 mb-3 text-black">Data Funnel</div>
                <div className="text-xs flex flex-col gap-1.5 flex-1 justify-center text-left">
                  <div className="flex justify-between"><span className="text-[#666] font-medium">Raw Articles:</span><span className="font-mono">{insights.totalArticles}</span></div>
                  <div className="flex justify-between" title="Includes exact duplicate URLs, near-duplicate titles, and articles with no title at all — not purely duplication."><span className="text-[#666] font-medium">Filtered:</span><span className="font-mono text-red-500">-{insights.duplicatesRemoved}</span></div>
                  <div className="flex justify-between"><span className="text-[#666] font-medium">Invalid Text:</span><span className="font-mono text-red-500">-{insights.missingContent}</span></div>
                  <div className="flex justify-between pt-2 mt-1"><span className="font-semibold text-blue-700 tracking-wide">Analyzed:</span><span className="font-mono font-bold text-sm">{insights.validArticles}</span></div>
                </div>
              </div>

              {/* Avg Sentiment */}
              <div className="flex-1 p-5 flex flex-col">
                <div className="uppercase tracking-widest text-xs font-bold border-b-2 border-black pb-2 mb-3 text-black">Avg Sentiment</div>
                <div className="flex flex-col justify-center flex-1 text-left">
                  <div className="text-3xl font-[800]">{Number(insights.avgSentiment).toFixed(2)}</div>
                  <p className="text-xs text-[#666] mt-2 tracking-wide font-medium">Scale -1.0 to 1.0</p>
                </div>
              </div>

              {/* Polarization Index */}
              <div className="flex-1 p-5 flex flex-col">
                <div className="uppercase tracking-widest text-xs font-bold border-b-2 border-black pb-2 mb-3 flex justify-between items-center text-black">
                  Polarization
                  <div className="group relative flex items-center">
                  <Info className="w-4 h-4 text-black cursor-help" />
                  <div className="hidden group-hover:block absolute bottom-full mb-2 right-0 bg-white border-2 border-black p-2 text-xs font-mono font-bold w-48 z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left normal-case tracking-normal">
                    Calculated using Jensen-Shannon Divergence between ideological distributions.
                  </div>
                </div>
                </div>
                <div className="flex flex-col justify-center flex-1 text-left">
                  {/* R9: null (not 0) means "no LEFT or no RIGHT articles to
                      compare" — a real, common case, not "perfectly
                      balanced coverage." Rendering it as 0% used to make
                      those indistinguishable. */}
                  {insights.polarizationScore == null ? (
                    <>
                      <div className="text-3xl font-[800] text-gray-400">—</div>
                      <p className="text-xs text-[#666] mt-2 tracking-wide font-medium">Not enough data (needs both Left and Right coverage)</p>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-[800] text-red-500">{Number(insights.polarizationScore * 100).toFixed(0)}%</div>
                      <p className="text-xs text-[#666] mt-2 tracking-wide font-medium">
                        {insights.polarizationScore < 0.25 ? "Low" : insights.polarizationScore < 0.60 ? "Moderate" : "High"} Divergence
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Data Quality Score */}
              <div className="flex-1 p-5 flex flex-col">
                <div className="uppercase tracking-widest text-xs font-bold border-b-2 border-black pb-2 mb-3 flex justify-between items-center text-black">
                  Data Quality
                  <div className="group relative flex items-center">
                  <Info className="w-4 h-4 text-black cursor-help" />
                  <div className="hidden group-hover:block absolute bottom-full mb-2 right-0 bg-white border-2 border-black p-2 text-xs font-mono font-bold w-48 z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left normal-case tracking-normal">
                    Metric combining source diversity, content completeness, and article richness.
                  </div>
                </div>
                </div>
                <div className="flex flex-col justify-center flex-1 text-left">
                  <div className="text-3xl font-[800] text-purple-600">{Number(insights.dataQualityScore * 100).toFixed(0)}</div>
                  <p className="text-xs text-[#666] mt-2 tracking-wide font-medium">
                    {insights.dataQualityScore > 0.8 ? "Excellent" : insights.dataQualityScore > 0.6 ? "Good" : "Fair"} Quality
                  </p>
                </div>
              </div>

              {/* Source Reliability */}
              <div className="flex-1 p-5 flex flex-col">
                <div className="uppercase tracking-widest text-xs font-bold border-b-2 border-black pb-2 mb-3 flex justify-between items-center text-black">
                  Reliability
                  <div className="group relative flex items-center">
                  <Info className="w-4 h-4 text-black cursor-help" />
                  <div className="hidden group-hover:block absolute bottom-full mb-2 right-0 bg-white border-2 border-black p-2 text-xs font-mono font-bold w-48 z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left normal-case tracking-normal">
                    Reliability is calculated using weighted publisher credibility scores across the analyzed dataset.
                  </div>
                </div>
                </div>
                <div className="flex flex-col justify-center flex-1 text-left">
                  <div className="text-3xl font-[800] text-blue-500">
                    {insights.driftMetrics && insights.driftMetrics.source_reliability_confidence ? Number(insights.driftMetrics.source_reliability_confidence * 100).toFixed(0) : "N/A"}%
                  </div>
                  <div className="mt-3 text-xs text-[#666] flex justify-between gap-1 font-mono">
                    <span className="text-green-600 font-bold" title="High Credibility">H:{insights.driftMetrics?.credibility_breakdown?.High || 0}</span>
                    <span className="text-yellow-600 font-bold" title="Medium Credibility">M:{insights.driftMetrics?.credibility_breakdown?.Medium || 0}</span>
                    <span className="text-orange-500 font-bold" title="Mixed Credibility">Mx:{insights.driftMetrics?.credibility_breakdown?.Mixed || 0}</span>
                    <span className="text-red-600 font-bold" title="Low Credibility">L:{insights.driftMetrics?.credibility_breakdown?.Low || 0}</span>
                  </div>
                </div>
              </div>

              {/* Dataset Diversity */}
              <div className="flex-1 p-5 flex flex-col">
                <div className="uppercase tracking-widest text-xs font-bold border-b-2 border-black pb-2 mb-3 flex justify-between items-center text-black">
                  Diversity
                  <div className="group relative flex items-center">
                  <Info className="w-4 h-4 text-black cursor-help flex-shrink-0" />
                  <div className="hidden group-hover:block absolute bottom-full mb-2 right-0 bg-white border-2 border-black p-2 text-xs font-mono font-bold w-56 z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left normal-case tracking-normal">
                    Measures the breadth of sources and the ideological distribution of the coverage to ensure a representative sample.
                  </div>
                </div>
                </div>
                <div className="flex flex-col justify-center flex-1 gap-2 text-left">
                  <div className="text-xs tracking-wide font-medium text-[#666]">{insights.datasetMetrics?.diversity_quality_label || "Unknown"}</div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-[#666]">Pubs: <span className="font-mono text-[#1A1A1A]">{insights.datasetMetrics?.source_diversity || 0}</span></span>
                    <span className="text-[#666]">Geos: <span className="font-mono text-[#1A1A1A]" title={(insights.datasetMetrics?.geographic_diversity?.countries || []).join(", ")}>{insights.datasetMetrics?.geographic_diversity?.count || 0}</span></span>
                  </div>
                  <div className="flex justify-between text-xs mt-1 font-mono">
                    <span className="text-blue-600" title="Left">L:{insights.datasetMetrics?.coverage_imbalance?.LEFT || 0}%</span>
                    <span className="text-[#666]" title="Center">C:{insights.datasetMetrics?.coverage_imbalance?.CENTER || 0}%</span>
                    <span className="text-red-600" title="Right">R:{insights.datasetMetrics?.coverage_imbalance?.RIGHT || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Narrative & Keywords */}
        {insights && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="rounded-none lg:col-span-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black bg-white">
              <CardHeader className="border-b-2 border-black pb-4">
                <CardTitle className="uppercase tracking-widest text-sm font-bold flex items-center gap-2">✨ AI Narrative Summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col pt-6">
                <p className="text-base leading-[1.8] max-w-[75ch] text-[#1A1A1A] pb-4">
                  {renderWithBoldCitations(insights.narrativeSummary)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black bg-white">
              <CardHeader className="border-b-2 border-black pb-4">
                <CardTitle className="uppercase tracking-widest text-sm font-bold flex items-center gap-2">🏷️ Top Keywords</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pt-6">
                <p className="text-xs text-[#666] leading-relaxed font-medium">
                  Extracted via Named Entity Recognition (NER). These terms represent the most statistically significant actors and topics anchoring the dataset's underlying narrative bias.
                </p>
                <div className="flex flex-wrap gap-2">
                  {insights.topKeywords && (insights.topKeywords as any[]).map((kw: any) => (
                    <Badge key={kw.word || kw} variant="secondary" className="rounded-none px-3 py-1 bg-gray-50 text-[#1A1A1A] border-2 border-black font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 transition-colors">
                      {kw.word || kw} {kw.count && <span className="ml-1 text-gray-400">({kw.count})</span>}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contrastive Echo Chambers */}
        {insights && (insights.leftWingSummary || insights.rightWingSummary) && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-sekuya)] uppercase flex items-center flex-wrap gap-3">
              Contrastive Echo Chambers
              <span className="text-sm bg-yellow-300 px-2 py-1 border border-black font-mono tracking-normal leading-none text-black">BETA</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                onClick={() => setFilterBias(filterBias === "LEFT" ? null : "LEFT")}
                // overflow-visible overrides the Card component's own
                // baked-in `overflow-hidden` (see ui/card.tsx) — without
                // it, the tooltip popup below gets clipped right at the
                // card's edge since it needs to render above the card.
                className={`rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black cursor-pointer transition-all overflow-visible ${filterBias === 'LEFT' ? 'ring-4 ring-blue-500 bg-blue-100 dark:bg-blue-900/30' : 'bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/10'}`}
              >
                <CardHeader>
                  <CardTitle className="text-blue-800 dark:text-blue-300 font-[family-name:var(--font-oswald)] uppercase tracking-wider flex justify-between items-center">
                    The Left-Wing Echo Chamber
                    <div className="group relative flex items-center">
                      <Info className="w-4 h-4 text-blue-400 cursor-help" />
                      <div className="hidden group-hover:block absolute bottom-full mb-2 right-0 bg-white border-2 border-black p-2 text-xs font-mono font-bold w-64 z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left normal-case tracking-normal">
                        Click this card to show only Left-leaning sources in the article feed below. Summary generated by an LLM extracting common themes from left-leaning publications.
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-blue-900/80 dark:text-blue-100">{renderWithBoldCitations(insights.leftWingSummary)}</p>
                </CardContent>
              </Card>
              <Card
                onClick={() => setFilterBias(filterBias === "RIGHT" ? null : "RIGHT")}
                className={`rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black cursor-pointer transition-all overflow-visible ${filterBias === 'RIGHT' ? 'ring-4 ring-red-500 bg-red-100 dark:bg-red-900/30' : 'bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/10'}`}
              >
                <CardHeader>
                  <CardTitle className="text-red-800 dark:text-red-300 font-[family-name:var(--font-oswald)] uppercase tracking-wider flex justify-between items-center">
                    The Right-Wing Echo Chamber
                    <div className="group relative flex items-center">
                      <Info className="w-4 h-4 text-red-400 cursor-help" />
                      <div className="hidden group-hover:block absolute bottom-full mb-2 right-0 bg-white border-2 border-black p-2 text-xs font-mono font-bold w-64 z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left normal-case tracking-normal">
                        Click this card to show only Right-leaning sources in the article feed below. Summary generated by an LLM extracting common themes from right-leaning publications.
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-red-900/80 dark:text-red-100">{renderWithBoldCitations(insights.rightWingSummary)}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Entity Sentiment Graph */}
        {insights && insights.entitySentiment && Object.keys(insights.entitySentiment).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-sekuya)] uppercase flex items-center flex-wrap gap-3">
              Entity Sentiment Analysis
              <span className="text-sm bg-yellow-300 px-2 py-1 border border-black font-mono tracking-normal leading-none text-black">BETA</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(insights.entitySentiment).map(([entity, data]: [string, any]) => (
                <Card key={entity} className="rounded-none border-2 border-black hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <CardHeader className="pb-2 pt-4 flex flex-row justify-between items-center gap-2">
                    <CardTitle className="text-base truncate">{entity}</CardTitle>
                    <Badge variant="outline" className="text-[10px] bg-yellow-100">{data.label}</Badge>
                  </CardHeader>
                  <CardContent className="text-sm flex flex-col gap-1 pb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 font-semibold text-xs">Left Media:</span>
                      <span className="font-mono text-xs">{data.avg_left_sentiment.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-600 font-semibold text-xs">Right Media:</span>
                      <span className="font-mono text-xs">{data.avg_right_sentiment.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-dashed border-gray-300 text-[10px] text-gray-500 uppercase tracking-widest text-center">
                      Mentioned in {data.mentions} articles
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        <div id="bias-visuals" className="grid grid-cols-1 lg:grid-cols-3 gap-6 scroll-mt-32">
          <Card className="rounded-none col-span-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="uppercase tracking-widest text-sm font-bold">Sentiment Trend</CardTitle>
            </CardHeader>
            <CardContent className="pt-4"><SentimentOverTime data={articles} /></CardContent>
          </Card>
          <Card className="rounded-none col-span-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="uppercase tracking-widest text-sm font-bold">Source Origin</CardTitle>
            </CardHeader>
            <CardContent className="pt-4"><SourceDistribution data={sourceDist} /></CardContent>
          </Card>
          <Card className="rounded-none col-span-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="uppercase tracking-widest text-sm font-bold">Political Bias Check</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {insights && <BiasDistribution data={insights.biasDistribution} />}
            </CardContent>
          </Card>
        </div>

        {/* Intelligence Layer */}
        <div id="intelligence-layer" className="scroll-mt-32">
          <IntelligenceLayer searchId={id as string} />
        </div>

        {/* Article Cards Grid */}
        <div id="source-articles" className="space-y-4 scroll-mt-32">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-sekuya)] uppercase">Analyzed Articles</h2>
            {filterBias && (
              <button 
                onClick={() => setFilterBias(null)}
                className="text-xs uppercase tracking-widest font-bold text-black hover:text-red-600 bg-gray-200 px-3 py-1 border border-black hover:-translate-y-0.5 transition-transform"
              >
                Showing {filterBias} Only ✕
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayedArticles.map((art: any) => (
              <ArticleChatCard key={art.id} art={art} />
            ))}
          </div>
        </div>

      </div>

      <div className="w-full border-t-[3px] border-black mt-4 max-w-5xl mx-auto print:hidden">
        <div className="text-center font-black text-sm md:text-base uppercase tracking-widest text-black py-8 font-[family-name:var(--font-sekuya)]">
          BIASSCOPE. CLARIFYING NARRATIVES.
        </div>
      </div>
    </div>
  )
}

function ArticleChatCard({ art }: { art: any }) {
  const [chatOpen, setChatOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question) return
    setLoading(true)
    setAnswer("")

    try {
      const res = await api.post("/chat-with-article", { articleId: art.id, message: question })
      const data = await res.json()
      setAnswer(data.answer)
    } catch (err) {
      setAnswer("Failed to connect to AI.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="rounded-none hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow border-2 border-black flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-lg leading-tight line-clamp-2 font-[family-name:var(--font-oswald)]">
            <a href={art.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{art.title}</a>
          </CardTitle>
          <Badge variant={art.sentiment === "positive" ? "default" : art.sentiment === "negative" ? "destructive" : "secondary"}>
            {art.sentiment}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="text-sm text-gray-500 flex flex-col gap-4">
        <div className="flex justify-between items-center bg-gray-50 p-2 border-2 border-dashed border-black/20">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">{art.source}</span>
            <span className="text-gray-300">•</span>
            <span className="italic">{art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : 'Unknown Date'}</span>
            <span className="text-gray-300">•</span>
            <span className="font-bold">Score: {(art.sentimentScore || 0).toFixed(2)}</span>
          </div>
        </div>

        {art.entities && Object.keys(art.entities).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(art.entities).map(([ent, label]) => (
              <span key={ent} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-slate-700">
                {ent} <span className="opacity-50 uppercase ml-1">({String(label)})</span>
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-2 border-t border-dashed border-gray-300 pt-3">
          <button 
            onClick={() => setChatOpen(!chatOpen)}
            className="text-xs uppercase tracking-widest font-extrabold flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            {chatOpen ? "Close AI Chat" : "Ask Llama-3 About This Article"}
          </button>

          <div className="flex gap-2 items-center">
            {/* Reliability tier now comes straight from the backend's
                SOURCE_RELIABILITY registry (app/services/nlp.py) instead of
                a second, independently-maintained domain list here — the
                two used to disagree on real domains (e.g. cnn.com, ndtv.com). */}
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 uppercase tracking-wider ${RELIABILITY_STYLES[art.reliabilityTier as string] || RELIABILITY_STYLES.Unknown}`}>
              {(art.reliabilityTier || "Unknown")} Credibility
            </Badge>
            <span className="font-bold text-black uppercase tracking-wider text-xs flex gap-1 items-center">
              Bias: {art.biasLabel}
              {/* R6: was `deviationScore > 0`, which fired identically for a
                  trivial one-notch shift (e.g. a usually-CENTER source
                  running one LEFT-leaning piece) and a full LEFT<->RIGHT
                  flip — both got the same alarming "ANOMALY" treatment.
                  deviationScore only ranges 0-2 (LEFT=0, CENTER=1, RIGHT=2),
                  so >= 2 restricts the badge to the genuinely extreme case.
                  Doesn't fix the bigger gap this can't address on its own —
                  sources outside the ~40-domain SOURCE_BIAS_REGISTRY always
                  get sourceBias="UNKNOWN", which forces deviationScore to 0
                  regardless of actual content, so this can never flag the
                  long tail of unregistered sources at all. A real fix needs
                  a per-source historical baseline instead of a static
                  registry — bigger, separate effort. See AUDIT_TASKS.md R6. */}
              {art.deviationScore >= 2 && (
                <div className="relative group flex items-center">
                  <span className="bg-red-600 text-white px-1 py-0.5 rounded-sm text-[8px] animate-pulse cursor-pointer">
                    ⚠️ ANOMALY
                  </span>
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-black text-white p-3 text-xs shadow-xl rounded hidden group-hover:block z-10 pointer-events-none">
                    <div className="font-bold border-b border-gray-700 pb-1 mb-2 text-red-400">Narrative Anomaly Detected</div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">Historical Source Bias:</span>
                      <span className="font-bold">{art.sourceBias}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">Current Article Bias:</span>
                      <span className="font-bold">{art.biasLabel}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Deviation Score:</span>
                      <span className="font-bold">{art.deviationScore.toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 border-t border-gray-700 pt-1 leading-tight">
                      This article's framing differs significantly from the publisher's historical ideological profile.
                    </div>
                  </div>
                </div>
              )}
            </span>
          </div>
        </div>

        {chatOpen && (
          <div className="mt-2 bg-gray-100 p-4 border-l-4 border-blue-600 flex flex-col gap-3">
            <form onSubmit={handleAsk} className="flex gap-2">
              <input 
                type="text" 
                placeholder="What exactly did they outline in this article?" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-black focus:outline-none font-[family-name:var(--font-geist-sans)] normal-case font-normal tracking-normal text-sm"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="bg-black text-white px-4 py-2 uppercase font-bold text-xs hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Thinking..." : "Ask"}
              </button>
            </form>
            
            {answer && (
              <div className="bg-white border-2 border-black p-3 text-black text-sm relative">
                <span className="absolute -top-3 left-2 bg-white px-1 text-xs font-bold uppercase text-blue-600">AI Response</span>
                {answer}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

