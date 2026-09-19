export type OpportunityRow = {
  OpportunityId: number
  JobTitle: string
  SourceName: string | null
  SourceUrl: string | null
  WorkMode: "REMOTE" | "HYBRID" | "ONSITE" | null
  Location: string | null
  PublishedOn: string | null
  ClosingOn: string | null
  Notes: string | null
  CreatedAtUtc: string
  CompanyName: string
  ApplicationId: number | null
  ApplicationStatusCode: string | null
  ApplicationStatus: string | null
}

export type ApplicationRow = {
  ApplicationId: number
  AppliedOn: string | null
  NextAction: string | null
  NextActionAtUtc: string | null
  UpdatedAtUtc: string
  StatusCode: string
  StatusName: string
  SortOrder: number
  OpportunityId: number
  JobTitle: string
  WorkMode: string | null
  Location: string | null
  CompanyName: string
}

export type ApplicationDetail = ApplicationRow & {
  SourceName: string | null
  SourceUrl: string | null
  Notes: string | null
  Sector: string | null
}

export type HistoryRow = {
  HistoryId: number
  PreviousStatus: string | null
  NewStatus: string
  Comment: string | null
  ChangedAtUtc: string
  FirstName: string
  LastName: string
}

export const statusColumns = [
  { codes: ["REGISTERED"], title: "Registradas", color: "bg-slate-400" },
  { codes: ["SENT", "PRESELECTED"], title: "En seguimiento", color: "bg-sky-500" },
  { codes: ["INTERVIEW", "ASSESSMENT"], title: "Entrevista y evaluación", color: "bg-cyan-500" },
  { codes: ["OFFER", "HIRED", "REJECTED", "WITHDRAWN"], title: "Resultado", color: "bg-amber-400" },
]

export const statusOptions = [
  ["REGISTERED", "Registrada"], ["SENT", "Postulación enviada"], ["PRESELECTED", "Preselección"],
  ["INTERVIEW", "Entrevista"], ["ASSESSMENT", "Evaluación"], ["OFFER", "Oferta"],
  ["HIRED", "Contratado/a"], ["REJECTED", "No seleccionado/a"], ["WITHDRAWN", "Retirada"],
] as const

export function modeLabel(mode: string | null) {
  return ({ REMOTE: "Remota", HYBRID: "Híbrida", ONSITE: "Presencial" } as Record<string, string>)[mode ?? ""] ?? "No indicada"
}
