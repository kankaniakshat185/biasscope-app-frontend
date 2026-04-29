"use client"

import { LoginForm } from "../../components/LoginForm"
import { authClient } from "../../lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/")
    }
  }, [session, router])

  if (isPending) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-black/20" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <LoginForm />
    </div>
  )
}
