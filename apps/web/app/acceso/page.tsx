"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, BriefcaseBusiness, Check, LockKeyhole, Mail, ShieldCheck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { ApiClientError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AccesoPage() {
  const { login, user, loading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => { if (!loading && user) router.replace("/") }, [loading, router, user])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    const data = new FormData(event.currentTarget)
    try {
      await login({ email: String(data.get("email")), password: String(data.get("password")) })
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : "No se pudo conectar con el servidor.")
    } finally { setSubmitting(false) }
  }

  return <main className="grid min-h-svh bg-slate-950 lg:grid-cols-[1.05fr_.95fr]">
    <section className="relative hidden overflow-hidden border-r border-white/10 p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute -left-24 top-28 size-80 rounded-full bg-cyan-400/10 blur-3xl" /><div className="absolute bottom-20 right-0 size-72 rounded-full bg-sky-500/10 blur-3xl" /><span className="relative flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-cyan-400 text-slate-950"><BriefcaseBusiness className="size-5" /></span><span className="text-lg font-bold">PostulaTrack</span></span><div className="relative max-w-xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">Tu centro de seguimiento laboral</p><h1 className="mt-4 text-4xl font-bold leading-[1.15] tracking-tight">Cada proceso, cada cambio y cada próximo paso en un solo lugar.</h1><ul className="mt-8 space-y-4 text-slate-300"><li className="flex gap-3"><Check className="mt-0.5 size-5 text-cyan-300" />Historial cronológico sin perder estados anteriores</li><li className="flex gap-3"><Check className="mt-0.5 size-5 text-cyan-300" />Oportunidades de distintas fuentes centralizadas</li><li className="flex gap-3"><Check className="mt-0.5 size-5 text-cyan-300" />Información separada por propietario y rol</li></ul></div><p className="relative text-sm text-slate-500">PostulaTrack · Proyecto hecho por Diego</p></section>
    <section className="flex items-center justify-center bg-[#f4f7f9] px-5 py-10"><Card className="w-full max-w-md border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,.16)]"><CardHeader className="pb-2"><div className="mb-4 grid size-11 place-items-center rounded-xl bg-slate-950 text-cyan-300 lg:hidden"><BriefcaseBusiness className="size-5" /></div><CardTitle className="text-2xl tracking-tight">Iniciar sesión</CardTitle><p className="text-sm text-slate-500">Accede a tu espacio personal de seguimiento.</p></CardHeader><CardContent className="px-6"><form className="space-y-4" onSubmit={submit}><div className="space-y-2"><Label htmlFor="email">Correo electrónico</Label><div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="email" name="email" required type="email" autoComplete="email" placeholder="nombre@correo.com" className="h-11 pl-9" /></div></div><div className="space-y-2"><Label htmlFor="password">Contraseña</Label><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="password" name="password" required type="password" autoComplete="current-password" placeholder="••••••••••••" className="h-11 pl-9" /></div></div>{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Button disabled={submitting} className="h-11 w-full bg-slate-950 text-white hover:bg-slate-800">{submitting ? "Verificando…" : "Ingresar de forma segura"}<ArrowRight /></Button></form><div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-xs text-slate-400">¿Aún no tienes cuenta?</span><div className="h-px flex-1 bg-slate-200" /></div><Button variant="outline" asChild className="h-11 w-full"><Link href="/registro">Crear una cuenta</Link></Button><p className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck className="size-3.5" />Sesión HttpOnly, bloqueo y control por roles</p></CardContent></Card></section>
  </main>
}
