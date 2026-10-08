"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { BriefcaseBusiness, Users, ArrowUpRight } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PostulaShell } from "@/components/postula-shell"
import { PageHeading, PrimaryAction } from "@/components/page-heading"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiRequest, ApiClientError } from "@/lib/api-client"

type Submission = { SubmissionId:number; JobOfferId:number; JobTitle:string; ApplicantName:string; ApplicantEmail:string; ConsentAtUtc:string }
type Offer = { JobOfferId:number; IsActive:boolean }

export default function ReclutamientoPage() {
  const {user} = useAuth()
  const allowed = user?.roles.includes("RECRUITER") ?? false
  const [organization, setOrganization] = useState("")
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    try {
      const [context, inbox, managed] = await Promise.all([
        apiRequest<{organization:{Name:string}}>("/recruiter/context"),
        apiRequest<{submissions:Submission[]}>("/recruiter/submissions"),
        apiRequest<{offers:Offer[]}>("/job-offers/manage"),
      ])
      setOrganization(context.organization.Name)
      setSubmissions(inbox.submissions)
      setOffers(managed.offers)
    } catch (cause) { setError(cause instanceof ApiClientError ? cause.message : "No se pudo cargar reclutamiento.") }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { if (allowed) void load() }, [allowed,load])

  return <PostulaShell><div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-7 md:py-8">
    <PageHeading eyebrow="Espacio de RR. HH." title={organization || "Reclutamiento"} description="Gestiona las ofertas de tu organización y las candidaturas que las personas enviaron expresamente." action={allowed ? <PrimaryAction asChild><Link href="/oportunidades/publicar"><BriefcaseBusiness />Gestionar ofertas</Link></PrimaryAction> : undefined} />
    {!allowed ? <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">Tu cuenta no tiene acceso a reclutamiento.</p> : <>
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <div className="mb-5 grid gap-4 sm:grid-cols-2"><Card className="border-slate-200 bg-white"><CardContent className="flex items-center gap-4 px-6"><BriefcaseBusiness className="size-6 text-cyan-700" /><div><p className="text-sm text-slate-500">Ofertas activas</p><p className="text-2xl font-bold text-slate-950">{offers.filter(offer => offer.IsActive).length}</p></div></CardContent></Card><Card className="border-slate-200 bg-white"><CardContent className="flex items-center gap-4 px-6"><Users className="size-6 text-cyan-700" /><div><p className="text-sm text-slate-500">Candidaturas recibidas</p><p className="text-2xl font-bold text-slate-950">{submissions.length}</p></div></CardContent></Card></div>
      <Card className="border-slate-200 bg-white"><CardHeader className="border-b border-slate-100"><CardTitle className="text-lg">Candidaturas compartidas</CardTitle><p className="text-sm text-slate-500">Solo aparecen postulantes que aceptaron compartir nombre y correo con tu empresa. Su seguimiento personal permanece privado.</p></CardHeader><CardContent className="divide-y divide-slate-100 px-6">
        {loading ? <p className="py-7 text-sm text-slate-500">Cargando candidaturas…</p> : submissions.length === 0 ? <p className="py-7 text-sm text-slate-500">Aún no recibes candidaturas en tus ofertas.</p> : submissions.map(sub => <div key={sub.SubmissionId} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold text-slate-950">{sub.ApplicantName}</p><p className="text-sm text-slate-600">{sub.JobTitle}</p><p className="text-xs text-slate-500">Enviada {new Date(sub.ConsentAtUtc).toLocaleString("es-PE")}</p></div><a href={`mailto:${sub.ApplicantEmail}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-50">Contactar <ArrowUpRight className="size-4" /></a></div>)}
      </CardContent></Card>
      <p className="mt-4 text-sm text-slate-500"><Badge variant="outline">Privacidad</Badge> No se muestran perfiles ni postulaciones privadas; solo las candidaturas enviadas a tu organización.</p>
    </>}
  </div></PostulaShell>
}
