import { z } from "zod"
import { AppError } from "../../shared/http.js"

export const jobSearchSchema = z.object({
  keywords: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(80).default("Lima"),
  page: z.coerce.number().int().min(1).max(5).default(1),
}).strict()
export type JobSearch = z.infer<typeof jobSearchSchema>

const providerSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  jobs: z.array(z.object({
    id: z.union([z.string(), z.number()]),
    title: z.string(),
    company: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    snippet: z.string().optional().nullable(),
    link: z.string(),
    updated: z.string().optional().nullable(),
  }).passthrough()).max(50),
})

export type JobResult = {
  id: string
  title: string
  company: string
  location: string
  snippet: string
  link: string
  updated: string | null
  source: "Jooble"
}

function shortText(value: string | null | undefined, max: number): string {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
}

export function createJobSearch(options: {
  apiKey: string | undefined
  fetcher?: typeof fetch
  now?: () => number
}) {
  const fetcher = options.fetcher ?? fetch
  const now = options.now ?? Date.now
  const cache = new Map<string, { until: number; value: { totalCount: number; jobs: JobResult[] } }>()
  const inFlight = new Map<string, Promise<{ totalCount: number; jobs: JobResult[] }>>()

  return async (params: JobSearch) => {
    const apiKey = options.apiKey?.trim()
    if (!apiKey) throw new AppError(503, "JOBS_NOT_CONFIGURED", "La búsqueda externa aún no está configurada.")
    const key = JSON.stringify([params.keywords.toLowerCase(), params.location.toLowerCase(), params.page])
    const cached = cache.get(key)
    if (cached && cached.until > now()) return cached.value
    const pending = inFlight.get(key)
    if (pending) return pending

    const task = (async () => {
      try {
        // El host es fijo: ni el navegador ni la oferta pueden escoger el destino HTTP.
        const response = await fetcher(`https://pe.jooble.org/api/${encodeURIComponent(apiKey)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: params.keywords, location: params.location, page: params.page, ResultOnPage: 10 }),
          signal: AbortSignal.timeout(6000),
        })
        if (!response.ok) throw new Error("provider unavailable")
        const raw = await response.text()
        if (raw.length > 1_000_000) throw new Error("provider response too large")
        const parsed = providerSchema.parse(JSON.parse(raw))
        const jobs = parsed.jobs.flatMap((job): JobResult[] => {
          let link: URL
          try { link = new URL(job.link) } catch { return [] }
          if (link.protocol !== "https:") return []
          return [{
            id: String(job.id), title: shortText(job.title, 180),
            company: shortText(job.company, 180) || "Empresa no indicada",
            location: shortText(job.location, 180), snippet: shortText(job.snippet, 280),
            link: link.toString(), updated: job.updated ?? null, source: "Jooble",
          }]
        }).filter(job => job.title.length > 0)
        const value = { totalCount: parsed.totalCount, jobs }
        cache.set(key, { until: now() + 10 * 60_000, value })
        return value
      } catch {
        // Nunca devolver ni registrar el error del proveedor: la clave está en la URL.
        throw new AppError(502, "JOBS_PROVIDER_UNAVAILABLE", "La búsqueda externa no está disponible. Inténtalo después.")
      }
    })()
    inFlight.set(key, task)
    task.then(() => inFlight.delete(key), () => inFlight.delete(key))
    return task
  }
}
