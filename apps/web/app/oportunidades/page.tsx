"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, BriefcaseBusiness, Plus, Search } from "lucide-react"
import { PageHeading, PrimaryAction } from "@/components/page-heading"
import { PostulaShell } from "@/components/postula-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiRequest } from "@/lib/api-client"
import { modeLabel, type OpportunityRow } from "@/lib/domain-types"

export default function OportunidadesPage() {
  const [items, setItems] = useState<OpportunityRow[]>([])
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  useEffect(() => { apiRequest<{ opportunities: OpportunityRow[] }>("/opportunities").then(data => setItems(data.opportunities)).catch(() => setError("No se pudieron cargar las oportunidades.")) }, [])
  const filtered = useMemo(() => items.filter(item => `${item.JobTitle} ${item.CompanyName}`.toLowerCase().includes(search.toLowerCase())), [items, search])

  return <PostulaShell><div className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-7 md:py-8">
    <PageHeading eyebrow="HU-03 · Registro de oportunidades" title="Oportunidades laborales" description="Centraliza ofertas encontradas en distintas fuentes y conviértelas en procesos de seguimiento." action={<PrimaryAction asChild><Link href="/oportunidades/nueva"><Plus />Nueva oportunidad</Link></PrimaryAction>} />
    <div className="relative mb-5 max-w-xl"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por puesto o empresa" className="h-11 bg-white pl-9" /></div>
    {error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,.04)]"><Table><TableHeader><TableRow className="bg-slate-50"><TableHead className="pl-6">Oportunidad</TableHead><TableHead>Fuente</TableHead><TableHead>Modalidad</TableHead><TableHead>Publicada</TableHead><TableHead>Estado</TableHead><TableHead className="pr-6 text-right">Acción</TableHead></TableRow></TableHeader><TableBody>
      {filtered.map(item => <TableRow key={item.OpportunityId}><TableCell className="pl-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><BriefcaseBusiness className="size-4.5" /></span><div><p className="font-semibold text-slate-900">{item.JobTitle}</p><p className="text-sm text-slate-500">{item.CompanyName} · {item.Location || "Sin ubicación"}</p></div></div></TableCell><TableCell>{item.SourceName || "Manual"}</TableCell><TableCell>{modeLabel(item.WorkMode)}</TableCell><TableCell>{item.PublishedOn ? new Date(item.PublishedOn).toLocaleDateString("es-PE") : "—"}</TableCell><TableCell><Badge variant="outline" className={item.ApplicationId ? "border-cyan-200 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-slate-50"}>{item.ApplicationStatus || "Guardada"}</Badge></TableCell><TableCell className="pr-6 text-right">{item.ApplicationId ? <Button variant="ghost" size="icon-sm" asChild><Link href={`/postulaciones/${item.ApplicationId}`}><ArrowUpRight /><span className="sr-only">Abrir</span></Link></Button> : "—"}</TableCell></TableRow>)}
      {!error && filtered.length === 0 && <TableRow><TableCell colSpan={6} className="h-28 text-center text-slate-500">No hay oportunidades para mostrar.</TableCell></TableRow>}
    </TableBody></Table><div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">{filtered.length} oportunidades</div></div>
  </div></PostulaShell>
}
