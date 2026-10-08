"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Building2, ShieldCheck, Users } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PageHeading } from "@/components/page-heading"
import { PostulaShell } from "@/components/postula-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApiClientError, apiRequest } from "@/lib/api-client"

type UserRow = { UserId:string; Email:string; FirstName:string; LastName:string; IsActive:boolean; CreatedAtUtc:string; Roles:string; OrganizationName:string|null; OrganizationId:number|null }
type Organization = { OrganizationId:number; Name:string; IsActive:boolean; Recruiters:number }

export default function AdminPage() {
  const {user} = useAuth()
  const allowed = user?.roles.includes("ADMIN") ?? false
  const [users,setUsers] = useState<UserRow[]>([])
  const [organizations,setOrganizations] = useState<Organization[]>([])
  const [newOrganization,setNewOrganization] = useState("")
  const [selectedOrganization,setSelectedOrganization] = useState("")
  const [selectedUser,setSelectedUser] = useState("")
  const [message,setMessage] = useState("")
  const [error,setError] = useState("")
  const [busy,setBusy] = useState(false)
  const [loading,setLoading] = useState(true)
  const load = useCallback(async () => {
    try {
      const [people,companies] = await Promise.all([
        apiRequest<{users:UserRow[]}>("/admin/users"),
        apiRequest<{organizations:Organization[]}>("/admin/organizations"),
      ])
      setUsers(people.users)
      setOrganizations(companies.organizations)
    } catch(cause) { setError(cause instanceof ApiClientError ? cause.message : "No se pudo cargar la administración.") }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { if(allowed) void load() },[allowed,load])

  async function createOrganization(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(""); setMessage("")
    try {
      await apiRequest("/admin/organizations",{method:"POST",body:JSON.stringify({name:newOrganization.trim()})})
      setNewOrganization("")
      await load()
      setMessage("Organización registrada. Ahora puedes asignarle un reclutador.")
    } catch(cause) { setError(cause instanceof ApiClientError ? cause.message : "No se pudo registrar la organización.") }
    finally { setBusy(false) }
  }
  async function assign(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(""); setMessage("")
    try {
      await apiRequest(`/admin/organizations/${selectedOrganization}/recruiters`,{method:"POST",body:JSON.stringify({userId:selectedUser})})
      setSelectedUser("")
      await load()
      setMessage("Reclutador asignado. La persona deberá iniciar sesión nuevamente.")
    } catch(cause) { setError(cause instanceof ApiClientError ? cause.message : "No se pudo asignar la cuenta.") }
    finally { setBusy(false) }
  }
  async function toggle(item:UserRow) {
    setBusy(true); setError(""); setMessage("")
    try {
      await apiRequest(`/admin/users/${item.UserId}/status`,{method:"PATCH",body:JSON.stringify({isActive:!item.IsActive})})
      await load()
      setMessage("Estado de la cuenta actualizado.")
    } catch(cause) { setError(cause instanceof ApiClientError ? cause.message : "No se pudo cambiar el acceso.") }
    finally { setBusy(false) }
  }
  async function revoke(item:UserRow) {
    if(!item.OrganizationId || !window.confirm(`¿Quitar acceso de RR. HH. a ${item.FirstName} ${item.LastName}? Deberá iniciar sesión nuevamente.`)) return
    setBusy(true); setError(""); setMessage("")
    try {
      await apiRequest(`/admin/organizations/${item.OrganizationId}/recruiters/${item.UserId}`,{method:"DELETE"})
      await load()
      setMessage("Acceso de RR. HH. retirado; la sesión anterior quedó invalidada.")
    } catch(cause) { setError(cause instanceof ApiClientError ? cause.message : "No se pudo retirar el acceso.") }
    finally { setBusy(false) }
  }
  const candidates=users.filter(item => item.IsActive && item.Roles.split(",").includes("USER") && !item.Roles.includes("ADMIN") && !item.Roles.includes("RECRUITER"))

  return <PostulaShell><div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-7 md:py-8">
    <PageHeading eyebrow="Gestión de acceso" title="Administración" description="Gestiona cuentas y autoriza a personas de RR. HH. para publicar ofertas de su empresa. El contenido privado de los postulantes no se comparte aquí." />
    {!allowed ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">No tienes permisos para acceder a este módulo.</p> : <>
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
      <div className="mb-5 grid gap-4 sm:grid-cols-3"><Summary icon={Users} label="Cuentas registradas" value={users.length} /><Summary icon={ShieldCheck} label="Cuentas activas" value={users.filter(item=>item.IsActive).length} /><Summary icon={Building2} label="Organizaciones" value={organizations.length} /></div>
      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white"><CardHeader><CardTitle className="text-lg">Registrar organización</CardTitle><p className="text-sm text-slate-500">Comprueba la identidad de la empresa antes de autorizar a su personal.</p></CardHeader><CardContent><form className="flex flex-col gap-3 sm:flex-row" onSubmit={createOrganization}><Label htmlFor="org-name" className="sr-only">Nombre de la organización</Label><Input id="org-name" placeholder="Nombre de la empresa" value={newOrganization} maxLength={180} minLength={2} required onChange={e=>setNewOrganization(e.target.value)} /><Button disabled={busy} className="bg-slate-950 text-white">Registrar</Button></form></CardContent></Card>
        <Card className="border-slate-200 bg-white"><CardHeader><CardTitle className="text-lg">Asignar persona de RR. HH.</CardTitle><p className="text-sm text-slate-500">La persona crea primero su cuenta USER; después de verificar su vínculo con la empresa, asígnala aquí. Deberá volver a iniciar sesión.</p></CardHeader><CardContent><form className="space-y-3" onSubmit={assign}><div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="organization">Organización</Label><select id="organization" required value={selectedOrganization} onChange={e=>setSelectedOrganization(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">Seleccionar…</option>{organizations.filter(item=>item.IsActive).map(item=><option key={item.OrganizationId} value={item.OrganizationId}>{item.Name}</option>)}</select></div><div><Label htmlFor="person">Cuenta existente</Label><select id="person" required value={selectedUser} onChange={e=>setSelectedUser(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">Seleccionar…</option>{candidates.map(item=><option key={item.UserId} value={item.UserId}>{item.FirstName} {item.LastName} · {item.Email}</option>)}</select></div></div><Button disabled={busy || !selectedOrganization || !selectedUser} className="bg-slate-950 text-white">Asignar reclutador</Button></form></CardContent></Card>
      </div>
      <Card className="border-slate-200 bg-white"><CardHeader className="border-b border-slate-100"><CardTitle className="text-lg">Cuentas y roles</CardTitle></CardHeader><CardContent className="overflow-x-auto px-0"><Table><TableHeader><TableRow><TableHead className="pl-6">Usuario</TableHead><TableHead>Rol y empresa</TableHead><TableHead>Acceso</TableHead><TableHead>Registro</TableHead><TableHead className="pr-6 text-right">Acción</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={5} className="p-6 text-slate-500">Cargando cuentas…</TableCell></TableRow> : users.map(item=><TableRow key={item.UserId}><TableCell className="pl-6"><p className="font-semibold text-slate-900">{item.FirstName} {item.LastName}</p><p className="text-sm text-slate-500">{item.Email}</p></TableCell><TableCell><p>{item.Roles.replaceAll(",",", ")}</p>{item.OrganizationName && <p className="text-xs text-slate-500">{item.OrganizationName}</p>}</TableCell><TableCell><Badge variant="outline" className={item.IsActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>{item.IsActive ? "Activa" : "Desactivada"}</Badge></TableCell><TableCell>{new Date(item.CreatedAtUtc).toLocaleDateString("es-PE")}</TableCell><TableCell className="pr-6 text-right"><div className="flex justify-end gap-2">{item.OrganizationId && <Button variant="ghost" size="sm" disabled={busy} onClick={()=>void revoke(item)}>Quitar RR. HH.</Button>}<Button variant="outline" size="sm" disabled={busy || item.UserId===user?.userId} onClick={()=>void toggle(item)}>{item.IsActive ? "Desactivar" : "Activar"}</Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </>}
  </div></PostulaShell>
}

function Summary({icon:Icon,label,value}:{icon:typeof Users;label:string;value:number}) {
  return <Card className="border-slate-200 bg-white py-5"><CardContent className="flex items-center gap-4 px-5"><span className="grid size-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><Icon className="size-5" /></span><div><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold text-slate-950">{value}</p></div></CardContent></Card>
}
