"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Loader2 } from "lucide-react"

export default function LandingPage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("Politics")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
        body: JSON.stringify({ query, category })
      })

      if (!res.ok) throw new Error("Search failed")
      
      const data = await res.json()
      router.push(`/dashboard/${data.search_id}`)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex flex-col w-full items-center py-8 space-y-8 min-h-screen justify-between">
        <div className="flex flex-col justify-center items-center pb-4 text-center space-y-2 min-w-full border-b-4  border-black">
          <h1 className="text-5xl font-extrabold tracking-tight">BiasScope</h1>
          
        </div>

        <form onSubmit={handleSearch} className="flex flex-row items-center justify-center max-w-2xl bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-4 border border-gray-100 dark:border-gray-700">
          <div className="flex-1">
            <Input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Enter a topic" 
              className="w-full text-lg h-12"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={category} onValueChange={(val) => val && setCategory(val)}>
              <SelectTrigger className="h-12 w-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
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
          <Button type="submit" disabled={!query || loading} className="h-12 bg-blue-500 hover:bg-blue-400 px-8 font-semibold w-full sm:w-auto">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Analyze"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500 max-w-sm mx-auto">
          Insights will be aggregated from major news outlets, analyzing coverage, sentiment, and assigning bias in real-time.
        </div>
      </div>
    </div>
  )
}
