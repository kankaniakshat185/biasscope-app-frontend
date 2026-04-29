"use client"

import { useState } from "react"
import { authClient } from "../lib/auth-client"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Lock, User, ArrowRight } from "lucide-react"

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isLogin) {
        const { error } = await authClient.signIn.email({
          email,
          password
        })
        if (error) throw new Error(error.message)
        router.refresh()
      } else {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name
        })
        if (error) throw new Error(error.message)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col gap-6 relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFF200] border-b-4 border-l-4 border-black transform translate-x-8 -translate-y-8 rotate-45" />
        
        <div className="flex flex-col gap-2 relative">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-black font-[family-name:var(--font-oswald)]">
            {isLogin ? "Access Scope" : "Join Scope"}
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest text-black/50">
            {isLogin ? "Login to start analyzing" : "Signup to start analyzing"}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-2 border-red-600 p-3 flex items-center gap-3 text-red-600 font-bold text-sm uppercase tracking-tight animate-in shake-in">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40 group-focus-within:text-black transition-colors" />
              <input
                type="text"
                placeholder="FULL NAME"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-14 pl-12 pr-4 border-2 border-black bg-white focus:bg-[#FFF200]/5 focus:outline-none font-medium placeholder:text-black/20 tracking-wider transition-all font-[family-name:var(--font-geist-sans)]"
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40 group-focus-within:text-black transition-colors" />
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 pl-12 pr-4 border-2 border-black bg-white focus:bg-[#FFF200]/5 focus:outline-none font-medium placeholder:text-black/20 tracking-wider transition-all font-[family-name:var(--font-geist-sans)]"
              required
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40 group-focus-within:text-black transition-colors" />
            <input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 pl-12 pr-4 border-2 border-black bg-white focus:bg-[#FFF200]/5 focus:outline-none font-medium placeholder:text-black/20 tracking-wider transition-all font-[family-name:var(--font-geist-sans)]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative h-14 mt-2 bg-black text-white hover:bg-[#FFF200] hover:text-black uppercase tracking-[0.2em] font-black flex items-center justify-center border-2 border-black transition-all active:translate-y-1 disabled:opacity-50 overflow-hidden"
          >
            {loading ? (
              <Loader2 className="animate-spin w-6 h-6" />
            ) : (
              <>
                <span className="relative z-10">{isLogin ? "AUTHENTICATE" : "REGISTER"}</span>
                <ArrowRight className="ml-2 w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-black/10" />
            <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">OR CONTINUE WITH</span>
            <div className="flex-1 h-px bg-black/10" />
          </div>

          <button
            type="button"
            onClick={async () => {
              setLoading(true)
              try {
                await authClient.signIn.social({
                  provider: "google"
                })
              } catch (err: any) {
                setError(err.message || "Google login failed")
                setLoading(false)
              }
            }}
            disabled={loading}
            className="h-14 bg-white text-black hover:bg-gray-50 uppercase tracking-[0.2em] font-bold flex items-center justify-center border-2 border-black transition-all active:translate-y-1 disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
        </form>

        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="w-full h-px bg-black/10" />
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-black uppercase tracking-[0.2em] text-black/40 hover:text-black transition-colors flex items-center gap-2 group whitespace-nowrap"
          >
            {isLogin ? "Need an account?" : "Already have an account?"}
            <span className="text-black border-b-2 border-black group-hover:bg-[#FFF200] transition-colors px-1 whitespace-nowrap">
              {isLogin ? "SIGN UP" : "LOG IN"}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
