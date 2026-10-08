"use client"

import type { AuthUser, LoginInput, RegisterInput } from "@postulatrack/contracts"
import { useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { apiRequest } from "@/lib/api-client"
import { workspaceHome } from "@/lib/workspace-role"

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refresh = useCallback(async () => {
    try {
      const result = await apiRequest<{ user: AuthUser }>("/auth/me")
      setUser(result.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const login = useCallback(async (input: LoginInput) => {
    const result = await apiRequest<{ user: AuthUser }>("/auth/login", { method: "POST", body: JSON.stringify(input) })
    setUser(result.user)
    router.push(workspaceHome(result.user.roles))
  }, [router])

  const register = useCallback(async (input: RegisterInput) => {
    await apiRequest("/auth/register", { method: "POST", body: JSON.stringify(input) })
    await login({ email: input.email, password: input.password })
  }, [login])

  const logout = useCallback(async () => {
    try { await apiRequest("/auth/logout", { method: "POST" }) } finally {
      setUser(null)
      router.push("/acceso")
    }
  }, [router])

  const value = useMemo(() => ({ user, loading, login, register, logout, refresh }), [user, loading, login, register, logout, refresh])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider")
  return context
}
