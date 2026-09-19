"use client"

import { useEffect, useState } from "react"
import { Save, UserRound } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PageHeading } from "@/components/page-heading"
import { PostulaShell } from "@/components/postula-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiClientError, apiRequest } from "@/lib/api-client"

type Profile = { FirstName: string; LastName: string; Phone: string | null; City: string | null; Headline: string | null; ProfessionalSummary: string | null; Institution: string | null; Career: string | null; GraduationYear: number | null }

export default function PerfilPage() {
  const { refresh } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  useEffect(() => { apiRequest<{ profile: Profile }>("/profile").then(data => setProfile(data.profile)).catch(() => setMessage("No se pudo cargar el perfil.")) }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("")
    const data = new FormData(event.currentTarget); const value = (name: string) => String(data.get(name) || "").trim()
    try { await apiRequest("/profile", { method: "PUT", body: JSON.stringify({ firstName: value("firstName"), lastName: value("lastName"), phone: value("phone") || null, city: value("city") || null, headline: value("headline") || null, professionalSummary: value("professionalSummary") || null, institution: value("institution") || null, career: value("career") || null, graduationYear: value("graduationYear") ? Number(value("graduationYear")) : null }) }); await refresh(); setMessage("Perfil actualizado correctamente.") }
    catch (cause) { setMessage(cause instanceof ApiClientError ? cause.message : "No se pudo actualizar el perfil.") }
    finally { setSaving(false) }
  }

  return <PostulaShell><div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-7 md:py-8"><PageHeading eyebrow="HU-02 · Perfil personal y profesional" title="Mi perfil" description="Mantén actualizada la información asociada a tu cuenta." />{message && <p className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800">{message}</p>}{!profile ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">Cargando perfil…</p> : <form onSubmit={submit}><Card className="border-slate-200 bg-white"><CardHeader className="border-b border-slate-100 pb-4"><CardTitle className="flex items-center gap-2 text-base"><UserRound className="size-4.5 text-cyan-700" />Información personal y profesional</CardTitle></CardHeader><CardContent className="grid gap-5 px-6 md:grid-cols-2"><Field label="Nombres"><Input name="firstName" required minLength={2} defaultValue={profile.FirstName} /></Field><Field label="Apellidos"><Input name="lastName" required minLength={2} defaultValue={profile.LastName} /></Field><Field label="Teléfono"><Input name="phone" defaultValue={profile.Phone || ""} /></Field><Field label="Ciudad"><Input name="city" defaultValue={profile.City || ""} /></Field><div className="md:col-span-2"><Field label="Titular profesional"><Input name="headline" defaultValue={profile.Headline || ""} placeholder="Ej. Estudiante de Ingeniería de Sistemas" /></Field></div><div className="md:col-span-2"><Field label="Resumen profesional"><Textarea name="professionalSummary" rows={5} defaultValue={profile.ProfessionalSummary || ""} /></Field></div><Field label="Institución"><Input name="institution" defaultValue={profile.Institution || ""} /></Field><Field label="Carrera"><Input name="career" defaultValue={profile.Career || ""} /></Field><Field label="Año de egreso"><Input name="graduationYear" type="number" min={1950} max={2200} defaultValue={profile.GraduationYear || ""} /></Field><div className="flex items-end justify-end md:col-span-2"><Button disabled={saving} className="bg-slate-950 text-white"><Save />{saving ? "Guardando…" : "Guardar cambios"}</Button></div></CardContent></Card></form>}</div></PostulaShell>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
