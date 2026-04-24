"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { SentimentOverTime, BiasDistribution, SourceDistribution } from "../../../components/Charts"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const params = useParams()
  const { id } = params
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="font-[family-name:var(--font-geist-sans)] min-h-screen text-slate-900 dark:text-slate-100 p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-sekuya)]">Intelligence Dashboard</h1>
            <p className="text-black-500 mt-2">
              Analysis for Topic: <span className="font-semibold text-blue-600">{data.query}</span> in <span className="capitalize">{data.category}</span>
            </p>
          </div>
          
          <button 
            onClick={() => window.print()}
            className="print:hidden h-12 bg-black text-white hover:bg-gray-800 uppercase tracking-widest font-bold px-6 flex items-center justify-center border-2 border-black transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
          >
            Export PDF Report
          </button>
        </div>
        
        {/* Metric Cards */}
        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Valid Articles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{insights.validArticles}</div>
                <p className="text-xs text-black-400 mt-1">{insights.duplicatesRemoved} duplicates removed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Avg Sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Number(insights.avgSentiment).toFixed(2)}</div>
                <p className="text-xs text-black-400 mt-1">Scale between -1.0 to 1.0</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Data Quality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">{Number(insights.dataQualityScore * 100).toFixed(0)}%</div>
                <p className="text-xs text-black-400 mt-1">Based on text completeness & validity</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Narrative & Keywords */}
        {insights && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-md">
              <CardHeader>
                <CardTitle>AI Narrative Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                  {insights.narrativeSummary}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Top Keywords discovered</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {insights.topKeywords && (insights.topKeywords as string[]).map((kw: string) => (
                  <Badge key={kw} variant="secondary" className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                    {kw}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 shadow">
            <CardHeader><CardTitle>Sentiment Trend</CardTitle></CardHeader>
            <CardContent><SentimentOverTime data={articles} /></CardContent>
          </Card>
          <Card className="col-span-1 shadow">
            <CardHeader><CardTitle>Source Origin</CardTitle></CardHeader>
            <CardContent><SourceDistribution data={sourceDist} /></CardContent>
          </Card>
          <Card className="col-span-1 shadow">
            <CardHeader><CardTitle>Political Bias Check</CardTitle></CardHeader>
            <CardContent>
              {insights && <BiasDistribution data={insights.biasDistribution} />}
            </CardContent>
          </Card>
        </div>

        {/* Article Cards Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-sekuya)]">Analyzed Articles</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {articles.map((art: any) => (
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
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{art.source}</span>
            <span>•</span>
            <span className="italic">{art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : 'Unknown Date'}</span>
            <span>•</span>
            <span className="font-bold text-black uppercase tracking-wider">{art.biasLabel}</span>
          </div>
          <span className="font-bold">Score: {(art.sentimentScore || 0).toFixed(2)}</span>
        </div>

        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className="text-xs self-start uppercase tracking-widest font-extrabold flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          {chatOpen ? "Close AI Chat" : "Ask Llama-3 About This Article"}
        </button>

        {chatOpen && (
          <div className="mt-2 bg-gray-100 p-4 border-l-4 border-blue-600 flex flex-col gap-3">
            <form onSubmit={handleAsk} className="flex gap-2">
              <input 
                type="text" 
                placeholder="What exactly did they outline in this article?" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-black focus:outline-none"
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
