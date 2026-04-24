"use client"

import { authClient } from "../lib/auth-client"
import { useRouter } from "next/navigation"

export function AuthButton() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  if (isPending) {
    return <div className="text-sm font-bold uppercase tracking-widest text-black/50 print:hidden">Loading...</div>
  }

  return (
    <div className="flex items-center gap-4 print:hidden">
      {session ? (
        <>
          <div className="text-sm font-bold uppercase tracking-widest text-black/80 hidden sm:block">
            {session.user.name}
          </div>
          <button 
            onClick={() => router.push("/history")}
            className="text-sm border-2 border-black px-4 py-2 font-bold uppercase tracking-widest text-black bg-white hover:bg-black hover:text-white transition-colors"
          >
            Vault
          </button>
          <button 
            onClick={async () => {
              await authClient.signOut()
              router.refresh()
            }}
            className="text-sm border-2 border-transparent px-4 py-2 font-bold uppercase tracking-widest text-black/50 hover:text-red-600 transition-colors"
          >
            Logout
          </button>
        </>
      ) : (
        <button 
          onClick={() => router.push("/login")}
          className="text-sm border-2 border-black px-4 py-2 font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors"
        >
          Login
        </button>
      )}
    </div>
  )
}
