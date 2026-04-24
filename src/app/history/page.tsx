"use client"

import { useEffect, useState } from "react"
import { authClient } from "../../lib/auth-client"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"

export default function HistoryPage() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const [searches, setSearches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const handleDelete = async (e: React.MouseEvent, searchId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to completely delete this search and all its data?")) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/history/${searchId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSearches(prev => prev.filter(s => s.id !== searchId));
      } else {
        alert("Failed to delete search.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting search.");
    }
  }

  const [filterCategory, setFilterCategory] = useState("All")

  useEffect(() => {
    // If auth finishes loading and there's no session, immediately kick them to login
    if (!isPending && !session) {
      router.push("/login")
    }
  }, [isPending, session, router])

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/history?userId=${session.user.id}`)
        if (!res.ok) throw new Error("Failed to fetch history")
        const data = await res.json()
        setSearches(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [session])

  if (isPending || (loading && session)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-black" />
      </div>
    )
  }

  if (!session) return null

  // Extract unique categories for the filter
  const uniqueCategories = ["All", ...Array.from(new Set(searches.map(s => s.category || "General"))).filter(c => c && c !== "Category (Optional)")]
  
  // Apply filter
  const filteredSearches = filterCategory === "All" 
    ? searches 
    : searches.filter(s => (s.category || "General") === filterCategory)

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-8 font-[family-name:var(--font-oswald)] flex flex-col gap-8">
      
      <div className="border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Your Intelligence Vault</h1>
          <p className="text-xl text-black/60 font-bold uppercase tracking-widest mt-2">
            Past Prompts & Bias Breakdowns
          </p>
        </div>
        
        {searches.length > 0 && (
          <div className="w-full md:w-64">
            <Select value={filterCategory} onValueChange={(val) => setFilterCategory(val || "All")}>
              <SelectTrigger className="w-full h-12 rounded-none border-2 border-black bg-white focus:ring-0 uppercase tracking-widest font-bold text-xs ring-offset-0 ring-0">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white text-black font-[family-name:var(--font-geist-mono)]">
                {uniqueCategories.map(cat => (
                  <SelectItem key={cat} value={cat} className="rounded-none focus:bg-[#FFF200] focus:text-black hover:bg-gray-100 cursor-pointer text-sm font-bold uppercase tracking-wider py-2">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {filteredSearches.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-12 bg-white/50 border-2 border-black border-dashed">
          <p className="text-xl font-bold uppercase tracking-wider text-black/50 text-center">
            {searches.length === 0 ? "You haven't run any analysis yet.\nGo to the main page to scan your first topic!" : `No searches found for category: ${filterCategory}`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSearches.map((search) => {
            const insight = search.insights?.[0]
            const qualityScore = insight ? (insight.dataQualityScore * 100).toFixed(0) : "0"
            const sentimentMap: Record<string, string> = {
              "positive": "text-green-600",
              "neutral": "text-gray-500",
              "negative": "text-red-600"
            }
            
            // Recompute overall sentiment text statically since it's not natively saved, or use avgSentiment
            const displaySentiment = insight?.avgSentiment > 0.15 ? "positive" : insight?.avgSentiment < -0.15 ? "negative" : "neutral"

            return (
              <div 
                key={search.id}
                onClick={() => router.push(`/dashboard/${search.id}`)}
                className="bg-white border-4 border-black p-6 flex flex-col gap-4 cursor-pointer hover:bg-[#FFF200] transition-colors group relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold bg-black text-white px-2 py-1 w-fit uppercase tracking-widest mb-2">
                      {search.category || "General"}
                    </span>
                    <h2 className="text-2xl font-black uppercase tracking-tighter line-clamp-2">
                      "{search.query}"
                    </h2>
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-auto border-t-2 border-dashed border-black/20 pt-4">
                  <div className="flex justify-between text-sm font-bold uppercase tracking-wider">
                    <span className="text-black/60">Data Quality</span>
                    <span>{qualityScore}%</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold uppercase tracking-wider">
                    <span className="text-black/60">Sentiment</span>
                    <span className={sentimentMap[displaySentiment] || "text-black"}>{displaySentiment}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold uppercase tracking-wider">
                    <span className="text-black/60">Date</span>
                    <span>{new Date(search.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Arrow indicator and Trash that appears on hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-2">
                  <button 
                    onClick={(e) => handleDelete(e, search.id)}
                    className="p-2 bg-red-100/80 text-red-600 border-2 border-transparent hover:border-red-600 hover:bg-red-200 transition-colors z-10"
                    title="Delete Search"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-6 h-6 stroke-[3]" />
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
