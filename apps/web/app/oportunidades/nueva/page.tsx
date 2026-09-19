"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { PostulaShell } from "@/components/postula-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { ApiClientError, apiRequest } from "@/lib/api-client"

export default function NuevaOportunidadPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [createApplication, setCreateApplication] = useState(true)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("")
    const form = new FormData(event.currentTarget)
    const value = (name: string) => String(form.get(name) || "")
    try {
      const result = await apiRequest<{ opportunityId: number; applicationId: number | null }>("/opportunities", { method: "POST", body: JSON.stringify({ companyName: value("companyName"), sector: value("sector") || null, jobTitle: value("jobTitle"), sourceName: value("sourceName") || null, sourceUrl: value("sourceUrl"), workMode: value("workMode") || null, location: value("location") || null, publishedOn: value("publishedOn") || null, closingOn: value("closingOn") || null, notes: value("notes") || null, createApplication }) })
      router.push(result.applicationId ? `/postulaciones/${result.applicationId}` : "/oportunidades")
    } catch (cause) { setError(cause instanceof ApiClientError ? cause.message : "No se pudo guardar la oportunidad.") } finally { setSaving(false) }
  }

  return <PostulaShell><div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-7 md:py-8"><Button asChild variant="ghost" size="sm" className="mb-5 -ml-2 text-slate-600"><Link href="/oportunidades"><ArrowLeft />Volver</Link></Button><div className="mb-7"><p className="mb-1 text-sm font-semibold text-cyan-700">HU-03 · Nuevo registro</p><h1 className="text-2xl font-bold text-slate-950">Registrar oportunidad</h1><p className="mt-2 text-slate-600">Guarda la oferta y conviértela opcionalmente en una postulación trazable.</p></div>{error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<form onSubmit={submit}><Card className="border-slate-200 bg-white"><CardHeader className="border-b border-slate-100 pb-5"><CardTitle className="text-lg">Información de la oferta</CardTitle></CardHeader><CardContent className="grid gap-5 px-6 md:grid-cols-2"><Field label="Puesto" required><Input name="jobTitle" required /></Field><Field label="Empresa" required><Input name="companyName" required /></Field><Field label="Sector"><Input name="sector" placeholder="Tecnología, banca…" /></Field><Field label="Fuente"><Input name="sourceName" placeholder="LinkedIn, referido…" /></Field><Field label="Enlace"><Input name="sourceUrl" type="url" placeholder="https://..." /></Field><Field label="Modalidad"><NativeSelect name="workMode" className="w-full" defaultValue="HYBRID"><NativeSelectOption value="HYBRID">Híbrida</NativeSelectOption><NativeSelectOption value="REMOTE">Remota</NativeSelectOption><NativeSelectOption value="ONSITE">Presencial</NativeSelectOption></NativeSelect></Field><Field label="Ubicación"><Input name="location" /></Field><Field label="Fecha de publicación"><Input name="publishedOn" type="date" /></Field><Field label="Fecha límite"><Input name="closingOn" type="date" /></Field><div className="md:col-span-2"><Field label="Notas"><Textarea name="notes" rows={4} /></Field></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 md:col-span-2"><Checkbox checked={createApplication} onCheckedChange={value => setCreateApplication(value === true)} className="mt-0.5" /><span><span className="block text-sm font-semibold text-slate-900">Crear proceso de seguimiento</span><span className="mt-1 block text-sm text-slate-500">Inicia el historial con estado “Registrada”.</span></span></label></CardContent><CardFooter className="justify-end gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="outline" asChild><Link href="/oportunidades">Cancelar</Link></Button><Button disabled={saving} className="bg-slate-950 text-white"><Save />{saving ? "Guardando…" : "Guardar"}</Button></CardFooter></Card></form></div></PostulaShell>
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <div className="space-y-2"><Label className="text-sm font-semibold text-slate-700">{label}{required && <span className="ml-1 text-red-500">*</span>}</Label>{children}</div> }
