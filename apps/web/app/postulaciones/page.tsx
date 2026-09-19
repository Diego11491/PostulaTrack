"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ChevronRight, Plus, Search } from "lucide-react"
import { PageHeading, PrimaryAction } from "@/components/page-heading"
import { PostulaShell } from "@/components/postula-shell"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { apiRequest } from "@/lib/api-client"
import { statusColumns, type ApplicationRow } from "@/lib/domain-types"

export default function PostulacionesPage() {
  const [items, setItems] = useState<ApplicationRow[]>([])
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  useEffect(() => { apiRequest<{ applications: ApplicationRow[] }>("/applications").then(data => setItems(data.applications)).catch(() => setError("No se pudieron cargar las postulaciones.")) }, [])
  const filtered = useMemo(() => items.filter(item => `${item.JobTitle} ${item.CompanyName}`.toLowerCase().includes(search.toLowerCase())), [items, search])

  return <PostulaShell><div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-7 md:py-8"><PageHeading eyebrow="HU-04 y HU-05 · Seguimiento trazable" title="Tablero de postulaciones" description="Visualiza cada proceso por etapa y registra cambios sin perder el historial." action={<PrimaryAction asChild><Link href="/oportunidades/nueva"><Plus />Nuevo proceso</Link></PrimaryAction>} /><div className="relative mb-5 max-w-lg"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proceso" className="h-11 bg-white pl-9" /></div>{error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="grid gap-4 overflow-x-auto pb-3 xl:grid-cols-4">
    {statusColumns.map(column => { const columnItems = filtered.filter(item => column.codes.includes(item.StatusCode)); return <section key={column.title} className="min-w-[285px] rounded-2xl bg-slate-200/45 p-3"><header className="mb-3 flex items-center gap-2 px-1"><span className={`size-2.5 rounded-full ${column.color}`} /><h2 className="text-sm font-bold text-slate-800">{column.title}</h2><Badge variant="secondary" className="ml-auto bg-white">{columnItems.length}</Badge></header><div className="space-y-3">{columnItems.map(item => <Link key={item.ApplicationId} href={`/postulaciones/${item.ApplicationId}`} className="group block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between"><Badge variant="outline" className="text-[0.68rem]">PT-{String(item.ApplicationId).padStart(4, "0")}</Badge><ChevronRight className="size-4 text-slate-300" /></div><p className="mt-3 font-semibold text-slate-900">{item.JobTitle}</p><p className="mt-1 text-sm text-slate-500">{item.CompanyName}</p><div className="mt-4 border-t border-slate-100 pt-3"><p className="text-xs font-medium text-slate-400">Estado actual</p><p className="mt-1 text-sm font-medium text-slate-700">{item.StatusName}</p><p className="mt-1 text-xs text-cyan-700">Actualizado {new Date(item.UpdatedAtUtc).toLocaleDateString("es-PE")}</p></div></Link>)}</div></section> })}
  </div></div></PostulaShell>
}
