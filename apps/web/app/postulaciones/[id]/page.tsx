"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, BriefcaseBusiness, ExternalLink, History, MapPin, ShieldCheck } from "lucide-react"
import { PostulaShell } from "@/components/postula-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { ApiClientError, apiRequest } from "@/lib/api-client"
import { modeLabel, statusOptions, type ApplicationDetail, type HistoryRow } from "@/lib/domain-types"

type DetailResponse = { application: ApplicationDetail; history: HistoryRow[] }

export default function DetallePostulacionPage() {
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<DetailResponse | null>(null)
  const [status, setStatus] = useState("INTERVIEW")
  const [comment, setComment] = useState("")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const load = useCallback(() => apiRequest<DetailResponse>(`/applications/${params.id}`).then(setData).catch(() => setMessage("No se pudo cargar la postulación.")), [params.id])
  useEffect(() => { void load() }, [load])

  async function updateStatus(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("")
    try { await apiRequest(`/applications/${params.id}/status`, { method: "POST", body: JSON.stringify({ newStatusCode: status, comment: comment || null }) }); setComment(""); setMessage("Estado e historial actualizados."); await load() }
    catch (cause) { setMessage(cause instanceof ApiClientError ? cause.message : "No se pudo actualizar el estado.") }
    finally { setSaving(false) }
  }

  const item = data?.application
  return <PostulaShell><div className="mx-auto w-full max-w-[1350px] px-4 py-6 md:px-7 md:py-8"><Button asChild variant="ghost" size="sm" className="mb-5 -ml-2 text-slate-600"><Link href="/postulaciones"><ArrowLeft />Volver al tablero</Link></Button>{!item ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">{message || "Cargando proceso…"}</p> : <><header className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div><div className="mb-2 flex items-center gap-2"><Badge className="bg-cyan-100 text-cyan-800">{item.StatusName}</Badge><span className="text-xs font-semibold text-slate-400">PT-{String(item.ApplicationId).padStart(4, "0")}</span></div><h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">{item.JobTitle}</h1><p className="mt-1 text-base text-slate-500">{item.CompanyName}</p></div></header>{message && <p className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800">{message}</p>}<div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,.65fr)]"><Card className="border-slate-200 bg-white"><CardHeader className="border-b border-slate-100 pb-4"><CardTitle className="flex items-center gap-2 text-base"><History className="size-4.5 text-cyan-700" />Historial cronológico</CardTitle></CardHeader><CardContent className="px-6"><div className="mb-6 rounded-xl border border-cyan-200 bg-cyan-50 p-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 text-cyan-700" /><p className="text-sm text-slate-600">Cada cambio conserva el estado anterior, el nuevo estado, la fecha y el usuario responsable.</p></div></div><div className="relative before:absolute before:bottom-3 before:left-[7px] before:top-3 before:w-px before:bg-slate-200">{data.history.map((row, index) => <div key={row.HistoryId} className="relative grid grid-cols-[16px_1fr] gap-4 pb-7 last:pb-0"><span className={`mt-1 size-4 rounded-full border-4 border-white ring-1 ${index === 0 ? "bg-cyan-500 ring-cyan-300" : "bg-slate-300 ring-slate-300"}`} /><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{row.NewStatus}</p><span className="text-xs text-slate-400">{new Date(row.ChangedAtUtc).toLocaleString("es-PE")}</span></div><p className="mt-1 text-sm text-slate-600">{row.Comment || `Cambio desde ${row.PreviousStatus || "inicio"}.`}</p><p className="mt-1 text-xs text-slate-400">{row.FirstName} {row.LastName}</p></div></div>)}</div></CardContent></Card><div className="space-y-5"><Card className="border-slate-200 bg-white"><CardHeader className="border-b border-slate-100 pb-4"><CardTitle className="text-base">Información</CardTitle></CardHeader><CardContent className="space-y-4 px-6"><Info icon={BriefcaseBusiness} label="Empresa" value={item.CompanyName} /><Info icon={MapPin} label="Modalidad" value={`${modeLabel(item.WorkMode)} · ${item.Location || "Sin ubicación"}`} />{item.SourceUrl && <Button variant="outline" className="w-full" asChild><a href={item.SourceUrl} target="_blank" rel="noreferrer"><ExternalLink />Abrir oferta original</a></Button>}</CardContent></Card><Card className="border-0 bg-slate-950 text-white"><CardHeader><CardTitle className="text-base">Actualizar estado</CardTitle></CardHeader><CardContent className="px-6"><form className="space-y-4" onSubmit={updateStatus}><div className="space-y-2"><Label htmlFor="status">Nuevo estado</Label><NativeSelect id="status" value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-white text-slate-900">{statusOptions.map(([code, label]) => <NativeSelectOption key={code} value={code}>{label}</NativeSelectOption>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor="comment">Comentario</Label><Textarea id="comment" value={comment} onChange={e => setComment(e.target.value)} className="bg-white text-slate-900" placeholder="Evidencia o siguiente paso" /></div><Button disabled={saving} className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">{saving ? "Guardando…" : "Registrar cambio"}</Button></form></CardContent></Card></div></div></>}</div></PostulaShell>
}

function Info({ icon: Icon, label, value }: { icon: typeof BriefcaseBusiness; label: string; value: string }) { return <div className="flex gap-3"><span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500"><Icon className="size-4" /></span><div><p className="text-xs text-slate-400">{label}</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p></div></div> }
