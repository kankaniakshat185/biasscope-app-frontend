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
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-sekuya)]">Intelligence Dashboard</h1>
          <p className="text-black-500 mt-2">
            Analysis for Topic: <span className="font-semibold text-blue-600">{data.query}</span> in <span className="capitalize">{data.category}</span>
          </p>
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
              <Card key={art.id} className="hover:shadow-md transition-shadow">
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
                <CardContent className="text-sm text-gray-500 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{art.source}</span>
                    <span>•</span>
                    <span className="italic">{art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : 'Unknown Date'}</span>
                    <span>•</span>
                    <span className="font-semibold text-black">{art.biasLabel}</span>
                  </div>
                  <span>Score: {(art.sentimentScore || 0).toFixed(2)}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
