"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Loader2 } from "lucide-react"
import { authClient } from "../lib/auth-client"
import { LoginForm } from "../components/LoginForm"

export default function LandingPage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [domains, setDomains] = useState("")
  const [excludeDomains, setExcludeDomains] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgress(p => (p < 90 ? p + 2 : p));
      }, 500);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  if (isPending) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-black/20" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <LoginForm />
      </div>
    )
  }

  const clearFilters = () => {
    setDomains("")
    setExcludeDomains("")
    setFromDate("")
    setToDate("")
    setCategory("")
  }

  const handleSearch = async (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault()
    
    const searchQuery = directQuery || query;
    if (!searchQuery) return
    
    setLoading(true)

    try {
      const payload: any = { 
        query: searchQuery, 
        category: category || undefined,
        userId: session?.user?.id || undefined,
        domains: domains ? domains.replace(/\s+/g, '') : undefined,
        exclude_domains: excludeDomains ? excludeDomains.replace(/\s+/g, '') : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      };

      const fetchConfig = {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/search`, fetchConfig)

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Search failed: ${errText}`)
      }

      const data = await res.json()
      router.push(`/dashboard/${data.search_id}`)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-900 dark:text-gray-100 p-8">
      <div className="flex-1 flex flex-col w-full items-center justify-center space-y-4">
        
        {loading && (
          <div className="w-full max-w-2xl flex flex-col gap-2 font-[family-name:var(--font-oswald)] mb-4">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
              <span>Running Intelligence Pipeline...</span>
              <span className="animate-pulse">{progress}%</span>
            </div>
            <div className="w-full h-4 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-[#FFF200] border-r-2 border-black transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Trending Chips positioned above search box, left-aligned */}
        {!loading && (
          <div className="w-full max-w-2xl flex justify-start">
            <div className="w-full md:w-[65%] flex items-center justify-between font-[family-name:var(--font-oswald)] mb-2">
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => router.push('/dashboard/demo-elon%20musk')}
                  className="text-xs font-bold uppercase tracking-widest text-black bg-[#FFF200] border-2 border-black px-3 py-1 hover:bg-[#ffe600] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Elon Musk
                </button>
                <button 
                  type="button"
                  onClick={() => { setQuery("Artificial Intelligence"); handleSearch(undefined, "Artificial Intelligence"); }}
                  className="text-xs font-bold uppercase tracking-widest text-black bg-white border-2 border-black px-3 py-1 hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  AI Regulation
                </button>
                <button 
                  type="button"
                  onClick={() => { setQuery("US Elections"); handleSearch(undefined, "US Elections"); }}
                  className="text-xs font-bold uppercase tracking-widest text-black bg-white border-2 border-black px-3 py-1 hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  US Elections
                </button>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-black/50">TRENDING</span>
            </div>
          </div>
        )}

        {/* Main Search Box - Center */}
        <form onSubmit={(e) => handleSearch(e)} className={`font-[family-name:var(--font-oswald)] w-full max-w-2xl bg-white/70 backdrop-blur-sm p-4 border-2 border-black flex flex-col sm:flex-row gap-4 shadow-none ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex-[2] flex flex-col gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a news topic to analyze..."
              className="w-full text-lg h-12 rounded-none border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button type="submit" disabled={!query || loading} className="h-12 bg-black text-white hover:bg-gray-800 rounded-none px-8 font-semibold w-full sm:w-auto uppercase tracking-wide border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Analyze"}
          </Button>
        </form>

        {/* Advanced Filters Button positioned below search box, right-aligned */}
        {!loading && (
          <div className="w-full max-w-2xl flex flex-col items-end mt-2">
            <div className="w-full md:w-[65%] flex gap-4">
              {(domains || excludeDomains || fromDate || toDate || category) && (
                <button 
                  type="button" 
                  onClick={clearFilters} 
                  className="flex-1 text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 border-2 border-red-200 py-2 hover:bg-red-100 transition-colors shadow-sm text-center"
                >
                  Clear Filters
                </button>
              )}
              <button 
                type="button" 
                onClick={() => setShowFilters(!showFilters)} 
                className="flex-[2] text-xs font-bold uppercase tracking-wider text-black bg-white border-2 border-black py-2 hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center"
              >
                {showFilters ? "- Hide Advanced Filters" : "+ Advanced Filters"}
              </button>
            </div>
            
            {showFilters && (
              <div className="w-full font-[family-name:var(--font-oswald)] bg-white/90 backdrop-blur-sm p-4 border-2 border-black flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4">
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Select value={category || "none"} onValueChange={(val) => setCategory(val === "none" ? "" : (val || ""))}>
                      <SelectTrigger className="h-10 w-full rounded-none !border-2 !border-black bg-white shadow-sm focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="- Category (Optional) -" />
                      </SelectTrigger>
                      <SelectContent className="font-[family-name:var(--font-oswald)] rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Politics">Politics</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="World">World</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                        <SelectItem value="Entertainment">Entertainment</SelectItem>
                        <SelectItem value="India">India</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Input 
                    value={domains} 
                    onChange={(e) => setDomains(e.target.value)} 
                    placeholder="Only strictly search these sites" 
                    className="rounded-none border-black flex-1 shadow-sm h-10 bg-white"
                  />
                  <Input 
                    value={excludeDomains} 
                    onChange={(e) => setExcludeDomains(e.target.value)} 
                    placeholder="Explicitly exclude sites" 
                    className="rounded-none border-black flex-1 shadow-sm h-10 bg-white"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <span className="text-sm font-semibold uppercase whitespace-nowrap px-2">From Date:</span>
                  <Input 
                    type="date"
                    value={fromDate} 
                    onChange={(e) => setFromDate(e.target.value)} 
                    className="rounded-none border-black flex-1 shadow-sm h-10 bg-white"
                  />
                  <span className="text-sm font-semibold uppercase whitespace-nowrap px-2">To Date:</span>
                  <Input 
                    type="date"
                    value={toDate} 
                    onChange={(e) => setToDate(e.target.value)} 
                    className="rounded-none border-black flex-1 shadow-sm h-10 bg-white"
                  />
                </div>
                <p className="text-xs text-black/50 italic tracking-wide text-right w-full">
                  * Dates must fall within the last 30 days.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
      <div className="mt-8 w-full">
        <div className="text-center text-md text-black dark:text-gray-500 mx-auto border-t-[3px] py-3 border-black w-full max-w-[58rem] backdrop-blur-[0.2rem]">
          The story behind the story - AI analysis of news, sentiment, and bias.
        </div>
      </div>
    </div>
  )
}
