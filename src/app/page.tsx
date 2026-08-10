"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Loader2, FileText, Activity, Target, ShieldCheck, ArrowUp } from "lucide-react"
import { authClient } from "../lib/auth-client"
import { LoginForm } from "../components/LoginForm"
import { api } from "../lib/api"

export default function LandingPage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [domains, setDomains] = useState("")
  const [excludeDomains, setExcludeDomains] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
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

  // The page got a lot longer once the Methodology section moved onto it —
  // only show the "back to top" button once there's actually somewhere to
  // go back FROM, rather than cluttering the view right at the top.
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, []);

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
    setErrorMsg(null)

    try {
      const payload: any = {
        query: searchQuery,
        category: category || undefined,
        // userId is no longer sent from the client — the backend derives
        // the acting user from the session cookie instead of trusting
        // whatever this field said.
        domains: domains ? domains.replace(/\s+/g, '') : undefined,
        exclude_domains: excludeDomains ? excludeDomains.replace(/\s+/g, '') : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      };

      const res = await api.post("/search", payload)

      if (!res.ok) {
        const errText = await res.text()
        // FastAPI validation errors (422) and HTTPExceptions (404, etc.)
        // both come back as JSON ({"detail": ...}) — fall back to the raw
        // text for anything else (a proxy error page, a non-JSON 500).
        let detail = errText
        try {
          const parsed = JSON.parse(errText)
          detail = typeof parsed.detail === "string" ? parsed.detail : JSON.stringify(parsed.detail)
        } catch {
          // not JSON — use errText as-is
        }
        throw new Error(detail || `Request failed with status ${res.status}`)
      }

      const data = await res.json()
      router.push(`/dashboard/${data.search_id}`)
    } catch (error) {
      // This used to be silent — console.error(error) + setLoading(false)
      // with no user-facing message at all, so any failure (a validation
      // error, a network error, the backend being down) looked identical
      // to the user: the progress bar flickers on and off and nothing else
      // happens. Surfacing the actual message is the fix; `router.push`
      // above means we only reach here on a genuine failure, never on
      // success.
      console.error(error)
      setErrorMsg(error instanceof Error ? error.message : "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-900 dark:text-gray-100 p-8 pt-16">
      <div className="flex-1 flex flex-col w-full items-center justify-center gap-12">
        
        {!loading && (
          <div className="w-full max-w-2xl flex justify-center items-center">
            <div className="text-black dark:text-gray-500 text-center font-black uppercase text-lg md:text-xl lg:text-[1.75rem] tracking-widest whitespace-nowrap">
              THE STORY BEHIND THE STORY
            </div>
          </div>
        )}

        {loading && (
          <div className="w-full max-w-2xl flex flex-col gap-2 font-[family-name:var(--font-oswald)]">
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

        <div className="w-full max-w-2xl flex flex-col gap-4">
          {!loading && (
            <div className="w-full flex justify-start">
              <div className="w-full md:w-[50%] flex items-center justify-start gap-4 font-[family-name:var(--font-oswald)]">
                <span className="text-xs font-bold uppercase tracking-widest text-black/50 whitespace-nowrap">TRY A DEMO</span>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => router.push('/dashboard/demo-ai%20regulation')}
                    className="text-xs font-bold uppercase tracking-widest text-black bg-white border-2 border-black px-3 py-1 hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    AI Regulation
                  </button>
                  <button 
                    type="button"
                    onClick={() => router.push('/dashboard/demo-us%20elections')}
                    className="text-xs font-bold uppercase tracking-widest text-black bg-white border-2 border-black px-3 py-1 hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    US Elections
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleSearch(e)} className={`font-[family-name:var(--font-oswald)] w-full bg-white/70 backdrop-blur-sm p-4 border-2 border-black flex flex-col sm:flex-row gap-4 shadow-none ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex-[2] flex flex-col gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a news topic to analyze..."
                className="w-full text-lg h-12 rounded-none border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button type="submit" disabled={!query || loading} className="h-12 bg-black text-white hover:bg-gray-800 rounded-none px-8 font-semibold w-full sm:w-auto uppercase tracking-wide border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-100 disabled:bg-black disabled:text-white disabled:cursor-not-allowed cursor-pointer">
              {loading ? <Loader2 className="animate-spin w-5 h-5 text-white" /> : "Analyze"}
            </Button>
          </form>

          {errorMsg && !loading && (
            <div className="w-full bg-red-50 border-2 border-red-600 text-red-700 px-4 py-3 text-sm font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-bold uppercase tracking-wide">Search failed:</span> {errorMsg}
            </div>
          )}

          {!loading && (
            <div className="w-full flex flex-col items-end">
              <div className="w-full md:w-[50%] flex gap-4">
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
                <div className="w-full font-[family-name:var(--font-oswald)] bg-white/90 backdrop-blur-sm p-4 border-2 border-black flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 shadow-none mt-4">
                  
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

        {!loading && (
          <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-stretch py-4 gap-8 md:gap-0">
            {/* Column 1 */}
            <div className="flex flex-row gap-3 items-start flex-1 px-2 md:px-4 border-b-2 border-black md:border-b-0 md:border-r-[2px] md:last:border-r-0 pb-6 md:pb-0">
              <div className="w-10 h-10 border-2 border-black flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-black" />
              </div>
              <div className="flex flex-col gap-1 text-left">
                <h3 className="font-[family-name:var(--font-oswald)] font-bold text-sm uppercase tracking-wide text-black">Multi-Source Analysis</h3>
                <p className="font-[family-name:var(--font-oswald)] text-[11px] font-bold text-gray-700 leading-relaxed uppercase tracking-wider">Compare coverage from hundreds of news outlets.</p>
              </div>
            </div>
            
            {/* Column 2 */}
            <div className="flex flex-row gap-3 items-start flex-1 px-2 md:px-4 border-b-2 border-black md:border-b-0 md:border-r-[2px] md:last:border-r-0 pb-6 md:pb-0">
              <div className="w-10 h-10 border-2 border-black flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-black" />
              </div>
              <div className="flex flex-col gap-1 text-left">
                <h3 className="font-[family-name:var(--font-oswald)] font-bold text-sm uppercase tracking-wide text-black">Claims & Echo Chambers</h3>
                <p className="font-[family-name:var(--font-oswald)] text-[11px] font-bold text-gray-700 leading-relaxed uppercase tracking-wider">Distill articles into verifiable claims to map distinct political echo chambers.</p>
              </div>
            </div>

            {/* Column 3 */}
            <div className="flex flex-row gap-3 items-start flex-1 px-2 md:px-4 border-b-2 border-black md:border-b-0 md:border-r-[2px] md:last:border-r-0 pb-6 md:pb-0">
              <div className="w-10 h-10 border-2 border-black flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-black" />
              </div>
              <div className="flex flex-col gap-1 text-left">
                <h3 className="font-[family-name:var(--font-oswald)] font-bold text-sm uppercase tracking-wide text-black">Bias & Framing</h3>
                <p className="font-[family-name:var(--font-oswald)] text-[11px] font-bold text-gray-700 leading-relaxed uppercase tracking-wider">Detect bias, framing techniques, and missing perspectives.</p>
              </div>
            </div>

            {/* Column 4 */}
            <div className="flex flex-row gap-3 items-start flex-1 px-2 md:px-4 pb-6 md:pb-0">
              <div className="w-10 h-10 border-2 border-black flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-black" />
              </div>
              <div className="flex flex-col gap-1 text-left">
                <h3 className="font-[family-name:var(--font-oswald)] font-bold text-sm uppercase tracking-wide text-black">Evidence Backed</h3>
                <p className="font-[family-name:var(--font-oswald)] text-[11px] font-bold text-gray-700 leading-relaxed uppercase tracking-wider">Every insight is grounded in real data.</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════════════════
          METHODOLOGY & TRUST REPORT
          Lives on the landing page itself (scroll target for the header
          nav's "Methodology" link) rather than a separate route — content
          structure (pipeline comparison, architecture diagram, tech-stack
          table, use-case grid, numbered request lifecycle, then a
          per-formula breakdown with real code) modeled on
          alphalab-hq.vercel.app's methodology pages at the user's request;
          every card/color/font is BiasScope's own existing neobrutalist
          system, not a second visual language. Every formula and
          threshold below is real, pulled directly from
          app/services/{validation,nlp,extraction,clustering}.py — if a
          number here drifts from that code, the code is right and this
          needs updating, not the other way around. ═══════════════════ */}
      {/* font-geist-sans override is load-bearing, not decoration: globals.css
          sets Tailwind's `font-sans` default to Sekuya (a heavy display
          face) at the <html> level, applied site-wide. Every other page
          that needs real body copy (dashboard, the old standalone
          methodology page) explicitly overrides it on its root wrapper —
          this section needs the same override, or every unstyled <p>
          inside it inherits Sekuya instead of Geist Sans. */}
      <div id="methodology" className="w-full max-w-7xl mx-auto space-y-16 mt-20 scroll-mt-24 font-[family-name:var(--font-geist-sans)]">

        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/50 mb-3">
            <ShieldCheck className="w-4 h-4" />
            Methodology &amp; Trust Report
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-[family-name:var(--font-sekuya)] mb-4">
            How BiasScope Actually Works
          </h2>
          <p className="text-base leading-[1.8] max-w-[75ch] text-[#1A1A1A]">
            Most bias-detection tools stop at sentiment analysis on raw article text. That measures tone, not truth —
            it can&apos;t tell you whether a claim is corroborated by other sources, contradicted by them, or reported by
            exactly one outlet with an agenda. BiasScope distills articles into individually verifiable{" "}
            <strong>claims</strong>, tracks which publishers independently reported each one, and scores the resulting
            dataset&apos;s quality, polarization, and diversity mathematically — not by vibes. Every formula on this page
            is the literal code running in production, not a simplified explainer.
          </p>
        </div>

        {/* ── PIPELINE ── */}
        <section className="space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-black/50 mb-2">The Research Problem</div>
            <h3 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-sekuya)] uppercase">
              Sentiment Isn&apos;t Truth
            </h3>
            <p className="text-sm leading-[1.8] max-w-[75ch] mt-3 text-[#1A1A1A]">
              A naive aggregator can tell you an article <em>sounds</em> negative. It can&apos;t tell you whether the
              underlying fact is real, whether three other outlets independently confirmed it, or whether this specific
              article frames it unusually compared to its publisher&apos;s normal coverage. BiasScope adds an entire
              evidence layer underneath the sentiment layer that most tools never build.
            </p>
          </div>

          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-red-600 mb-4">Naive Aggregator</div>
              <div className="font-mono text-sm flex flex-col gap-2 text-[#1A1A1A]">
                <div>Scrape Headlines</div>
                <div className="text-black/40">↓</div>
                <div>Keyword / Sentiment Match</div>
                <div className="text-black/40">↓</div>
                <div className="font-bold text-red-600">Publish (Echo Chamber Risk)</div>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-black mb-4">BiasScope Pipeline</div>
              <div className="font-mono text-sm flex flex-col gap-2 text-[#1A1A1A]">
                <div>Ingest (NewsAPI + GDELT)</div>
                <div className="text-black/40">↓</div>
                <div>Clean &amp; Deduplicate</div>
                <div className="text-black/40">↓</div>
                <div>NLP Analysis (sentiment, bias, entities)</div>
                <div className="text-black/40">↓</div>
                <div className="font-bold">Validation &amp; Scoring (DQS, JSD, diversity)</div>
                <div className="text-black/40">↓</div>
                <div className="font-bold">Claim Extraction → Clustering → Events</div>
                <div className="text-black/40">↓</div>
                <div className="font-bold bg-[#FFF200] px-2 py-1 inline-block border border-black w-fit">Evidence-Backed Report</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ARCHITECTURE ── */}
        <section className="space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-black/50 mb-2">System Architecture</div>
            <h3 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-sekuya)] uppercase">How the Components Connect</h3>
            <p className="text-sm leading-[1.8] max-w-[75ch] mt-3 text-[#1A1A1A]">
              Nothing computes in the browser — it sends a request and renders whatever the backend hands back. All
              heavy lifting (scraping, embeddings, LLM calls, clustering) runs server-side on the FastAPI application.
            </p>
          </div>

          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-0 font-mono text-xs">
            <ArchBox title="BROWSER" meta="Next.js / React — Vercel">
              Renders the dashboard, sends requests to this app&apos;s own <code>/api/proxy</code> route — never directly
              to the backend.
            </ArchBox>
            <ArchConnector label="HTTP / same-origin — no CORS preflight" />
            <ArchBox title="NEXT.JS API PROXY" meta="route.ts — server-to-server relay">
              Forwards the request (and your session cookie) to the FastAPI backend from Vercel&apos;s own server, not
              your browser. Server-to-server calls aren&apos;t subject to browser CORS at all.
            </ArchBox>
            <ArchConnector label="HTTPS / REST" />
            <ArchBox title="FASTAPI APPLICATION" meta="Uvicorn — Hugging Face Space (Docker)">
              Validates the session, runs the ingestion/NLP/scoring pipeline synchronously, and schedules claim
              extraction as a background task.
            </ArchBox>
            <ArchConnector label="reads / writes" dashed />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ArchLeaf title="PostgreSQL + pgvector">Articles, insights, claims, evidence, and 384-dim claim embeddings for cosine similarity search.</ArchLeaf>
              <ArchLeaf title="HF Inference Router">Qwen2.5-7B-Instruct — extraction, narrative, canonicalization. Every call is SHA-256 cached.</ArchLeaf>
              <ArchLeaf title="sentence-transformers">all-MiniLM-L6-v2 — embeds every claim for dedup, relevance, and clustering.</ArchLeaf>
              <ArchLeaf title="spaCy + HDBSCAN + NLI">Named entity recognition, claim clustering, and contradiction detection.</ArchLeaf>
            </div>
          </div>
        </section>

        {/* ── TECH STACK ── */}
        <section className="space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-black/50 mb-2">Technology Stack</div>
            <h3 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-sekuya)] uppercase">Eight Components, One Pipeline</h3>
          </div>
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <tbody>
                <StackRow name="Next.js / React" role="Frontend UI" desc="App Router, TypeScript, Tailwind. Deployed to Vercel." />
                <StackRow name="FastAPI" role="REST API Layer" desc="Async Python web framework serving the intelligence pipeline. Deployed on Hugging Face Spaces (Docker)." />
                <StackRow name="PostgreSQL + pgvector" role="Data Store" desc="Prisma-managed. Stores articles, insights, claims, evidence, and claim embeddings for vector search." />
                <StackRow name="HF Inference Router" role="Claim Extraction & Narrative" desc="Qwen2.5-7B-Instruct, routed through one cached client — identical prompts are never billed or re-run twice." />
                <StackRow name="sentence-transformers" role="Embeddings" desc="all-MiniLM-L6-v2 — 384-dim vectors for claim deduplication, query relevance, and clustering." />
                <StackRow name="spaCy" role="Named Entity Recognition" desc="Extracts PERSON / ORG / GPE entities per article for the keyword and entity-sentiment graph." />
                <StackRow name="HDBSCAN + NLI cross-encoder" role="Clustering & Consensus" desc="Groups claims into events; a DeBERTa-v3 NLI model flags contradictions between claims in the same cluster." />
                <StackRow name="Celery + Redis" role="Background Jobs" desc="Weekly topic-subscription snapshots — delta-ingests new articles and recomputes drift metrics." last />
              </tbody>
            </table>
          </div>
        </section>

        {/* ── USE CASES ── */}
        <section className="space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-black/50 mb-2">Use Cases</div>
            <h3 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-sekuya)] uppercase">What Questions Does BiasScope Answer?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UseCase n="01" q="Is this topic's coverage actually balanced?">
              The Data Quality Score, Polarization Score, and Diversity Label answer this from the raw dataset itself —
              before any AI-written narrative gets a chance to sound authoritative over a lopsided sample.
            </UseCase>
            <UseCase n="02" q="Which claims are corroborated across the political spectrum?">
              The Consensus Score is exactly this: the fraction of a claim cluster&apos;s claims independently reported
              by two or more distinct sources, with a bonus for genuine publisher diversity.
            </UseCase>
            <UseCase n="03" q="Is this specific article an outlier for its publisher?">
              The Deviation Score compares an article&apos;s actual detected bias against its source&apos;s historical,
              registry-assigned lean — flagging when a usually-centrist outlet runs something that reads nothing like
              its normal coverage.
            </UseCase>
            <UseCase n="04" q="How is a topic's polarization shifting over time?">
              Weekly snapshot jobs delta-ingest new coverage for every subscribed topic and recompute bias distribution
              and polarization, so drift is trackable week over week under Subscriptions — not just a single snapshot.
            </UseCase>
            <UseCase n="05" q="How do I share a report with someone else?">
              Every dashboard has its own link. Send it to anyone — they see the full report instantly, no account or
              login required on their end. Copy the URL, that&apos;s the whole flow.
            </UseCase>
          </div>
        </section>

        {/* ── REQUEST LIFECYCLE ── */}
        <section className="space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-black/50 mb-2">Request Lifecycle</div>
            <h3 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-sekuya)] uppercase">What Happens When You Run a Search?</h3>
            <p className="text-sm leading-[1.8] max-w-[75ch] mt-3 text-[#1A1A1A]">
              Your dashboard appears after step 06 — steps 07 onward keep running in the background and fill in the
              Claim Intelligence section a few seconds to a minute later, polled automatically.
            </p>
          </div>
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] divide-y-2 divide-black">
            <LifecycleStep n="01" title="You submit your request">
              The browser sends <code className="bg-gray-100 px-1">POST /search</code> with your query, category, and
              any domain/date filters.
            </LifecycleStep>
            <LifecycleStep n="02" title="Ingestion">
              NewsAPI is queried for headline matches first; if fewer than 5 come back, BiasScope falls back to a
              broader full-text search, then supplements results with GDELT. Every article is scraped with newspaper3k.
            </LifecycleStep>
            <LifecycleStep n="03" title="Cleaning & deduplication">
              Exact URL duplicates and fuzzy-matched near-duplicate headlines (title similarity &gt; 80%) are dropped
              before anything downstream ever sees them.
            </LifecycleStep>
            <LifecycleStep n="04" title="NLP analysis">
              Every surviving article gets a calibrated 3-class sentiment score, a bias label (source registry first,
              a fine-tuned classifier as fallback), and named-entity extraction.
            </LifecycleStep>
            <LifecycleStep n="05" title="Validation & scoring">
              Data Quality Score, Polarization Score, and the Diversity Label are computed over the full analyzed
              dataset — see the formulas below.
            </LifecycleStep>
            <LifecycleStep n="06" title="Narrative, persist, and respond">
              An AI narrative summary and contrastive left/right takes are generated (cached), the Search/Article/
              Insight rows are written, and the response returns — this is what you see immediately.
            </LifecycleStep>
            <LifecycleStep n="07" title="Background: claim extraction" async>
              Every article is broken into atomic, verifiable claims, filtered through the quality gate, deduplicated,
              and embedded — without blocking the response you already received.
            </LifecycleStep>
            <LifecycleStep n="08" title="Background: clustering & events" async last>
              Claims are grouped by embedding similarity into events. <code className="bg-gray-100 px-1">phase2Status</code>{" "}
              moves <code className="bg-gray-100 px-1">pending → processing → complete</code>, polled by the dashboard
              every 10 seconds until it stops.
            </LifecycleStep>
          </div>
        </section>

        {/* ── FORMULAS ── */}
        <section className="space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-black/50 mb-2">System Mathematics</div>
            <h3 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-sekuya)] uppercase">Every Formula, In Full</h3>
            <p className="text-sm leading-[1.8] max-w-[75ch] mt-3 text-[#1A1A1A]">
              Total transparency is the point of this section. Every block below is the real logic running in
              production — not a simplified explainer written after the fact.
            </p>
          </div>

          <FormulaCard title="1. Sentiment Analysis" file="app/services/nlp.py">
            <p>
              Each article is scored by a calibrated 3-class transformer (trained on social/news text, not movie
              reviews) that outputs independent probabilities for positive, negative, and neutral — not a single
              polarity score.
            </p>
            <Code>{`compound = pos_score - neg_score  # range: -1 to 1

if neu_score > pos_score and neu_score > neg_score:
    sentiment = "neutral"
elif pos_score > neg_score:
    sentiment = "positive"
else:
    sentiment = "negative"`}</Code>
            <Callout label="How this shows up">
              The <strong>Score</strong> on each article card is this compound value. An article with
              P_pos=0.15, P_neg=0.60, P_neu=0.25 gets compound = -0.45 and the label <strong>Negative</strong>{" "}
              (0.60 is the largest of the three).
            </Callout>
          </FormulaCard>

          <FormulaCard title="2. Bias Classification" file="app/services/nlp.py">
            <p>
              A hybrid approach: known publishers are read directly from a curated registry (confidence fixed at
              0.90); unknown sources fall back to a fine-tuned classifier.
            </p>
            <Code>{`if source_domain in SOURCE_BIAS_REGISTRY:
    bias_label = SOURCE_BIAS_REGISTRY[source_domain]   # LEFT / CENTER / RIGHT
    bias_confidence = 0.90
else:
    result = bias_pipeline(article_text)[0]             # bucketresearch/politicalBiasBERT
    bias_label = result["label"] if result["label"] in ("LEFT","CENTER","RIGHT") else "UNKNOWN"`}</Code>
            <Callout label="How this shows up">
              The <strong>Bias: LEFT/CENTER/RIGHT</strong> tag on every article card, and the pie chart under
              &quot;Political Bias Check.&quot;
            </Callout>
          </FormulaCard>

          <FormulaCard title="3. Source Reliability" file="app/services/nlp.py">
            <p>A static, curated registry mapping ~40 publishers to a 0–1 credibility score, banded into tiers.</p>
            <Code>{`if score >= 0.85: tier = "High"
elif score >= 0.65: tier = "Medium"
elif score >= 0.45: tier = "Mixed"
else: tier = "Low"
# unregistered source -> score 0.50, tier "Unknown"`}</Code>
            <Callout label="How this shows up">
              The <strong>Credibility</strong> badge on each article, and the H/M/Mx/L breakdown in the
              &quot;Reliability&quot; metric card.
            </Callout>
          </FormulaCard>

          <FormulaCard title="4. Narrative Anomaly (Deviation Score)" file="app/services/nlp.py">
            <p>
              Compares an article&apos;s detected bias against its publisher&apos;s historical registry-assigned bias.
              Unregistered sources always score 0 here — there&apos;s no historical baseline to deviate from.
            </p>
            <Code>{`bias_map = {"LEFT": 0, "CENTER": 1, "RIGHT": 2}
deviation_score = abs(bias_map[source_bias] - bias_map[article_bias])
# range: 0 (matches publisher norm) to 2 (a full LEFT<->RIGHT flip)`}</Code>
            <Callout label="How this shows up">
              The red <strong>⚠️ ANOMALY</strong> badge — shown only at deviation_score ≥ 2 (a complete ideological
              flip), not for a routine one-notch shift, which would otherwise fire on nearly every dataset.
            </Callout>
          </FormulaCard>

          <FormulaCard title="5. Data Quality Score (DQS)" file="app/services/validation.py">
            <p>
              Measures whether the dataset is structurally sound enough to analyze — not journalistic credibility. A
              weighted sum of three normalized components, computed over the deduplicated article set.
            </p>
            <Code>{`DQS = (C * 0.40) + (D * 0.30) + (R * 0.30)

C = 1.0 - (missing_content / deduplicated_articles)     # an article is "missing" below 50 chars
D = min(unique_sources / deduplicated_articles, 1.0)
R = min(avg_content_length / 1000, 1.0)`}</Code>
            <Callout label="How this shows up">
              Example: 10 deduplicated articles, 5 unique sources, none missing content, avg length 1,200 chars →
              C=1.0, D=0.5, R=1.0 → <strong>DQS = 0.85 (85%)</strong>.
            </Callout>
          </FormulaCard>

          <FormulaCard title="6. Polarization Score (Jensen-Shannon Divergence)" file="app/services/validation.py">
            <p>
              Measures how radically LEFT-labeled coverage&apos;s sentiment diverges from RIGHT-labeled coverage&apos;s.
              Sentiment scores are binned into Negative / Neutral / Positive distributions per side.
            </p>
            <Code>{`P = distribution(left_sentiment_scores)
Q = distribution(right_sentiment_scores)
M = (P + Q) / 2

JSD = 0.5 * KL(P || M) + 0.5 * KL(Q || M)
polarization_score = min(JSD / ln(2), 1.0)

# None (not 0.0) if either side has zero articles —
# nothing to compare, not "perfectly balanced"`}</Code>
            <Callout label="How this shows up">
              If LEFT coverage is 100% negative and RIGHT is 100% positive, JSD hits its theoretical max (ln 2) →{" "}
              <strong>100% Polarized</strong>. If a topic has no RIGHT-labeled coverage at all, the dashboard shows
              &quot;Not enough data&quot; instead of a misleading 0%.
            </Callout>
          </FormulaCard>

          <FormulaCard title="7. Diversity Quality Label" file="app/services/validation.py">
            <p>Gates on source count, geographic spread, and how dominant any single ideology is in the sample.</p>
            <Code>{`max_ideology = max(pct_left, pct_center, pct_right)

if unique_sources >= 5 and countries >= 2 and max_ideology <= 60:
    label = "High Diversity"
elif unique_sources >= 3 and max_ideology <= 80:
    label = "Moderate Diversity"
else:
    label = "Low Diversity"`}</Code>
            <Callout label="How this shows up">
              The label under &quot;Diversity&quot; in the metrics bar, plus the Pubs/Geos counts and L/C/R percentage
              breakdown beneath it.
            </Callout>
          </FormulaCard>

          <FormulaCard title="8. Claim Quality Gate" file="app/services/extraction.py">
            <p>
              Every LLM-extracted claim is heuristically scored — no second LLM call. Questions, opinion language, and
              journalist commentary are hard-rejected by word-boundary regex before scoring even starts.
            </p>
            <Code>{`if "?" in text: return 0.0
if OPINION_PATTERN.search(text) or COMMENTARY_PATTERN.search(text): return 0.0
if BIOGRAPHICAL_PATTERN.search(text): return 0.10

score  = 0.30 if 2+ named entities else 0.15 if 1
score += 0.25 if has_currency_or_percent else 0.15 if has_any_number
score += 0.30 if contains_action_verb          # "filed", "announced", "acquired"...
score += 0.15 if 8 <= word_count <= 35 else 0.05

# must score >= 0.40 to be stored as a claim at all`}</Code>
            <Callout label="How this shows up">
              The extraction log line each article produces (e.g. <code>type=16 quality=0 relevance=1</code>) — most
              LLM-extracted candidates never make it past this gate, which is by design.
            </Callout>
          </FormulaCard>

          <FormulaCard title="9. Deduplication" file="app/services/extraction.py">
            <p>Two distinct thresholds, for two distinct problems — both are cosine similarity on claim embeddings.</p>
            <Code>{`DEDUP_THRESHOLD = 0.92               # same article, near-identical rewording -> merge, keep the longer one
CROSS_ARTICLE_DEDUP_THRESHOLD = 0.88  # different article, SAME TOPIC -> merge evidence into the existing claim

# Cross-article matches are scoped to the current search's topic (a JOIN
# through evidence -> article -> search, filtered on search.query) so a
# claim can never silently absorb evidence from an unrelated topic.`}</Code>
            <Callout label="How this shows up">
              A <code>[MERGE] Matched existing claim</code> log line — and, in the Claim Explorer, a single claim
              backed by evidence from multiple articles instead of duplicate near-identical claim rows.
            </Callout>
          </FormulaCard>

          <FormulaCard title="10. Claim Clustering & Event Cohesion" file="app/services/clustering.py">
            <p>
              Claims are grouped by HDBSCAN over a cosine distance matrix. A cluster only becomes a real
              &quot;event&quot; if its claims are actually about the same specific incident, not just the same broad
              topic.
            </p>
            <Code>{`HDBSCAN(min_cluster_size=2, cluster_selection_epsilon=0.15, metric="precomputed")

cohesion = mean(pairwise_cosine_similarity(cluster_claim_embeddings))
COHESION_THRESHOLD = 0.72   # below this, it's a loose topic grouping, not one event`}</Code>
            <Callout label="How this shows up">
              &quot;Tesla filed for an IPO,&quot; &quot;Tesla recalled 50,000 vehicles,&quot; and &quot;Tesla stock
              fell 8%&quot; share an entity but aren&apos;t one event — cohesion between them lands well under 0.72
              and they&apos;re kept as separate, unlinked claims.
            </Callout>
          </FormulaCard>

          <FormulaCard title="11. Event Eligibility Gate" file="app/services/clustering.py">
            <p>A cohesive cluster still isn&apos;t surfaced as an &quot;Event&quot; unless it clears a minimum bar for cross-source convergence.</p>
            <Code>{`is_event = (claim_count >= 2) and (evidence_count >= 2) and (source_count >= 2)`}</Code>
            <Callout label="How this shows up">
              A single source&apos;s exclusive story stays a claim, never an &quot;Event&quot; — events specifically
              mean multiple sources converged on the same specific happening.
            </Callout>
          </FormulaCard>

          <FormulaCard title="12. Consensus Score" file="app/services/clustering.py">
            <p>What fraction of a cluster&apos;s claims are independently corroborated by two or more distinct sources, with a small bonus for real publisher diversity.</p>
            <Code>{`corroborated = count(claims with 2+ distinct sources)
consensus = corroborated / claim_count
consensus = min(consensus + min(source_count / 5.0, 0.3), 1.0)

if polarization_score > 0.3:
    consensus = max(0.0, consensus - polarization_score)  # contradiction penalty`}</Code>
            <Callout label="How this shows up">
              The <strong>Consensus</strong> number on each Cluster card, and the green &quot;Consistent Claim&quot;
              badge shown once consensus ≥ 0.5.
            </Callout>
          </FormulaCard>

          <FormulaCard title="13. Importance Score" file="app/services/clustering.py">
            <p>Ranks events by how significant their cross-source coverage actually is — this determines Event Explorer&apos;s sort order.</p>
            <Code>{`importance = (
    min(source_count / 10.0, 1.0) * 0.30 +
    publisher_diversity           * 0.15 +
    min(evidence_count / 15.0, 1.0) * 0.20 +
    min(claim_count / 8.0, 1.0)     * 0.15 +
    consensus_score                * 0.20
)
if source_count >= 5: importance += 0.15
elif source_count >= 3: importance += 0.08`}</Code>
            <Callout label="How this shows up">
              The &quot;Impact: X.X&quot; badge on each Event card — and which events sort to the top of the Event
              Explorer.
            </Callout>
          </FormulaCard>

          <FormulaCard title="14. Contradiction Detection (NLI)" file="app/services/clustering.py">
            <p>A cross-encoder NLI model checks pairs of claims within a cluster for genuine logical contradiction — not just disagreement in tone.</p>
            <Code>{`# cross-encoder/nli-deberta-v3-small, up to 5 claims per cluster (10 pairs max)
label = nli_classifier(f"{claim_a} [SEP] {claim_b}")   # entailment / neutral / contradiction
polarization_score = contradiction_count / total_pairs_checked`}</Code>
            <Callout label="How this shows up">
              Feeds directly into the Consensus Score above (#12) — a cluster with genuinely contradictory claims has
              its consensus score penalized, not just averaged away.
            </Callout>
          </FormulaCard>

          <FormulaCard title="15. Event Titling" file="app/services/clustering.py">
            <p>Deterministic — zero additional LLM calls. Entity extraction (regex, not a model) plus TF-IDF keywords, mapped through a curated action-word dictionary.</p>
            <Code>{`entities = regex_capitalized_phrases_and_acronyms(claim_texts)
keywords = TfidfVectorizer(claim_texts)
action_word = ACTION_MAP.get(matched_trigger)   # "filed" -> "Filing", "ipo" -> "IPO", ...

title = f"{top_entity} {action_word}"   # e.g. "Tesla IPO", "SEC Filing"`}</Code>
            <Callout label="How this shows up">
              Every Event card&apos;s title — generated instantly, without waiting on (or paying for) an LLM call per
              event.
            </Callout>
          </FormulaCard>

          <FormulaCard title="16. Entity Sentiment Graph" file="app/services/nlp.py">
            <p>
              Rolls up every named entity mentioned across the dataset into one knowledge graph, tracking how LEFT vs.
              RIGHT coverage feels about the same entity — not just what the entity is.
            </p>
            <Code>{`for article in articles:
    for entity in article.entities:
        if article.bias_label == "LEFT":  entity_graph[entity].left_sentiment.append(article.sentiment_score)
        elif article.bias_label == "RIGHT": entity_graph[entity].right_sentiment.append(article.sentiment_score)

if mentions < 2: skip   # needs to appear in at least 2 articles to mean anything
avg_left_sentiment = mean(left_sentiment) or 0.0
avg_right_sentiment = mean(right_sentiment) or 0.0`}</Code>
            <Callout label="How this shows up">
              The &quot;Entity Sentiment Analysis&quot; section — one card per entity, with its Left Media / Right
              Media average sentiment side by side and how many articles mentioned it.
            </Callout>
          </FormulaCard>

          <FormulaCard title="17. Weekly Snapshot Polarization" file="app/tasks/snapshot_task.py">
            <p>
              Deliberately simpler than the Jensen-Shannon Divergence formula above (#6) — a coarse, fast
              &quot;how much of this topic&apos;s coverage sits at the ideological edges&quot; measure for tracking
              week-over-week drift, not a per-search deep dive. The two numbers are not directly comparable on purpose.
            </p>
            <Code>{`total_bias = left_count + center_count + right_count
polarization = (left_count + right_count) / total_bias if total_bias > 0 else 0.0`}</Code>
            <Callout label="How this shows up">
              The &quot;POLARIZATION&quot; percentage on each weekly snapshot under Subscriptions — reads differently
              from a regular search&apos;s Polarization Score because it&apos;s answering a different question.
            </Callout>
          </FormulaCard>

          <FormulaCard title="18. Keyword Extraction" file="app/services/nlp.py">
            <p>Blends named-entity frequency with TF-IDF, so keywords skew toward actors and topics that are both prominent and distinctive to this dataset.</p>
            <Code>{`entity_counts = Counter(entity for article in articles for entity in article.entities)
# falls back to counting capitalized words directly if NER found nothing at all

tfidf_scores = TfidfVectorizer(articles, ngram_range=(1, 2), min_df=2).top_terms()

combined[word] = entity_counts.get(word, 0) * 2   # entities get a 2x bonus
combined[word] += tfidf_scores.get(word, 0)        # TF-IDF discovers non-entity discriminating terms
top_keywords = sorted(combined, reverse=True)[:10]`}</Code>
            <Callout label="How this shows up">
              The &quot;Top Keywords&quot; badges under the AI Narrative Summary, each with a mention count.
            </Callout>
          </FormulaCard>

          <FormulaCard title="19. Geographic Diversity Classification" file="app/services/validation.py">
            <p>
              Maps each source domain to a country via curated regional lists and TLD suffixes — not a guess.
              Unrecognized domains are labeled &quot;Unknown,&quot; never silently assigned a country they might not
              actually be from.
            </p>
            <Code>{`us_domains = ["nytimes.com", "foxnews.com", "reuters.com", ...]   # curated per region
uk_domains = [...]; in_domains = [...]; ca_domains = [...]
# .au / .eu TLD suffixes checked directly; aljazeera.com -> Qatar

if source not in any regional list: country = "Unknown"   # not a fallback guess`}</Code>
            <Callout label="How this shows up">
              The &quot;Geos&quot; count in the Diversity metric card, and the actual country list in its hover
              tooltip.
            </Callout>
          </FormulaCard>

          <FormulaCard title="20. Ingestion Defaults" file="app/services/ingestion.py" last>
            <p>The defaults that shape what you get back before any scoring even happens.</p>
            <Code>{`from_date = today - 7 days   # only applied if you don't pick your own date range
# NewsAPI's own hard limit: articles older than ~30 days are never returned, regardless

if not domains:  # NewsAPI can't combine an allow-list and a block-list in one request
    exclude_domains = your_input or "globenewswire.com,prnewswire.com,businesswire.com,yahoo.com,msn.com,news.yahoo.com,bizjournals.com"`}</Code>
            <Callout label="How this shows up">
              Why a search with no date filter set only returns the last week of coverage, and why raw wire-service
              press-release syndication is excluded by default unless you set your own domain filters in Advanced
              Filters.
            </Callout>
          </FormulaCard>
        </section>

        {/* ── KNOWN LIMITATIONS ── */}
        <section className="space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-black/50 mb-2">Known Limitations</div>
            <h3 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-sekuya)] uppercase">What This Doesn&apos;t Do</h3>
            {/* whitespace-nowrap only from md up — unconditional nowrap
                would push this off the edge on narrow viewports instead of
                wrapping naturally; overflow-x-auto is a safety net in case
                it's ever still too wide for a given window. */}
            <div className="mt-3 overflow-x-auto">
              <p className="text-sm leading-[1.8] text-[#1A1A1A] md:whitespace-nowrap">
                A trust report that only lists strengths isn&apos;t much of one. These are real, current gaps in the system — not hedging, actual behavior you might run into.
              </p>
            </div>
          </div>
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] divide-y-2 divide-black">
            <div className="p-6">
              <h4 className="font-bold text-base mb-1">The anomaly badge can&apos;t fire for most sources</h4>
              <p className="text-sm text-black/70 leading-relaxed">
                It only compares an article against its publisher&apos;s <em>registered</em> historical bias — and the
                registry covers roughly 40 domains. An unusual article from any source outside that list has no
                baseline to deviate from, so it can never be flagged, no matter how far it strays from that
                publisher&apos;s normal coverage.
              </p>
            </div>
            <div className="p-6">
              <h4 className="font-bold text-base mb-1">Polarization needs both sides represented to mean anything</h4>
              <p className="text-sm text-black/70 leading-relaxed">
                If a topic has no LEFT-labeled coverage, or no RIGHT-labeled coverage, there&apos;s nothing to compare
                — the dashboard shows &quot;Not enough data&quot; rather than a polarization percentage. We&apos;d
                rather show nothing than a 0% that could be mistaken for &quot;perfectly balanced.&quot;
              </p>
            </div>
            <div className="p-6">
              <h4 className="font-bold text-base mb-1">Geographic diversity is a curated list, not real geolocation</h4>
              <p className="text-sm text-black/70 leading-relaxed">
                Country is inferred from a hand-maintained list of ~45 domains plus a few TLD suffixes. A real but
                unlisted regional publisher shows up as &quot;Unknown&quot; rather than its actual country — accurate
                about not knowing, but the registry is genuinely incomplete.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="w-full border-t-[3px] border-black mt-12 max-w-5xl mx-auto">
        <div className="text-center font-black text-sm md:text-base uppercase tracking-widest text-black py-8 font-[family-name:var(--font-sekuya)]">
          BIASSCOPE. CLARIFYING NARRATIVES.
        </div>
      </div>

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-50 w-12 h-12 flex items-center justify-center bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform print:hidden"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

/* ── Architecture diagram pieces ─────────────────────────────────── */

function ArchBox({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-black">
      <div className="bg-black text-white px-4 py-2 flex justify-between items-center">
        <span className="font-bold">{title}</span>
        <span className="text-white/60 normal-case">{meta}</span>
      </div>
      <div className="px-4 py-3 bg-white text-[#1A1A1A] normal-case leading-relaxed">{children}</div>
    </div>
  )
}

function ArchConnector({ label, dashed }: { label: string; dashed?: boolean }) {
  return (
    <div className="flex flex-col items-center py-2 text-black/50 normal-case">
      <div className={`w-px h-4 ${dashed ? "border-l-2 border-dashed border-black/30" : "bg-black/30"}`} />
      <span className="text-[10px] my-1">{label}</span>
      <div className={`w-px h-4 ${dashed ? "border-l-2 border-dashed border-black/30" : "bg-black/30"}`} />
    </div>
  )
}

function ArchLeaf({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-black/20 p-3 normal-case">
      <div className="font-bold mb-1">{title}</div>
      <div className="text-black/60 leading-relaxed">{children}</div>
    </div>
  )
}

/* ── Tech stack table row ────────────────────────────────────────── */

function StackRow({ name, role, desc, last }: { name: string; role: string; desc: string; last?: boolean }) {
  return (
    <tr className={last ? "" : "border-b border-black/10"}>
      <td className="px-4 py-3 font-bold align-top whitespace-nowrap">{name}</td>
      <td className="px-4 py-3 align-top whitespace-nowrap text-xs uppercase tracking-wide font-bold text-black/60">{role}</td>
      <td className="px-4 py-3 align-top text-black/70">{desc}</td>
    </tr>
  )
}

/* ── Use case card ───────────────────────────────────────────────── */

function UseCase({ n, q, children }: { n: string; q: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
      <div className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Use Case {n}</div>
      <h3 className="text-lg font-bold font-[family-name:var(--font-oswald)] mb-2">{q}</h3>
      <p className="text-sm text-black/70 leading-relaxed">{children}</p>
    </div>
  )
}

/* ── Lifecycle step ──────────────────────────────────────────────── */

function LifecycleStep({ n, title, children, async, last }: { n: string; title: string; children: React.ReactNode; async?: boolean; last?: boolean }) {
  return (
    <div className={`p-6 flex gap-4 ${last ? "" : ""}`}>
      <div className="shrink-0 w-10 h-10 flex items-center justify-center border-2 border-black font-mono font-bold text-sm bg-[#FFF200]">
        {n}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-base">{title}</h3>
          {async && (
            <span className="text-[9px] font-mono uppercase tracking-widest text-black/50 border border-black/30 px-1.5 py-0.5">background</span>
          )}
        </div>
        <p className="text-sm text-black/70 leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

/* ── Formula card ────────────────────────────────────────────────── */

function FormulaCard({ title, file, children, last }: { title: string; file: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-4 ${last ? "" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-black pb-3">
        <h3 className="text-lg font-bold font-[family-name:var(--font-oswald)] uppercase">{title}</h3>
        <code className="text-[10px] text-black/40 font-mono">{file}</code>
      </div>
      <div className="text-sm leading-relaxed text-[#1A1A1A] space-y-3">{children}</div>
    </div>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-black text-[#D4D4D4] border-2 border-black p-4 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre">
      <code>{children}</code>
    </pre>
  )
}

function Callout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#FFF200]/20 border-2 border-[#FFF200] p-3 text-xs leading-relaxed">
      <strong className="uppercase tracking-wide">{label}:</strong> {children}
    </div>
  )
}
