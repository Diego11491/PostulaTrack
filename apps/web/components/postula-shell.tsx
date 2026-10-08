"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BriefcaseBusiness,
  FileClock,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NotificationsPopover } from "@/components/notifications-popover"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { canOpenWorkspace, workspaceHome, workspaceRole } from "@/lib/workspace-role"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const candidateNav = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/empleos", label: "Buscar empleos", icon: Search },
  { href: "/oportunidades", label: "Oportunidades", icon: BriefcaseBusiness },
  { href: "/postulaciones", label: "Postulaciones", icon: FileClock },
]

const adminNav = [
  { href: "/admin", label: "Cuentas y empresas", icon: LayoutDashboard },
  { href: "/oportunidades/publicar", label: "Ofertas publicadas", icon: BriefcaseBusiness },
  { href: "/admin/auditoria", label: "Auditoría", icon: ClipboardList },
]

const recruiterNav = [
  { href: "/reclutamiento", label: "Candidaturas", icon: LayoutDashboard },
  { href: "/oportunidades/publicar", label: "Mis ofertas", icon: BriefcaseBusiness },
]

const cuenta = [
  { href: "/perfil", label: "Mi cuenta", icon: UserRound },
  { href: "/seguridad", label: "Seguridad", icon: ShieldCheck },
]

export function PostulaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const role = workspaceRole(user?.roles ?? [])
  const home = workspaceHome(user?.roles ?? [])
  const allowed = user ? canOpenWorkspace(pathname, user.roles) : false
  const nav = role === "ADMIN" ? adminNav : role === "RECRUITER" ? recruiterNav : candidateNav
  const [pendingRoute, setPendingRoute] = useState("")

  useEffect(() => { setPendingRoute("") }, [pathname])

  useEffect(() => {
    if (!loading && !user) router.replace("/acceso")
    else if (!loading && user && !allowed) router.replace(home)
  }, [allowed, home, loading, router, user])

  if (loading || !user || !allowed) {
    return <main className="grid min-h-svh place-items-center bg-slate-950 text-sm font-medium text-slate-300">Comprobando sesión segura…</main>
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="gap-4 px-4 py-5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
          <Link href={home} className="flex items-center gap-3 overflow-hidden">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-400 text-slate-950 shadow-[0_8px_24px_rgba(34,211,238,.22)] group-data-[collapsible=icon]:size-8">
              <BriefcaseBusiness className="size-4.5" strokeWidth={2.4} />
            </span>
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block text-[0.98rem] font-bold tracking-tight text-white">PostulaTrack</span>
              <span className="block text-xs text-slate-400">{role === "ADMIN" ? "Gestión de plataforma" : role === "RECRUITER" ? "Espacio de RR. HH." : "Centro de seguimiento"}</span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2 group-data-[collapsible=icon]:px-0">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[0.69rem] font-semibold uppercase tracking-[0.16em] text-slate-500">{role === "ADMIN" ? "Administración" : role === "RECRUITER" ? "Reclutamiento" : "Espacio de trabajo"}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {nav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pendingRoute === item.href || pathname === item.href || (item.href !== "/" && item.href !== "/admin" && pathname.startsWith(`${item.href}/`))} tooltip={item.label} className="h-10 rounded-xl text-slate-300 hover:bg-white/8 hover:text-white data-[active=true]:bg-cyan-400/12 data-[active=true]:font-semibold data-[active=true]:text-cyan-300">
                      <Link href={item.href} onClick={() => setPendingRoute(pathname === item.href ? "" : item.href)}><item.icon /><span>{item.label}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-[0.69rem] font-semibold uppercase tracking-[0.16em] text-slate-500">Cuenta</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {cuenta.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pendingRoute === item.href || pathname.startsWith(item.href)} tooltip={item.label} className="h-10 rounded-xl text-slate-300 hover:bg-white/8 hover:text-white data-[active=true]:bg-cyan-400/12 data-[active=true]:font-semibold data-[active=true]:text-cyan-300">
                      <Link href={item.href} onClick={() => setPendingRoute(pathname === item.href ? "" : item.href)}><item.icon /><span>{item.label}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" tooltip="Mi cuenta" className="h-12 rounded-xl border border-white/8 bg-white/[0.035] text-slate-200 hover:bg-white/8 hover:text-white group-data-[collapsible=icon]:justify-center">
                <Link href="/perfil">
                <Avatar className="size-7 shrink-0 rounded-lg"><AvatarFallback className="rounded-lg bg-cyan-400 font-bold text-slate-950">{initials}</AvatarFallback></Avatar>
                <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><span className="block truncate text-sm font-semibold">{user.firstName} {user.lastName}</span><span className="block truncate text-xs text-slate-400">{role === "ADMIN" ? "Administrador" : role === "RECRUITER" ? "Reclutador" : "Postulante"}</span></span>
                <UserRound className="size-3.5 group-data-[collapsible=icon]:hidden" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 bg-[#f4f7f9]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl md:px-7">
          <SidebarTrigger className="size-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100" />
          <span role="status" className="hidden text-sm font-medium text-slate-500 sm:inline">{pendingRoute ? "Abriendo sección…" : role === "ADMIN" ? "Panel administrativo" : role === "RECRUITER" ? "Espacio de reclutamiento" : "Tu espacio de seguimiento"}</span>
          <div className="ml-auto flex items-center gap-2">
            {role === "USER" && <NotificationsPopover />}
            <Button variant="ghost" size="icon-sm" className="text-slate-500" onClick={() => void logout()}><LogOut /><span className="sr-only">Cerrar sesión</span></Button>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
