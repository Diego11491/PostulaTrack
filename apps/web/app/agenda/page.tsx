import { CalendarDays, CheckCircle2, Clock3, Plus } from "lucide-react"

import { PageHeading, PrimaryAction } from "@/components/page-heading"
import { PostulaShell } from "@/components/postula-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const dias = ["Lun 14", "Mar 15", "Mié 16", "Jue 17", "Vie 18"]

export default function AgendaPage() {
  return (
    <PostulaShell><div className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-7 md:py-8">
      <PageHeading title="Agenda y recordatorios" description="Organiza entrevistas, evaluaciones y tareas vinculadas a cada proceso laboral." action={<PrimaryAction><Plus />Nueva actividad</PrimaryAction>} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)]">
        <Card className="border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,.04)]"><CardHeader className="border-b border-slate-100 pb-5"><CardTitle>Semana del 14 al 18 de septiembre</CardTitle><CalendarDays className="size-5 text-slate-400" /></CardHeader><CardContent className="grid gap-3 px-5 sm:grid-cols-5">{dias.map((dia, i) => <div key={dia} className={`min-h-48 rounded-xl border p-3 ${i === 2 ? "border-cyan-200 bg-cyan-50/50" : "border-slate-200 bg-slate-50/60"}`}><p className="text-sm font-semibold text-slate-700">{dia}</p>{i === 2 && <div className="mt-4 rounded-xl bg-slate-950 p-3 text-white"><p className="text-xs font-semibold text-cyan-300">10:30</p><p className="mt-1 text-sm font-semibold">Entrevista técnica</p><p className="mt-1 text-xs text-slate-400">Interbank</p></div>}{i === 4 && <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold text-amber-700">18:00</p><p className="mt-1 text-sm font-semibold text-slate-800">Revisar respuesta</p><p className="mt-1 text-xs text-slate-400">Alicorp</p></div>}</div>)}</CardContent></Card>
        <Card className="border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,.04)]"><CardHeader className="border-b border-slate-100 pb-5"><CardTitle>Hoy</CardTitle><Badge variant="outline">3 actividades</Badge></CardHeader><CardContent className="space-y-5 px-6"><AgendaItem time="10:30" title="Entrevista técnica" meta="Interbank" /><AgendaItem time="15:00" title="Enviar prueba técnica" meta="NTT DATA" /><AgendaItem time="18:00" title="Actualizar CV" meta="Perfil profesional" muted /></CardContent></Card>
      </div>
    </div></PostulaShell>
  )
}

function AgendaItem({ time, title, meta, muted = false }: { time: string; title: string; meta: string; muted?: boolean }) {
  return <div className="flex gap-3"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${muted ? "bg-slate-100 text-slate-500" : "bg-cyan-50 text-cyan-700"}`}>{muted ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-4" />}</span><div><p className="text-xs font-semibold text-slate-400">{time}</p><p className="mt-0.5 text-sm font-semibold text-slate-900">{title}</p><p className="mt-0.5 text-xs text-slate-500">{meta}</p></div></div>
}
