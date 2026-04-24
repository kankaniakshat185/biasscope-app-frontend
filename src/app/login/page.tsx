"use client"

import { useState } from "react"
import { authClient } from "../../lib/auth-client"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
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
        const { data, error } = await authClient.signIn.email({
          email,
          password
        })
        if (error) throw new Error(error.message)
        router.push("/")
      } else {
        const { data, error } = await authClient.signUp.email({
          email,
          password,
          name
        })
        if (error) throw new Error(error.message)
        router.push("/")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 font-[family-name:var(--font-oswald)]">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-sm p-8 border-2 border-black shadow-none flex flex-col gap-6">
        <h1 className="text-3xl font-extrabold uppercase tracking-tighter text-center">
          {isLogin ? "Sign In" : "Create Account"}
        </h1>
        
        {error && <div className="text-red-600 bg-red-100 p-3 text-sm font-semibold border-2 border-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 px-4 border-2 border-black bg-white focus:outline-none"
              required={!isLogin}
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 px-4 border-2 border-black bg-white focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 px-4 border-2 border-black bg-white focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="h-12 mt-2 bg-black text-white hover:bg-gray-800 uppercase tracking-widest font-bold flex items-center justify-center border-2 border-black disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (isLogin ? "Login" : "Sign Up")}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm font-bold uppercase tracking-wider text-black/60 hover:text-black transition-colors"
        >
          {isLogin ? "Need an account? Sign Up" : "Already have an account? Log In"}
        </button>
      </div>
    </div>
  )
}
