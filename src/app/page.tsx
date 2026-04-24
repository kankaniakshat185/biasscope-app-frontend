"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Loader2 } from "lucide-react"
import { authClient } from "../lib/auth-client"

export default function LandingPage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [domains, setDomains] = useState("")
  const [excludeDomains, setExcludeDomains] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const { data: session } = authClient.useSession()
  const router = useRouter()

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          query, 
          category,
          userId: session?.user?.id || undefined,
          domains: domains ? domains.replace(/\s+/g, '') : undefined,
          exclude_domains: excludeDomains ? excludeDomains.replace(/\s+/g, '') : undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined
        })
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

        <form onSubmit={handleSearch} className="font-[family-name:var(--font-oswald)] w-full max-w-2xl bg-white/70 backdrop-blur-sm p-4 border-2 border-black flex flex-col sm:flex-row gap-4 shadow-none">
          <div className="flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a topic"
              className="w-full text-lg h-12 rounded-none border-black bg-white shadow-sm"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={category} onValueChange={(val) => setCategory(val || "")}>
              <SelectTrigger className="h-12 w-full rounded-none border-black bg-white shadow-sm">
                <SelectValue placeholder="- Category (Optional) -" />
              </SelectTrigger>
              <SelectContent className="font-[family-name:var(--font-oswald)] rounded-none border-black">
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
          <Button type="submit" disabled={!query || loading} className="h-12 bg-black text-white hover:bg-gray-800 rounded-none px-8 font-semibold w-full sm:w-auto uppercase tracking-wide">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Analyze"}
          </Button>
        </form>

        <div className="w-full max-w-2xl flex flex-col items-end">
          <div className="flex gap-4">
            {(domains || excludeDomains || fromDate || toDate) && (
              <button 
                type="button" 
                onClick={clearFilters} 
                className="text-sm font-bold uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
            <button 
              type="button" 
              onClick={() => setShowFilters(!showFilters)} 
              className="text-sm font-bold uppercase tracking-wider text-black/60 hover:text-black transition-colors"
            >
              {showFilters ? "- Hide Advanced Filters" : "+ Advanced Filters"}
            </button>
          </div>
          
          {showFilters && (
            <div className="w-full font-[family-name:var(--font-oswald)] bg-white/70 backdrop-blur-sm p-4 mt-2 border-2 border-black flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
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

      </div>
      <div className="mt-8 w-full">
        <div className="text-center text-md text-black dark:text-gray-500 mx-auto border-t-[3px] py-3 border-black w-full max-w-[58rem] backdrop-blur-[0.2rem]">
          See the story behind the story - AI analysis of news, sentiment, and bias.
        </div>
      </div>
    </div>
  )
}
