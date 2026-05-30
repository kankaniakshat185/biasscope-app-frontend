"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Loader2 } from "lucide-react"
import { authClient } from "../lib/auth-client"
import { LoginForm } from "../components/LoginForm"

export default function LandingPage() {
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"topic" | "url">("topic")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [domains, setDomains] = useState("")
  const [excludeDomains, setExcludeDomains] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

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
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query) return
    setLoading(true)

    try {
      let endpoint = "/search";
      let payload: any = { 
        query, 
        category,
        userId: session?.user?.id || undefined,
        domains: domains ? domains.replace(/\s+/g, '') : undefined,
        exclude_domains: excludeDomains ? excludeDomains.replace(/\s+/g, '') : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      };

      if (mode === "url") {
        endpoint = "/analyze-url";
        payload = { url: query, userId: session?.user?.id || undefined };
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

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

        <div className="flex bg-white border-2 border-black w-fit mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-[family-name:var(--font-oswald)]">
          <button 
            type="button"
            onClick={() => setMode("topic")} 
            className={`text-sm font-bold uppercase tracking-widest px-6 py-2 transition-colors ${mode === 'topic' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            Topic Search
          </button>
          <div className="w-[2px] bg-black"></div>
          <button 
            type="button"
            onClick={() => setMode("url")} 
            className={`text-sm font-bold uppercase tracking-widest px-6 py-2 transition-colors ${mode === 'url' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            Single URL Analysis
          </button>
        </div>
        <form onSubmit={handleSearch} className="font-[family-name:var(--font-oswald)] w-full max-w-2xl bg-white/70 backdrop-blur-sm p-4 border-2 border-black flex flex-col sm:flex-row gap-4 shadow-none">
          <div className="flex-[2]">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === "topic" ? "Enter a topic" : "Paste full article URL..."}
              className="w-full text-lg h-12 rounded-none border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          {mode === "topic" && (
            <div className="flex-1">
              <Select value={category || "none"} onValueChange={(val) => setCategory(val === "none" ? "" : (val || ""))}>
                <SelectTrigger className="h-12 w-full rounded-none border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="- Category (Optional) -" />
                </SelectTrigger>
                <SelectContent className="font-[family-name:var(--font-oswald)] rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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
          )}
          <Button type="submit" disabled={!query || loading} className="h-12 bg-black text-white hover:bg-gray-800 rounded-none px-8 font-semibold w-full sm:w-auto uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Analyze"}
          </Button>
        </form>

        {mode === "topic" && (
          <div className="w-full max-w-2xl flex flex-col items-center">
            <div className="flex gap-4">
              {(domains || excludeDomains || fromDate || toDate) && (
                <button 
                  type="button" 
                  onClick={clearFilters} 
                  className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 border-2 border-red-200 px-4 py-2 hover:bg-red-100 transition-colors shadow-sm"
                >
                  Clear Filters
                </button>
              )}
              <button 
                type="button" 
                onClick={() => setShowFilters(!showFilters)} 
                className="text-xs font-bold uppercase tracking-wider text-black bg-white border-2 border-black px-4 py-2 hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {showFilters ? "- Hide Advanced Filters" : "+ Advanced Filters"}
              </button>
            </div>
            
            {showFilters && (
              <div className="w-full font-[family-name:var(--font-oswald)] bg-white/90 backdrop-blur-sm p-4 mt-4 border-2 border-black flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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
