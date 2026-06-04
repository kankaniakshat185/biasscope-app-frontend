"use client"

import { useEffect, useState } from "react"
import { authClient } from "../../lib/auth-client"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Loader2, TrendingUp, AlertTriangle, Clock } from "lucide-react"

export default function HistoryPage() {
  const { data: session, isPending } = authClient.useSession()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubs() {
      if (!session?.user?.id) return
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/subscriptions/${session.user.id}`)
        if (res.ok) {
          const data = await res.json()
          setSubscriptions(data)
        }
      } catch (err) {
        console.error("Failed to fetch subscriptions", err)
      } finally {
        setLoading(false)
      }
    }
    
    if (!isPending) {
      fetchSubs()
    }
  }, [session, isPending])

  if (isPending || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-black/20" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold font-[family-name:var(--font-oswald)] uppercase">Please log in to view your subscriptions.</h2>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 max-w-6xl mx-auto w-full min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-bold font-[family-name:var(--font-oswald)] uppercase tracking-tight mb-2">Longitudinal Intelligence</h1>
        <p className="text-gray-600">Track narrative drift and event evolution across your subscribed topics over time.</p>
      </div>

      {subscriptions.length === 0 ? (
        <Card className="rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-[#FFF200]">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold font-[family-name:var(--font-oswald)] uppercase mb-2">No Active Subscriptions</h3>
            <p className="text-sm">When you run a search, you will be able to subscribe to it for weekly intelligence tracking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {subscriptions.map(sub => (
            <TopicTimeline key={sub.id} subscription={sub} />
          ))}
        </div>
      )}
    </div>
  )
}

function TopicTimeline({ subscription }: { subscription: any }) {
  const snapshots = subscription.snapshots || []
  
  if (snapshots.length === 0) {
    return (
      <Card className="rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="bg-black text-white border-b-2 border-black">
          <CardTitle className="font-[family-name:var(--font-sekuya)] uppercase tracking-wider flex justify-between">
            <span>{subscription.topic}</span>
            <Badge variant="secondary" className="bg-white text-black rounded-none uppercase text-xs">Waiting for first snapshot</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Celery will generate the first baseline snapshot within 7 days.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Most recent is first because of the backend order desc
  const latest = snapshots[0]
  const previous = snapshots.length > 1 ? snapshots[1] : null
  
  const driftStr = previous 
    ? ((latest.polarizationIndex - previous.polarizationIndex) * 100).toFixed(1)
    : "0.0"
  
  const driftNum = parseFloat(driftStr)

  return (
    <Card className="rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="bg-gray-100 border-b-2 border-black">
        <div className="flex justify-between items-center">
          <CardTitle className="text-3xl font-[family-name:var(--font-sekuya)] uppercase tracking-wider">
            {subscription.topic}
          </CardTitle>
          <div className="flex gap-2">
             <Badge className="bg-black text-white rounded-none uppercase text-xs">Active</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        
        {/* Topline Metrics */}
        <div className="grid grid-cols-3 border-b-2 border-black font-mono text-sm">
          <div className="p-4 border-r-2 border-black flex flex-col justify-center items-center">
            <span className="text-gray-500 mb-1">TOTAL EVENTS</span>
            <span className="text-3xl font-bold">{latest.eventCount}</span>
          </div>
          <div className="p-4 border-r-2 border-black flex flex-col justify-center items-center">
            <span className="text-gray-500 mb-1">TOTAL CLAIMS</span>
            <span className="text-3xl font-bold">{latest.claimCount}</span>
          </div>
          <div className="p-4 flex flex-col justify-center items-center bg-blue-50">
            <span className="text-gray-500 mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> POLARIZATION</span>
            <span className="text-3xl font-bold text-blue-600">{(latest.polarizationIndex * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Narrative Drift Alert */}
        {previous && Math.abs(driftNum) > 10 && (
          <div className="bg-[#FFF200] border-b-2 border-black p-4 flex gap-3 items-center">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold uppercase font-[family-name:var(--font-oswald)]">Significant Narrative Drift Detected</p>
              <p className="text-sm">Polarization shifted by {driftStr}% since the last weekly snapshot.</p>
            </div>
          </div>
        )}

        {/* Weekly Timeline */}
        <div className="p-6">
          <h3 className="font-bold uppercase tracking-widest mb-6 font-[family-name:var(--font-oswald)] text-lg">Weekly Timeline</h3>
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {snapshots.map((snap: any, i: number) => (
              <div key={snap.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                
                {/* Timeline dot */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-black bg-white text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
                  <span className="text-xs font-bold">{snapshots.length - i}</span>
                </div>
                
                {/* Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold font-mono text-sm">{new Date(snap.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm mb-3 text-gray-700">
                    Processed <span className="font-bold">{snap.articleCount}</span> new articles resulting in <span className="font-bold">{snap.eventCount}</span> verifiable events.
                  </p>
                  
                  {snap.biasDistribution && (
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
                      <p className="text-xs text-gray-500 font-bold uppercase mb-2">Publisher Bias</p>
                      <div className="flex h-3 w-full border border-black overflow-hidden">
                         <div style={{width: `${(snap.biasDistribution.LEFT / snap.articleCount) * 100}%`}} className="bg-blue-500 h-full"></div>
                         <div style={{width: `${(snap.biasDistribution.CENTER / snap.articleCount) * 100}%`}} className="bg-gray-300 h-full"></div>
                         <div style={{width: `${(snap.biasDistribution.RIGHT / snap.articleCount) * 100}%`}} className="bg-red-500 h-full"></div>
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
