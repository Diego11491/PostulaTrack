"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PostulaShell } from "@/components/postula-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ApiClientError, apiRequest } from "@/lib/api-client"
import {
  modeLabel,
  type OpportunityRow,
} from "@/lib/domain-types"

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
}

function dateInput(value: string | null) {
  return value ? value.slice(0, 10) : null
}

function displayDate(value: string | null) {
  if (!value) return "No indicada"

  const [year, month, day] = value.slice(0, 10).split("-")
  return `${day}/${month}/${year}`
}

export default function OportunidadesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isAdmin = user?.roles.includes("ADMIN") ?? false

  const [items, setItems] = useState<OpportunityRow[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [section, setSection] = useState<"catalog" | "personal">(
    "catalog"
  )
  const [search, setSearch] = useState("")
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [personalLoading, setPersonalLoading] = useState(true)
  const [catalogError, setCatalogError] = useState("")
  const [personalError, setPersonalError] = useState("")
  const [actionError, setActionError] = useState("")
  const [registering, setRegistering] = useState<number | null>(
    null
  )

  useEffect(() => {
    if (!user) return

    let cancelled = false

    apiRequest<{ offers: Offer[] }>("/job-offers")
      .then((data) => {
        if (!cancelled) setOffers(data.offers)
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogError("No se pudieron cargar las ofertas.")
        }
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false)
      })

    apiRequest<{ opportunities: OpportunityRow[] }>(
      "/opportunities"
    )
      .then((data) => {
        if (!cancelled) setItems(data.opportunities)
      })
      .catch(() => {
        if (!cancelled) {
          setPersonalError(
            "No se pudieron cargar tus oportunidades."
          )
        }
      })
      .finally(() => {
        if (!cancelled) setPersonalLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const filteredOffers = useMemo(() => {
    const term = search.trim().toLowerCase()

    return offers.filter((offer) =>
      [
        offer.JobTitle,
        offer.CompanyName,
        offer.Location,
        offer.RequirementsSummary,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    )
  }, [offers, search])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()

    return items.filter((item) =>
      `${item.JobTitle} ${item.CompanyName}`
        .toLowerCase()
        .includes(term)
    )
  }, [items, search])

  async function registerApplication(offer: Offer) {
    if (registering !== null) return

    const confirmed = window.confirm(
      `¿Ya enviaste tu solicitud para "${offer.JobTitle}" en ${offer.CompanyName}?\n\nConfirma para registrar tu postulación y comenzar el seguimiento.`
    )

    if (!confirmed) return

    setRegistering(offer.JobOfferId)
    setActionError("")

    try {
      const result = await apiRequest<{
        opportunityId: number
        applicationId: number | null
      }>("/opportunities", {
        method: "POST",
        body: JSON.stringify({
          companyName: offer.CompanyName,
          sector: offer.Sector,
          jobTitle: offer.JobTitle,
          sourceName: offer.SourceName,
          sourceUrl: offer.SourceUrl,
          workMode: offer.WorkMode,
          location: offer.Location,
          publishedOn: dateInput(offer.PublishedOn),
          closingOn: dateInput(offer.ClosingOn),
          notes: offer.RequirementsSummary,
          createApplication: true,
        }),
      })

      if (result.applicationId) {
        router.push(`/postulaciones/${result.applicationId}`)
      } else {
        // La oportunidad se guardó; evita repetir el registro.
        router.push("/postulaciones")
      }
    } catch (cause) {
      setActionError(
        cause instanceof ApiClientError
          ? cause.message
          : "No se pudo registrar la postulación."
      )
      setRegistering(null)
    }
  }

  return (
    <PostulaShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-7 md:py-8">
        <section className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="mb-1 text-sm font-medium text-cyan-700">
              Tu búsqueda laboral
            </p>

            <h1 className="text-2xl font-bold text-slate-950">
              Oportunidades laborales
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Explora ofertas disponibles y lleva el seguimiento
              de las oportunidades que registras en tu cuenta.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button asChild variant="outline">
                <Link href="/oportunidades/publicar">
                  Gestionar ofertas
                </Link>
              </Button>
            )}

            <Button asChild className="bg-slate-950 text-white">
              <Link href="/oportunidades/nueva">
                <Plus className="size-4" />
                Registrar oportunidad
              </Link>
            </Button>
          </div>
        </section>

        <div className="mb-5 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={section === "catalog" ? "default" : "outline"}
            aria-pressed={section === "catalog"}
            onClick={() => setSection("catalog")}
          >
            Ofertas disponibles
          </Button>

          <Button
            type="button"
            variant={section === "personal" ? "default" : "outline"}
            aria-pressed={section === "personal"}
            onClick={() => setSection("personal")}
          >
            Mis oportunidades
          </Button>
        </div>

        <div className="relative mb-5 max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              section === "catalog"
                ? "Buscar por puesto, empresa, ubicación o requisitos"
                : "Buscar por puesto o empresa"
            }
            aria-label="Buscar oportunidades"
            className="h-11 bg-white pl-9"
          />
        </div>

        {actionError && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {actionError}
          </p>
        )}

        {section === "catalog" ? (
          <>
            <p className="mb-5 text-sm leading-6 text-slate-500">
              Consulta la publicación original para postular.
              Después de enviar tu solicitud, registra tu
              postulación aquí para llevar su seguimiento.
            </p>

            {catalogError && (
              <p role="alert" className="mb-4 text-sm text-red-700">
                {catalogError}
              </p>
            )}

            {catalogLoading ? (
              <p className="py-6 text-sm text-slate-500">
                Cargando ofertas…
              </p>
            ) : !catalogError && filteredOffers.length === 0 ? (
              <p className="py-6 text-sm text-slate-500">
                No hay ofertas disponibles para esta búsqueda.
              </p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredOffers.map((offer) => (
                  <Card
                    key={offer.JobOfferId}
                    className="border-slate-200 bg-white"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {offer.JobTitle}
                      </CardTitle>

                      <p className="text-sm text-slate-500">
                        {offer.CompanyName}
                        {offer.Location
                          ? ` · ${offer.Location}`
                          : ""}
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <Badge variant="outline">
                        {offer.WorkMode
                          ? modeLabel(offer.WorkMode)
                          : "Modalidad no indicada"}
                      </Badge>

                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {offer.RequirementsSummary}
                      </p>

                      <div className="space-y-1 text-xs text-slate-500">
                        <p>Fuente: {offer.SourceName}</p>
                        <p>
                          Publicación:{" "}
                          {displayDate(offer.PublishedOn)}
                        </p>
                        <p>
                          Fecha de cierre:{" "}
                          {displayDate(offer.ClosingOn)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
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
                          disabled={registering !== null}
                          onClick={() =>
                            registerApplication(offer)
                          }
                          className="bg-slate-950 text-white"
                        >
                          {registering === offer.JobOfferId
                            ? "Registrando…"
                            : "Registrar mi postulación"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {personalError && (
              <p role="alert" className="mb-4 text-sm text-red-700">
                {personalError}
              </p>
            )}

            {personalLoading ? (
              <p className="py-6 text-sm text-slate-500">
                Cargando tus oportunidades…
              </p>
            ) : !personalError && filteredItems.length === 0 ? (
              <p className="py-6 text-sm text-slate-500">
                No tienes oportunidades para esta búsqueda.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <Card
                    key={item.OpportunityId}
                    className="border-slate-200 bg-white"
                  >
                    <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <h2 className="font-semibold text-slate-900">
                          {item.JobTitle}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.CompanyName} ·{" "}
                          {item.Location || "Sin ubicación"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.SourceName || "Manual"} ·{" "}
                          {modeLabel(item.WorkMode)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {item.ApplicationStatus || "Guardada"}
                        </Badge>

                        {item.ApplicationId && (
                          <Button asChild variant="outline">
                            <Link
                              href={`/postulaciones/${item.ApplicationId}`}
                            >
                              Ver seguimiento
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PostulaShell>
  )
}