"use client"

import { useEffect, useState } from "react"
import { ShieldCheck, Users } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PageHeading } from "@/components/page-heading"
import { PostulaShell } from "@/components/postula-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiRequest } from "@/lib/api-client"

type UserRow = { UserId: string; Email: string; FirstName: string; LastName: string; IsActive: boolean; CreatedAtUtc: string; Roles: string }

export default function AdminPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [message, setMessage] = useState("")
  const allowed = user?.roles.includes("ADMIN") ?? false
  const load = () => apiRequest<{ users: UserRow[] }>("/admin/users").then(data => setUsers(data.users)).catch(() => setMessage("No se pudo cargar la administración."))
  useEffect(() => { if (allowed) void load() }, [allowed])

  async function toggle(item: UserRow) { setMessage(""); await apiRequest(`/admin/users/${item.UserId}/status`, { method: "PATCH", body: JSON.stringify({ isActive: !item.IsActive }) }); setMessage("Estado de la cuenta actualizado."); await load() }

  return <PostulaShell><div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-7 md:py-8"><PageHeading eyebrow="Rol ADMIN" title="Administración de cuentas" description="Activa o desactiva accesos sin consultar el contenido privado de las postulaciones." />{!allowed ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">No tienes permisos para acceder a este módulo.</p> : <><div className="mb-5 grid gap-4 sm:grid-cols-2"><Summary icon={Users} label="Cuentas registradas" value={String(users.length)} /><Summary icon={ShieldCheck} label="Cuentas activas" value={String(users.filter(item => item.IsActive).length)} /></div>{message && <p className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800">{message}</p>}<Card className="border-slate-200 bg-white"><CardHeader className="border-b border-slate-100 pb-4"><CardTitle className="text-base">Usuarios</CardTitle></CardHeader><CardContent className="overflow-x-auto px-0"><Table><TableHeader><TableRow><TableHead className="pl-6">Usuario</TableHead><TableHead>Rol</TableHead><TableHead>Estado</TableHead><TableHead>Registro</TableHead><TableHead className="pr-6 text-right">Acción</TableHead></TableRow></TableHeader><TableBody>{users.map(item => <TableRow key={item.UserId}><TableCell className="pl-6"><p className="font-semibold text-slate-900">{item.FirstName} {item.LastName}</p><p className="text-sm text-slate-500">{item.Email}</p></TableCell><TableCell>{item.Roles}</TableCell><TableCell><Badge variant="outline" className={item.IsActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>{item.IsActive ? "Activa" : "Desactivada"}</Badge></TableCell><TableCell>{new Date(item.CreatedAtUtc).toLocaleDateString("es-PE")}</TableCell><TableCell className="pr-6 text-right"><Button variant="outline" size="sm" disabled={item.UserId === user?.userId} onClick={() => void toggle(item)}>{item.IsActive ? "Desactivar" : "Activar"}</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></>}</div></PostulaShell>
}

function Summary({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) { return <Card className="border-slate-200 bg-white py-5"><CardContent className="flex items-center gap-4 px-5"><span className="grid size-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><Icon className="size-5" /></span><div><p className="text-xs text-slate-400">{label}</p><p className="text-xl font-bold text-slate-950">{value}</p></div></CardContent></Card> }
