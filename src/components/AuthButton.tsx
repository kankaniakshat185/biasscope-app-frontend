"use client"

import { authClient } from "../lib/auth-client"
import { useRouter } from "next/navigation"
import { User } from "lucide-react"

export function AuthButton() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  if (isPending) {
    return <div className="text-sm font-bold uppercase tracking-widest text-black/50 print:hidden">Loading...</div>
  }

  return (
    <div className="flex items-center gap-8 print:hidden">
      {session ? (
        <>
          <div className="text-sm font-normal uppercase tracking-widest text-black/80 hidden sm:flex items-center gap-2">
            <User className="w-4 h-4 stroke-[2.5px]" />
            {session.user.name}
          </div>
          <div className="w-[2px] h-4 bg-black hidden sm:block"></div>
          <button 
            onClick={() => router.push("/subscriptions")}
            className="text-sm py-2 font-bold uppercase tracking-widest text-black hover:underline underline-offset-4 decoration-2 transition-colors"
          >
            Subscriptions
          </button>
          <button 
            onClick={() => router.push("/history")}
            className="text-sm py-2 font-bold uppercase tracking-widest text-black hover:underline underline-offset-4 decoration-2 transition-colors"
          >
            Vault
          </button>
          <button 
            onClick={async () => {
              await authClient.signOut()
              router.refresh()
            }}
            className="text-sm border-2 border-transparent py-2 font-bold uppercase tracking-widest text-black/50 hover:text-red-600 transition-colors"
          >
            Logout
          </button>
        </>
      ) : null}
    </div>
  )
}
