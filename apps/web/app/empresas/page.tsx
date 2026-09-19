import { Building2, Plus, Search } from "lucide-react"

import { PageHeading, PrimaryAction } from "@/components/page-heading"
import { PostulaShell } from "@/components/postula-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { empresas } from "@/lib/demo-data"

export default function EmpresasPage() {
  return (
    <PostulaShell><div className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-7 md:py-8">
      <PageHeading title="Empresas" description="Mantén organizada la información de las organizaciones asociadas a tus oportunidades y procesos." action={<PrimaryAction><Plus />Registrar empresa</PrimaryAction>} />
      <div className="relative mb-5 max-w-lg"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Buscar una empresa" className="h-11 bg-white pl-9 shadow-none" /></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {empresas.map((empresa) => <Card key={empresa.nombre} className="gap-4 border-slate-200 bg-white py-5 shadow-[0_8px_30px_rgba(15,23,42,.04)]"><CardContent className="flex items-start gap-4 px-5"><span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-600"><Building2 className="size-5" /></span><div className="min-w-0 flex-1"><p className="font-semibold text-slate-950">{empresa.nombre}</p><p className="mt-1 text-sm text-slate-500">{empresa.sector}</p></div><Button variant="ghost" size="icon-sm">•••</Button></CardContent><CardContent className="grid grid-cols-2 gap-3 px-5 text-sm"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Procesos</p><p className="mt-1 font-semibold text-slate-800">{empresa.procesos}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Última actividad</p><p className="mt-1 font-semibold text-slate-800">{empresa.ultima}</p></div></CardContent><CardContent className="px-5 text-sm text-slate-500">Contacto: {empresa.contacto}</CardContent></Card>)}
      </div>
    </div></PostulaShell>
  )
}
