"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, BriefcaseBusiness, UserPlus } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PasswordInput } from "@/components/password-input"
import { ApiClientError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegistroPage() {
  const { register } = useAuth()
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const data = new FormData(event.currentTarget)
    const password = String(data.get("password"))
    if (password !== String(data.get("confirmation"))) return setError("Las contraseñas no coinciden.")
    if (data.get("privacy") !== "on") return setError("Debes aceptar el tratamiento de datos para crear la cuenta.")
    setSubmitting(true)
    try {
      await register({ email: String(data.get("email")), password, firstName: String(data.get("firstName")), lastName: String(data.get("lastName")) })
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : "No se pudo conectar con el servidor.")
    } finally { setSubmitting(false) }
  }

  return <main className="min-h-svh bg-[#f4f7f9] px-5 py-8"><div className="mx-auto max-w-lg"><Link href="/acceso" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600"><ArrowLeft className="size-4" />Volver al acceso</Link><Card className="border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,.12)]"><CardHeader><span className="mb-3 grid size-11 place-items-center rounded-xl bg-slate-950 text-cyan-300"><BriefcaseBusiness className="size-5" /></span><CardTitle className="text-2xl">Crear una cuenta</CardTitle><p className="text-sm text-slate-500">Empieza a organizar tus oportunidades y procesos laborales.</p></CardHeader><CardContent className="px-6"><form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}><Field label="Nombres" htmlFor="firstName"><Input id="firstName" name="firstName" required minLength={2} autoComplete="given-name" /></Field><Field label="Apellidos" htmlFor="lastName"><Input id="lastName" name="lastName" required minLength={2} autoComplete="family-name" /></Field><div className="sm:col-span-2"><Field label="Correo electrónico" htmlFor="email"><Input id="email" name="email" required type="email" autoComplete="email" /></Field></div><Field label="Contraseña" htmlFor="password"><PasswordInput id="password" name="password" required minLength={12} autoComplete="new-password" placeholder="12+ caracteres" /></Field><Field label="Confirmar contraseña" htmlFor="confirmation"><PasswordInput id="confirmation" name="confirmation" required minLength={12} autoComplete="new-password" /></Field><p className="text-xs leading-5 text-slate-500 sm:col-span-2">Debe incluir mayúscula, minúscula y número.</p><label className="flex items-start gap-2 text-sm leading-5 text-slate-600 sm:col-span-2"><Checkbox name="privacy" className="mt-0.5" />Acepto el tratamiento de mis datos para gestionar mi cuenta y mis registros personales.</label>{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p>}<Button disabled={submitting} className="h-11 bg-slate-950 text-white hover:bg-slate-800 sm:col-span-2"><UserPlus />{submitting ? "Creando cuenta…" : "Crear cuenta"}</Button></form></CardContent></Card></div></main>
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) { return <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div> }
