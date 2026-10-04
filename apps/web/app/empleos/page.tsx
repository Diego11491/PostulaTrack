"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowUpRight, BriefcaseBusiness, Search } from "lucide-react"
import { PostulaShell } from "@/components/postula-shell"
import { PageHeading } from "@/components/page-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ApiClientError, apiRequest } from "@/lib/api-client"

type Job = { id: string; title: string; company: string; location: string; snippet: string; link: string; source: "Jooble" }
type Result = { totalCount: number; jobs: Job[] }

export default function EmpleosPage() {
  const [keywords, setKeywords] = useState("")
  const [location, setLocation] = useState("Lima")
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState<string | null>(null)

  async function search(event: React.FormEvent) {
    event.preventDefault()
    if (keywords.trim().length < 2 || location.trim().length < 2) return
    setError(""); setLoading(true); setResult(null)
    try {
      const query = new URLSearchParams({ keywords: keywords.trim(), location: location.trim() })
      setResult(await apiRequest<Result>(`/jobs?${query}`))
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : "No se pudo buscar en este momento.")
    } finally { setLoading(false) }
  }

  async function save(job: Job) {
    setSaving(job.id); setError("")
    try {
      const record = await apiRequest<{ opportunityId: number }>("/opportunities", { method: "POST", body: JSON.stringify({
        companyName: job.company === "Empresa no indicada" ? "Empresa por confirmar" : job.company,
        jobTitle: job.title, sourceName: "Jooble", sourceUrl: job.link,
        location: job.location || null, createApplication: false,
      }) })
      setSaved(current => ({ ...current, [job.id]: record.opportunityId }))
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : "No se pudo guardar la oportunidad.")
    } finally { setSaving(null) }
  }

  return <PostulaShell><div className="mx-auto w-full max-w-[1250px] px-4 py-6 md:px-7 md:py-8">
    <PageHeading eyebrow="Explorar · fuente externa" title="Buscar empleos" description="Encuentra ofertas y guarda las que quieras seguir. La búsqueda consulta Jooble; tus oportunidades y postulaciones siguen guardándose en PostulaTrack." />
    <form onSubmit={search} className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px_auto]">
      <Input aria-label="Puesto o palabras clave" placeholder="Puesto o palabras clave" value={keywords} maxLength={80} onChange={e => setKeywords(e.target.value)} required />
      <Input aria-label="Ubicación" placeholder="Ubicación" value={location} maxLength={80} onChange={e => setLocation(e.target.value)} required />
      <Button type="submit" disabled={loading || keywords.trim().length < 2 || location.trim().length < 2}><Search />{loading ? "Buscando…" : "Buscar"}</Button>
    </form>
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {loading && <p role="status" className="text-sm text-slate-600">Consultando ofertas…</p>}
    {result && <p className="mb-4 text-sm text-slate-600">{result.totalCount} coincidencias en la fuente. Se muestran hasta 10 resultados.</p>}
    {result?.jobs.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No se encontraron ofertas para estos términos. Prueba otra búsqueda.</p>}
    <div className="grid gap-4 lg:grid-cols-2">{result?.jobs.map(job => <Card key={job.id} className="border-slate-200 bg-white"><CardContent className="space-y-3 px-5">
      <div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-slate-950">{job.title}</h2><p className="mt-1 text-sm text-slate-600">{job.company} · {job.location || "Ubicación no indicada"}</p></div><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700"><BriefcaseBusiness className="size-4" /></span></div>
      {job.snippet && <p className="text-sm leading-6 text-slate-600">{job.snippet}</p>}
      <Badge variant="outline">Fuente: Jooble</Badge>
      <div className="flex flex-wrap gap-2 pt-2"><Button asChild variant="outline" size="sm"><a href={job.link} target="_blank" rel="noopener noreferrer">Ver oferta original <ArrowUpRight /></a></Button>
        {saved[job.id] ? <Button asChild size="sm"><Link href="/oportunidades">Guardada · Ver mis oportunidades</Link></Button> : <Button size="sm" disabled={saving === job.id} onClick={() => void save(job)}>{saving === job.id ? "Guardando…" : "Guardar oportunidad"}</Button>}
      </div>
    </CardContent></Card>)}</div>
    <p className="mt-6 text-xs leading-5 text-slate-500">Las ofertas pueden cambiar o expirar. Confirma los detalles en el sitio de origen. Guardar una oferta no equivale a postular.</p>
  </div></PostulaShell>
}
