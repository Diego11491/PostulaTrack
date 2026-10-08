import type { AuthUser } from "@postulatrack/contracts"

type Roles = AuthUser["roles"]
export type WorkspaceRole = "USER" | "ADMIN" | "RECRUITER"

export function workspaceRole(roles: Roles): WorkspaceRole {
  if (roles.includes("ADMIN")) return "ADMIN"
  if (roles.includes("RECRUITER")) return "RECRUITER"
  return "USER"
}

export function workspaceHome(roles: Roles) {
  const role = workspaceRole(roles)
  return role === "ADMIN" ? "/admin" : role === "RECRUITER" ? "/reclutamiento" : "/"
}

export function canOpenWorkspace(pathname: string, roles: Roles) {
  if (pathname === "/perfil" || pathname === "/seguridad") return true
  const role = workspaceRole(roles)
  if (role === "ADMIN") return pathname === "/admin" || pathname === "/admin/auditoria" || pathname === "/oportunidades/publicar"
  if (role === "RECRUITER") return pathname === "/reclutamiento" || pathname === "/oportunidades/publicar"
  if (pathname === "/oportunidades/publicar" || pathname.startsWith("/oportunidades/publicar/")) return false
  return pathname === "/" || ["/empleos", "/oportunidades", "/postulaciones", "/agenda", "/empresas"]
    .some(path => pathname === path || pathname.startsWith(`${path}/`))
}
