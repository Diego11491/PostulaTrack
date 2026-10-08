"use client"

import Link from "next/link"
import { useEffect, useState, type FormEvent } from "react"
import { useAuth } from "@/components/auth-provider"
import { PostulaShell } from "@/components/postula-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiClientError, apiRequest } from "@/lib/api-client"

type Offer = {
  JobOfferId: number
  JobTitle: string
  CompanyName: string
  Sector: string | null
  Location: string | null
  WorkMode: "HYBRID" | "REMOTE" | "ONSITE" | null
  RequirementsSummary: string
  SourceName: string
  SourceUrl: string
  PublishedOn: string | null
  ClosingOn: string | null
  IsActive: boolean
}

function dateValue(value: string | null) {
  return value ? value.slice(0, 10) : ""
}

function errorMessage(error: unknown) {
  return error instanceof ApiClientError
    ? error.message
    : "No se pudo conectar con el servidor."
}

export default function PublicarOfertasPage() {
  const { user, loading } = useAuth()
  const isAdmin = user?.roles.includes("ADMIN") ?? false
  const isRecruiter = !isAdmin && (user?.roles.includes("RECRUITER") ?? false)
  const canManage = isAdmin || isRecruiter
  const [organizationName, setOrganizationName] = useState("")

  const [offers, setOffers] = useState<Offer[]>([])
  const [editing, setEditing] = useState<Offer | null>(null)
  const [formVersion, setFormVersion] = useState(0)
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!canManage) return

    let cancelled = false

    apiRequest<{ offers: Offer[] }>("/job-offers/manage")
      .then((data) => {
        if (!cancelled) setOffers(data.offers)
      })
      .catch((cause) => {
        if (!cancelled) setError(errorMessage(cause))
      })
      .finally(() => {
        if (!cancelled) setFetching(false)
      })

    if (isRecruiter) apiRequest<{organization:{Name:string}}>("/recruiter/context")
      .then(data => { if (!cancelled) setOrganizationName(data.organization.Name) })
      .catch(cause => { if (!cancelled) setError(errorMessage(cause)) })

    return () => {
      cancelled = true
    }
  }, [canManage, isRecruiter])

  async function reloadOffers() {
    const data = await apiRequest<{ offers: Offer[] }>(
      "/job-offers/manage"
    )

    setOffers(data.offers)
  }

  function resetEditor() {
    setEditing(null)
    setFormVersion((value) => value + 1)
  }

  function editOffer(offer: Offer) {
    setEditing(offer)
    setFormVersion((value) => value + 1)
    setError("")
    setSuccess("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const value = (name: string) =>
      String(form.get(name) ?? "").trim()

    const body = {
      jobTitle: value("jobTitle"),
      companyName: value("companyName"),
      sector: value("sector") || null,
      location: value("location") || null,
      workMode: value("workMode") || null,
      requirementsSummary: value("requirementsSummary"),
      sourceName: value("sourceName"),
      sourceUrl: value("sourceUrl"),
      publishedOn: value("publishedOn") || null,
      closingOn: value("closingOn") || null,
    }

    if (
      body.publishedOn &&
      body.closingOn &&
      body.closingOn < body.publishedOn
    ) {
      setSuccess("")
      setError(
        "La fecha de cierre no puede ser anterior a la publicación."
      )
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      await apiRequest(
        editing ? `/job-offers/${editing.JobOfferId}` : "/job-offers",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(body),
        }
      )
    } catch (cause) {
      setError(errorMessage(cause))
      setSaving(false)
      return
    }

    resetEditor()
    setSuccess(
      editing
        ? "Oferta actualizada correctamente."
        : "Oferta publicada correctamente."
    )

    try {
      await reloadOffers()
    } catch {
      setError(
        "El cambio se guardó, pero no se pudo actualizar la lista. Recarga la página."
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleOffer(offer: Offer) {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      await apiRequest(`/job-offers/${offer.JobOfferId}/active`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !offer.IsActive }),
      })
    } catch (cause) {
      setError(errorMessage(cause))
      setSaving(false)
      return
    }

    setSuccess(
      offer.IsActive ? "Oferta desactivada." : "Oferta activada."
    )

    try {
      await reloadOffers()
    } catch {
      setError(
        "El cambio se guardó, pero no se pudo actualizar la lista. Recarga la página."
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PostulaShell>
        <p className="p-6 text-slate-500">Cargando cuenta…</p>
      </PostulaShell>
    )
  }

  if (!canManage) {
    return (
      <PostulaShell>
        <div className="p-6">
          <p className="mb-4 text-slate-600">
            Esta sección está disponible para administradores y reclutadores autorizados.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </PostulaShell>
    )
  }

  return (
    <PostulaShell>
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-7">
        <Link
          href={isAdmin ? "/admin" : "/reclutamiento"}
          className="text-sm text-cyan-700 hover:underline"
        >
          ← Volver a {isAdmin ? "administración" : "reclutamiento"}
        </Link>

        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          Gestionar ofertas laborales
        </h1>

        <p className="mb-6 mt-2 text-sm leading-6 text-slate-600">
          {isRecruiter ? `Publica ofertas de ${organizationName || "tu organización"} y revisa sus candidaturas en Reclutamiento.` : "Publica ofertas reales con su enlace original para que los usuarios puedan consultarlas."}
        </p>

        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            {success}
          </p>
        )}

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>
              {editing ? "Editar oferta" : "Publicar nueva oferta"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form key={formVersion} onSubmit={submit}>
              <fieldset
                disabled={saving}
                className="grid gap-5 md:grid-cols-2"
              >
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Puesto *</Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    defaultValue={editing?.JobTitle ?? ""}
                    maxLength={180}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Empresa *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={isRecruiter ? organizationName : undefined}
                    defaultValue={isRecruiter ? undefined : editing?.CompanyName ?? ""}
                    readOnly={isRecruiter}
                    maxLength={180}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector">Sector</Label>
                  <Input
                    id="sector"
                    name="sector"
                    defaultValue={editing?.Sector ?? ""}
                    maxLength={120}
                    placeholder="Tecnología, banca…"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={editing?.Location ?? ""}
                    maxLength={180}
                    placeholder="Lima, Perú"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workMode">Modalidad</Label>
                  <select
                    id="workMode"
                    name="workMode"
                    defaultValue={editing?.WorkMode ?? ""}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="">Sin especificar</option>
                    <option value="ONSITE">Presencial</option>
                    <option value="HYBRID">Híbrida</option>
                    <option value="REMOTE">Remota</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceName">Fuente *</Label>
                  <Input
                    id="sourceName"
                    name="sourceName"
                    defaultValue={editing?.SourceName ?? ""}
                    maxLength={100}
                    placeholder="LinkedIn, portal de la empresa…"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="sourceUrl">Enlace original *</Label>
                  <Input
                    id="sourceUrl"
                    name="sourceUrl"
                    type="url"
                    defaultValue={editing?.SourceUrl ?? ""}
                    maxLength={1000}
                    placeholder="https://..."
                    pattern="https?://.*"
                    title="Introduce un enlace http:// o https://."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishedOn">
                    Fecha de publicación
                  </Label>
                  <Input
                    id="publishedOn"
                    name="publishedOn"
                    type="date"
                    defaultValue={dateValue(
                      editing?.PublishedOn ?? null
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closingOn">Fecha de cierre</Label>
                  <Input
                    id="closingOn"
                    name="closingOn"
                    type="date"
                    defaultValue={dateValue(
                      editing?.ClosingOn ?? null
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="requirementsSummary">
                    Resumen de requisitos *
                  </Label>
                  <Textarea
                    id="requirementsSummary"
                    name="requirementsSummary"
                    defaultValue={
                      editing?.RequirementsSummary ?? ""
                    }
                    maxLength={2000}
                    rows={5}
                    placeholder="Requisitos principales."
                    required
                  />
                </div>

                <div className="flex gap-3 md:col-span-2">
                  <Button
                    type="submit"
                    className="bg-slate-950 text-white"
                  >
                    {saving
                      ? "Guardando…"
                      : editing
                        ? "Guardar cambios"
                        : "Publicar oferta"}
                  </Button>

                  {editing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetEditor}
                    >
                      Cancelar edición
                    </Button>
                  )}
                </div>
              </fieldset>
            </form>
          </CardContent>
        </Card>

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Ofertas registradas
          </h2>

          {fetching ? (
            <p className="text-sm text-slate-500">
              Cargando ofertas…
            </p>
          ) : offers.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no hay ofertas registradas.
            </p>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <Card key={offer.JobOfferId}>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {offer.JobTitle}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {offer.CompanyName}
                          {offer.Location
                            ? ` · ${offer.Location}`
                            : ""}
                        </p>
                      </div>

                      <span className="text-sm text-slate-600">
                        {offer.IsActive ? "Activa" : "Inactiva"}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {offer.RequirementsSummary}
                    </p>

                    <p className="text-xs text-slate-500">
                      Fuente: {offer.SourceName} · Cierre:{" "}
                      {dateValue(offer.ClosingOn) || "No indicado"}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={offer.SourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver oferta original
                        </a>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        onClick={() => editOffer(offer)}
                      >
                        Editar
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        onClick={() => toggleOffer(offer)}
                      >
                        {offer.IsActive ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </PostulaShell>
  )
}
