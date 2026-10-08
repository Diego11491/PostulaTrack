"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, ClipboardList } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PageHeading } from "@/components/page-heading"
import { PostulaShell } from "@/components/postula-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApiClientError, apiRequest } from "@/lib/api-client"

type Event = {
  AuditId: number
  ActionCode: string
  EntityType: string
  EntityId: string | null
  ResultCode: string
  IpAddress: string | null
  CreatedAtUtc: string
  Email: string | null
}

const actions: Record<string, string> = {
  RECRUITER_ASSIGNED: "Acceso de RR. HH. asignado",
  RECRUITER_REVOKED: "Acceso de RR. HH. retirado",
  ACCOUNT_STATUS_CHANGED: "Acceso de cuenta modificado",
  CANDIDACY_SHARED: "Candidatura enviada",
  CANDIDACY_WITHDRAWN: "Candidatura retirada",
}

export default function AuditoriaPage() {
  const { user } = useAuth()
  const allowed = user?.roles.includes("ADMIN") ?? false
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!allowed) return
    apiRequest<{ events: Event[] }>("/admin/audit")
      .then(data => setEvents(data.events))
      .catch(cause => setError(cause instanceof ApiClientError ? cause.message : "No se pudo cargar la auditoría."))
      .finally(() => setLoading(false))
  }, [allowed])

  return <PostulaShell><div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-7 md:py-8">
    <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-slate-600"><Link href="/admin"><ArrowLeft />Volver a cuentas y empresas</Link></Button>
    <PageHeading eyebrow="Control de cambios" title="Auditoría" description="Consulta los eventos recientes de cuentas, roles y candidaturas. La información privada de seguimiento no se muestra aquí." />
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <Card className="border-slate-200 bg-white"><CardHeader className="border-b border-slate-100"><CardTitle className="flex items-center gap-2 text-lg"><ClipboardList className="size-5 text-cyan-700" />Actividad reciente</CardTitle><p className="text-sm text-slate-500">Últimos 200 eventos registrados por la API.</p></CardHeader><CardContent className="overflow-x-auto px-0"><Table><TableHeader><TableRow><TableHead className="pl-6">Fecha</TableHead><TableHead>Acción</TableHead><TableHead>Cuenta</TableHead><TableHead>Recurso</TableHead><TableHead className="pr-6">Resultado</TableHead></TableRow></TableHeader><TableBody>
      {loading ? <TableRow><TableCell colSpan={5} className="p-6 text-slate-500">Cargando eventos…</TableCell></TableRow> : events.length === 0 ? <TableRow><TableCell colSpan={5} className="p-6 text-slate-500">Aún no hay eventos registrados.</TableCell></TableRow> : events.map(event => <TableRow key={event.AuditId}><TableCell className="whitespace-nowrap pl-6 text-sm text-slate-600">{new Date(event.CreatedAtUtc).toLocaleString("es-PE", { timeZone: "America/Lima" })}</TableCell><TableCell className="font-medium text-slate-900">{actions[event.ActionCode] ?? event.ActionCode}</TableCell><TableCell className="text-sm text-slate-600">{event.Email ?? "Sistema"}</TableCell><TableCell className="text-sm text-slate-600">{event.EntityType}{event.EntityId ? ` · ${event.EntityId}` : ""}</TableCell><TableCell className="pr-6"><Badge variant="outline" className={event.ResultCode === "SUCCESS" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{event.ResultCode === "SUCCESS" ? "Correcto" : event.ResultCode}</Badge></TableCell></TableRow>)}
    </TableBody></Table></CardContent></Card>
  </div></PostulaShell>
}
