"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, BriefcaseBusiness, Clock3, Plus, TrendingUp, UsersRound } from "lucide-react"
import { PostulaShell } from "@/components/postula-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiRequest } from "@/lib/api-client"
import { useAuth } from "@/components/auth-provider"
import { workspaceRole } from "@/lib/workspace-role"

type Dashboard = { metrics: { activeProcesses: number; interviews: number; pendingActions: number; progressRate: number }; recent: Array<{ ApplicationId: number; JobTitle: string; CompanyName: string; StatusName: string; UpdatedAtUtc: string }> }

export default function Home() {
  const {user} = useAuth()
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState("")
  useEffect(() => { if(user && workspaceRole(user.roles) === "USER")
    apiRequest<Dashboard>("/dashboard").then(setData).catch(() => setError("No se pudieron cargar los indicadores.")) }, [user])
  const metrics = data?.metrics

  return <PostulaShell><div className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-7 md:py-8">
    <section className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="mb-1 text-sm font-medium text-cyan-700">Panel personal</p><h1 className="text-2xl font-bold tracking-[-0.025em] text-slate-950 sm:text-[2rem]">Tu búsqueda, bajo control</h1><p className="mt-2 max-w-2xl text-[0.98rem] leading-6 text-slate-600">Consulta tus procesos y registra cada avance sin perder su historial.</p></div><Button asChild size="lg" className="h-11 rounded-xl bg-slate-950 px-5 text-white"><Link href="/oportunidades/nueva"><Plus />Registrar oportunidad</Link></Button></section>
    {error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Procesos activos" value={metrics?.activeProcesses} icon={BriefcaseBusiness} /><Metric label="Entrevistas" value={metrics?.interviews} icon={UsersRound} /><Metric label="Acciones pendientes" value={metrics?.pendingActions} icon={Clock3} /><Metric label="Tasa de avance" value={metrics ? `${metrics.progressRate}%` : undefined} icon={TrendingUp} /></section>
    <Card className="mt-5 border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,.055)]"><CardHeader className="border-b border-slate-100 pb-5"><CardTitle className="text-lg">Actividad reciente</CardTitle><Button asChild variant="ghost" size="sm"><Link href="/postulaciones">Ver tablero <ArrowRight /></Link></Button></CardHeader><CardContent className="divide-y divide-slate-100 px-6">{!data && !error && <p className="py-8 text-sm text-slate-500">Cargando información…</p>}{data?.recent.length === 0 && <p className="py-8 text-sm text-slate-500">Aún no tienes procesos. Registra tu primera oportunidad para comenzar.</p>}{data?.recent.map(item => <Link key={item.ApplicationId} href={`/postulaciones/${item.ApplicationId}`} className="flex items-center gap-4 py-4"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{item.JobTitle}</p><p className="truncate text-sm text-slate-500">{item.CompanyName}</p></div><Badge variant="outline">{item.StatusName}</Badge><span className="hidden text-xs text-slate-400 sm:block">{new Date(item.UpdatedAtUtc).toLocaleDateString("es-PE")}</span></Link>)}</CardContent></Card>
  </div></PostulaShell>
}

function Metric({ label, value, icon: Icon }: { label: string; value?: number | string; icon: typeof BriefcaseBusiness }) { return <Card className="border-slate-200 bg-white py-5"><CardContent className="flex items-start justify-between px-5"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-950">{value ?? "—"}</p></div><span className="grid size-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><Icon className="size-5" /></span></CardContent></Card> }
