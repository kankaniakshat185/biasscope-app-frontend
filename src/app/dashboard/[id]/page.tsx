"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { SentimentOverTime, BiasDistribution, SourceDistribution } from "../../../components/Charts"
import { Loader2, Info } from "lucide-react"

export default function DashboardPage() {
  const params = useParams()
  const { id } = params
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterBias, setFilterBias] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/results/${id}`)
        if (!res.ok) throw new Error("Results not found")
        const result = await res.json()
        setData(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-900 dark:text-gray-100">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
    </div>
  )

  if (!data) return <div className="p-8 text-center">Results not found.</div>

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
    <div className="font-[family-name:var(--font-geist-sans)] min-h-screen text-slate-900 dark:text-slate-100 p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-sekuya)]">Intelligence Dashboard</h1>
            <p className="text-black-500 mt-2 flex flex-row items-center gap-2">
              Analysis for Topic: <span className="font-semibold text-blue-600 truncate max-w-[200px] md:max-w-[400px]" title={data.query}>{data.query}</span> <span>in <span className="capitalize">{data.category}</span></span>
            </p>
          </div>
          
          <button 
            onClick={() => window.print()}
            className="print:hidden h-12 bg-black text-white hover:bg-gray-800 uppercase tracking-widest font-bold px-6 flex items-center justify-center border-2 border-black transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
          >
            Download Report
          </button>
        </div>
        
        {/* Metric Cards */}
        {insights && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="col-span-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
              <CardHeader className="pb-2 border-b-2 border-black">
                <CardTitle className="uppercase tracking-widest text-sm font-bold">Data Funnel</CardTitle>
              </CardHeader>
              <CardContent className="text-sm pt-4 flex flex-col gap-2">
                <div className="flex justify-between border-b border-dashed border-gray-300 pb-1">
                  <span className="text-gray-600 font-medium">Raw Articles:</span>
                  <span className="font-mono">{insights.totalArticles}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-gray-300 pb-1">
                  <span className="text-gray-600 font-medium">- Duplicates:</span>
                  <span className="font-mono text-red-500">-{insights.duplicatesRemoved}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-gray-300 pb-1">
                  <span className="text-gray-600 font-medium">- Invalid Text:</span>
                  <span className="font-mono text-red-500">-{insights.missingContent}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="font-bold text-blue-700 uppercase tracking-wider text-xs">Analyzed:</span>
                  <span className="font-mono font-bold text-base">{insights.validArticles}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
              <CardHeader className="pb-2 border-b-2 border-black">
                <CardTitle className="uppercase tracking-widest text-sm font-bold">Avg Sentiment</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold">{Number(insights.avgSentiment).toFixed(2)}</div>
                <p className="text-xs text-black-400 mt-1">Scale between -1.0 to 1.0</p>
              </CardContent>
            </Card>
            <Card className="col-span-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
              <CardHeader className="pb-2 border-b-2 border-black">
                <CardTitle className="flex justify-between items-center uppercase tracking-widest text-sm font-bold">
                  Polarization Index
                  <div title="Measures the semantic and emotional divergence between Left-leaning and Right-leaning media. A higher index indicates highly opposed echo chambers.">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-red-500">{Number(insights.dataQualityScore * 100).toFixed(0)}%</div>
                <p className="text-xs text-black-400 mt-1">Divergence between Left vs Right</p>
              </CardContent>
            </Card>
            <Card className="col-span-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
              <CardHeader className="pb-2 border-b-2 border-black">
                <CardTitle className="flex justify-between items-center uppercase tracking-widest text-sm font-bold">
                  Source Reliability
                  <span title="The average credibility of the publishers in this dataset. High credibility sources (e.g. Reuters, BBC) increase this score, while highly partisan or unverified sources lower it.">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-blue-500">
                  {insights.driftMetrics && insights.driftMetrics.source_reliability_confidence ? Number(insights.driftMetrics.source_reliability_confidence * 100).toFixed(0) : "N/A"}%
                </div>
                <p className="text-xs text-black-400 mt-1">Publisher credibility score</p>
              </CardContent>
            </Card>
            <Card className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
              <CardHeader className="pb-2 border-b-2 border-black">
                <CardTitle className="flex justify-between items-center uppercase tracking-widest text-sm font-bold">
                  Dataset Diversity
                  <div title="Measures the breadth of sources and the ideological distribution of the coverage to ensure a representative sample.">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-2">
                <div className="flex justify-between border-b border-dashed border-gray-300 pb-1 text-sm">
                  <span className="text-gray-600 font-medium">Unique Publishers:</span>
                  <span className="font-mono font-bold">{insights.datasetMetrics?.source_diversity || "N/A"}</span>
                </div>
                <div className="flex flex-col pt-1 text-xs text-gray-500">
                  <span className="font-bold text-gray-700 uppercase tracking-wider mb-1">Coverage Imbalance:</span>
                  <div className="flex justify-between font-mono">
                    <span className="text-blue-600">L: {insights.datasetMetrics?.coverage_imbalance?.LEFT || 0}%</span>
                    <span className="text-gray-600">C: {insights.datasetMetrics?.coverage_imbalance?.CENTER || 0}%</span>
                    <span className="text-red-600">R: {insights.datasetMetrics?.coverage_imbalance?.RIGHT || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Narrative & Keywords */}
        {insights && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
              <CardHeader className="border-b-2 border-black">
                <CardTitle className="uppercase tracking-widest text-sm font-bold">AI Narrative Summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col">
                <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 pb-4">
                  {renderWithBoldCitations(insights.narrativeSummary)}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
              <CardHeader className="border-b-2 border-black">
                <CardTitle className="uppercase tracking-widest text-sm font-bold">Top Keywords discovered</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-4">
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                  Extracted via Named Entity Recognition (NER). These terms represent the most statistically significant actors and topics anchoring the dataset's underlying narrative bias.
                </p>
                <div className="flex flex-wrap gap-2">
                  {insights.topKeywords && (insights.topKeywords as any[]).map((kw: any) => (
                    <Badge key={kw.word || kw} variant="secondary" className="px-3 py-1 bg-white text-gray-700 border border-gray-300 font-normal shadow-none hover:bg-gray-50 transition-colors">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              onClick={() => setFilterBias(filterBias === "LEFT" ? null : "LEFT")}
              className={`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black cursor-pointer transition-all ${filterBias === 'LEFT' ? 'ring-4 ring-blue-500 bg-blue-100 dark:bg-blue-900/30' : 'bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/10'}`}
            >
              <CardHeader>
                <CardTitle className="text-blue-800 dark:text-blue-300 font-[family-name:var(--font-oswald)] uppercase tracking-wider flex justify-between items-center">
                  The Left-Wing Echo Chamber
                  <div title="Click to filter the article feed below to ONLY show Left-leaning sources. Summary generated by an LLM extracting common themes from left-leaning publications.">
                    <Info className="w-4 h-4 text-blue-400 cursor-help" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-blue-900/80 dark:text-blue-100">{renderWithBoldCitations(insights.leftWingSummary)}</p>
              </CardContent>
            </Card>
            <Card 
              onClick={() => setFilterBias(filterBias === "RIGHT" ? null : "RIGHT")}
              className={`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black cursor-pointer transition-all ${filterBias === 'RIGHT' ? 'ring-4 ring-red-500 bg-red-100 dark:bg-red-900/30' : 'bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/10'}`}
            >
              <CardHeader>
                <CardTitle className="text-red-800 dark:text-red-300 font-[family-name:var(--font-oswald)] uppercase tracking-wider flex justify-between items-center">
                  The Right-Wing Echo Chamber
                  <div title="Click to filter the article feed below to ONLY show Right-leaning sources. Summary generated by an LLM extracting common themes from right-leaning publications.">
                    <Info className="w-4 h-4 text-red-400 cursor-help" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-red-900/80 dark:text-red-100">{renderWithBoldCitations(insights.rightWingSummary)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Entity Sentiment Graph */}
        {insights && insights.entitySentiment && Object.keys(insights.entitySentiment).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-sekuya)]">Entity Sentiment Analysis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(insights.entitySentiment).map(([entity, data]: [string, any]) => (
                <Card key={entity} className="border-2 border-black hover:-translate-y-1 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="uppercase tracking-widest text-sm font-bold">Sentiment Trend</CardTitle>
            </CardHeader>
            <CardContent className="pt-4"><SentimentOverTime data={articles} /></CardContent>
          </Card>
          <Card className="col-span-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="uppercase tracking-widest text-sm font-bold">Source Origin</CardTitle>
            </CardHeader>
            <CardContent className="pt-4"><SourceDistribution data={sourceDist} /></CardContent>
          </Card>
          <Card className="col-span-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="uppercase tracking-widest text-sm font-bold">Political Bias Check</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {insights && <BiasDistribution data={insights.biasDistribution} />}
            </CardContent>
          </Card>
        </div>

        {/* Article Cards Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b-2 border-black pb-2">
            <h2 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-sekuya)]">Analyzed Articles</h2>
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/chat-with-article`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: art.id, message: question })
      })
      const data = await res.json()
      setAnswer(data.answer)
    } catch (err) {
      setAnswer("Failed to connect to AI.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow border-2 border-black flex flex-col">
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
            {(() => {
              const s = art.source.toLowerCase();
              const high = ["reuters.com", "apnews.com", "bbc.co.uk", "bbc.com", "npr.org", "thehindu.com", "indianexpress.com", "ft.com", "wsj.com", "bloomberg.com", "theguardian.com", "nytimes.com", "washingtonpost.com", "economist.com", "latimes.com", "aljazeera.com", "cbsnews.com", "pbs.org", "propublica.org", "time.com", "scientificamerican.com", "nature.com"];
              const mixed = ["foxnews.com", "cnn.com", "msnbc.com", "dailymail.co.uk", "nypost.com", "republicworld.com", "opindia.com", "thewire.in", "ndtv.com", "timesofindia", "usatoday.com", "businessinsider.com", "forbes.com", "newsweek.com", "telegraph.co.uk", "vice.com", "buzzfeednews.com", "cnet.com", "gizmodo.com", "slashdot.org", "techradar.com", "simonwillison.net"];
              const low = ["breitbart.com", "infowars.com", "thegatewaypundit.com", "nationalheraldindia.com", "dailycaller.com", "theblaze.com", "wnd.com", "newsmax.com", "oann.com", "rt.com", "sputniknews.com"];
              
              let label = "Unknown Credibility";
              let color = "bg-gray-200 text-gray-700 border-gray-300";
              
              if (high.some((domain: string) => s.includes(domain))) { label = "High Credibility"; color = "bg-green-100 text-green-800 border-green-300"; }
              else if (mixed.some((domain: string) => s.includes(domain))) { label = "Mixed Credibility"; color = "bg-yellow-100 text-yellow-800 border-yellow-300"; }
              else if (low.some((domain: string) => s.includes(domain))) { label = "Low Credibility"; color = "bg-red-100 text-red-800 border-red-300"; }
              
              return <Badge variant="outline" className={`text-[9px] px-1.5 py-0 uppercase tracking-wider ${color}`}>{label}</Badge>
            })()}
            <span className="font-bold text-black uppercase tracking-wider text-xs flex gap-1 items-center">
              Bias: {art.biasLabel}
              {art.deviationScore > 0 && (
                <span className="bg-red-600 text-white px-1 py-0.5 rounded-sm text-[8px] animate-pulse" title={`Narrative Anomaly: Source is typically ${art.sourceBias}, but this article was classified as ${art.biasLabel}.`}>
                  ⚠️ ANOMALY
                </span>
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
