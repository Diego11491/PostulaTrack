"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BriefcaseBusiness,
  FileClock,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Users,
  UserRound,
} from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
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

const principal = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/empleos", label: "Buscar empleos", icon: Search },
  { href: "/oportunidades", label: "Oportunidades", icon: BriefcaseBusiness },
  { href: "/postulaciones", label: "Postulaciones", icon: FileClock },
]

const cuenta = [
  { href: "/perfil", label: "Mi perfil", icon: UserRound },
  { href: "/seguridad", label: "Seguridad", icon: ShieldCheck },
]

export function PostulaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const isAdmin = user?.roles.includes("ADMIN") ?? false

  useEffect(() => {
    if (!loading && !user) router.replace("/acceso")
  }, [loading, router, user])

  if (loading || !user) {
    return <main className="grid min-h-svh place-items-center bg-slate-950 text-sm font-medium text-slate-300">Comprobando sesión segura…</main>
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="gap-4 px-4 py-5">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-400 text-slate-950 shadow-[0_8px_24px_rgba(34,211,238,.22)]">
              <BriefcaseBusiness className="size-4.5" strokeWidth={2.4} />
            </span>
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block text-[0.98rem] font-bold tracking-tight text-white">PostulaTrack</span>
              <span className="block text-xs text-slate-400">Centro de seguimiento</span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[0.69rem] font-semibold uppercase tracking-[0.16em] text-slate-500">Espacio de trabajo</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {principal.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))} tooltip={item.label} className="h-10 rounded-xl text-slate-300 hover:bg-white/8 hover:text-white data-[active=true]:bg-cyan-400/12 data-[active=true]:font-semibold data-[active=true]:text-cyan-300">
                      <Link href={item.href}><item.icon /><span>{item.label}</span></Link>
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
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label} className="h-10 rounded-xl text-slate-300 hover:bg-white/8 hover:text-white data-[active=true]:bg-cyan-400/12 data-[active=true]:font-semibold data-[active=true]:text-cyan-300">
                      <Link href={item.href}><item.icon /><span>{item.label}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {isAdmin && <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname.startsWith("/admin")} tooltip="Administración" className="h-10 rounded-xl text-slate-300 hover:bg-white/8 hover:text-white data-[active=true]:bg-cyan-400/12 data-[active=true]:font-semibold data-[active=true]:text-cyan-300"><Link href="/admin"><Users /><span>Administración</span></Link></SidebarMenuButton></SidebarMenuItem>}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-12 rounded-xl border border-white/8 bg-white/[0.035] text-slate-200 hover:bg-white/8 hover:text-white">
                <Link href="/perfil">
                <Avatar className="size-7 rounded-lg"><AvatarFallback className="rounded-lg bg-cyan-400 font-bold text-slate-950">{initials}</AvatarFallback></Avatar>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{user.firstName} {user.lastName}</span><span className="block truncate text-xs text-slate-400">{isAdmin ? "Administrador" : "Usuario"}</span></span>
                <UserRound className="size-3.5" />
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
          <span className="hidden text-sm font-medium text-slate-500 sm:inline">Tu espacio de seguimiento</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden text-slate-600 sm:inline-flex"><Link href="/seguridad"><ShieldCheck />Seguridad</Link></Button>
            <Button variant="ghost" size="icon-sm" className="text-slate-500" onClick={() => void logout()}><LogOut /><span className="sr-only">Cerrar sesión</span></Button>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
