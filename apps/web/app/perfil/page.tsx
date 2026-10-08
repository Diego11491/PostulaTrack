"use client"

import { useEffect, useState } from "react"
import { Save, UserRound } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PageHeading } from "@/components/page-heading"
import { PostulaShell } from "@/components/postula-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiClientError, apiRequest } from "@/lib/api-client"
import { workspaceRole } from "@/lib/workspace-role"

const countries = ["Perú", "Chile", "Colombia", "Argentina", "México", "Ecuador", "Bolivia", "España", "Estados Unidos"]
const careers = ["Ingeniería de Sistemas", "Ingeniería de Software", "Ciencia de Datos", "Administración", "Contabilidad", "Economía", "Marketing", "Diseño", "Psicología"]
const graduationMax = new Date().getFullYear() + 10

type Profile = { FirstName: string; LastName: string; Phone: string | null; Country: string | null; City: string | null; Headline: string | null; ProfessionalSummary: string | null; Institution: string | null; Career: string | null; GraduationYear: number | null }

export default function PerfilPage() {
  const { refresh, user } = useAuth()
  const isCandidate = workspaceRole(user?.roles ?? []) === "USER"
  const [profile, setProfile] = useState<Profile | null>(null)
  const [countryChoice, setCountryChoice] = useState("")
  const [careerChoice, setCareerChoice] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiRequest<{ profile: Profile }>("/profile").then(({ profile: data }) => {
      setProfile(data)
      setCountryChoice(data.Country ? (countries.includes(data.Country) ? data.Country : "Otro") : "")
      setCareerChoice(data.Career ? (careers.includes(data.Career) ? data.Career : "Otro") : "")
    }).catch(() => setError("No se pudo cargar el perfil. Recarga la página para intentarlo otra vez."))
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError("")
    setMessage("")
    const data = new FormData(event.currentTarget)
    const value = (name: string) => String(data.get(name) || "").trim()
    const country = isCandidate ? countryChoice === "Otro" ? value("countryOther") : countryChoice : profile?.Country
    const career = isCandidate ? careerChoice === "Otro" ? value("careerOther") : careerChoice : profile?.Career
    if (isCandidate && ((countryChoice === "Otro" && !country) || (careerChoice === "Otro" && !career))) {
      setError("Completa el país o la carrera que marcaste como Otro.")
      setSaving(false)
      return
    }
    try {
      await apiRequest("/profile", { method: "PUT", body: JSON.stringify({
        firstName: value("firstName"), lastName: value("lastName"), phone: value("phone") || null,
        country: country || null, city: isCandidate ? value("city") || null : profile?.City ?? null,
        headline: isCandidate ? value("headline") || null : profile?.Headline ?? null,
        professionalSummary: isCandidate ? value("professionalSummary") || null : profile?.ProfessionalSummary ?? null,
        institution: isCandidate ? value("institution") || null : profile?.Institution ?? null,
        career: career || null, graduationYear: isCandidate ? value("graduationYear") ? Number(value("graduationYear")) : null : profile?.GraduationYear ?? null,
      }) })
      await refresh()
      setMessage("Perfil actualizado correctamente.")
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : "No se pudo actualizar el perfil.")
    } finally { setSaving(false) }
  }

  return <PostulaShell><div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-7 md:py-8">
    <PageHeading eyebrow={isCandidate ? "Perfil personal y profesional" : "Datos de la cuenta"} title="Mi cuenta" description={isCandidate ? "Mantén actualizada tu información para organizar tu búsqueda." : "Actualiza tus datos básicos. La contraseña se gestiona en Seguridad."} />
    {message && <p role="status" className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800">{message}</p>}
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!profile ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">Cargando perfil…</p> :
    <form onSubmit={submit}><Card className="border-slate-200 bg-white">
      <CardHeader className="border-b border-slate-100 pb-4"><CardTitle className="flex items-center gap-2 text-base"><UserRound className="size-4.5 text-cyan-700" />{isCandidate ? "Información personal y profesional" : "Información de la cuenta"}</CardTitle></CardHeader>
      <CardContent className="grid gap-5 px-6 md:grid-cols-2">
        <Field label="Nombres" htmlFor="firstName"><Input id="firstName" name="firstName" required minLength={2} maxLength={80} defaultValue={profile.FirstName} autoComplete="given-name" /></Field>
        <Field label="Apellidos" htmlFor="lastName"><Input id="lastName" name="lastName" required minLength={2} maxLength={120} defaultValue={profile.LastName} autoComplete="family-name" /></Field>
        <Field label="Teléfono" htmlFor="phone"><Input id="phone" name="phone" type="tel" maxLength={25} pattern="[+]?[0-9][0-9 ()-]{5,24}" title="Usa números, con código de país opcional." defaultValue={profile.Phone || ""} autoComplete="tel" /></Field>
        {isCandidate && <><Field label="País" htmlFor="country"><select id="country" name="country" value={countryChoice} onChange={event => setCountryChoice(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="">Selecciona un país (opcional)</option>{countries.map(country => <option key={country} value={country}>{country}</option>)}<option value="Otro">Otro</option>
        </select></Field>
        {countryChoice === "Otro" && <Field label="Escribe tu país" htmlFor="countryOther"><Input id="countryOther" name="countryOther" required minLength={2} maxLength={100} defaultValue={profile.Country && !countries.includes(profile.Country) ? profile.Country : ""} /></Field>}
        <Field label="Ciudad" htmlFor="city"><Input id="city" name="city" maxLength={100} defaultValue={profile.City || ""} autoComplete="address-level2" /></Field>
        <div className="md:col-span-2"><Field label="Titular profesional" htmlFor="headline"><Input id="headline" name="headline" maxLength={180} defaultValue={profile.Headline || ""} placeholder="Ej. Estudiante de Ingeniería de Sistemas" /></Field></div>
        <div className="md:col-span-2"><Field label="Resumen profesional" htmlFor="professionalSummary"><Textarea id="professionalSummary" name="professionalSummary" maxLength={1000} rows={5} defaultValue={profile.ProfessionalSummary || ""} /></Field></div>
        <Field label="Institución" htmlFor="institution"><Input id="institution" name="institution" maxLength={180} defaultValue={profile.Institution || ""} /></Field>
        <Field label="Carrera" htmlFor="career"><select id="career" name="career" value={careerChoice} onChange={event => setCareerChoice(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="">Selecciona una carrera (opcional)</option>{careers.map(career => <option key={career} value={career}>{career}</option>)}<option value="Otro">Otro</option>
        </select></Field>
        {careerChoice === "Otro" && <Field label="Escribe tu carrera" htmlFor="careerOther"><Input id="careerOther" name="careerOther" required minLength={2} maxLength={160} defaultValue={profile.Career && !careers.includes(profile.Career) ? profile.Career : ""} /></Field>}
        <Field label="Año de egreso" htmlFor="graduationYear"><Input id="graduationYear" name="graduationYear" type="number" min={1950} max={graduationMax} defaultValue={profile.GraduationYear || ""} /><p className="text-xs text-slate-500">Entre 1950 y {graduationMax}, si aplica.</p></Field></>}
        <div className="flex items-end justify-end md:col-span-2"><Button disabled={saving} className="bg-slate-950 text-white"><Save />{saving ? "Guardando…" : "Guardar cambios"}</Button></div>
      </CardContent>
    </Card></form>}
  </div></PostulaShell>
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>
}
