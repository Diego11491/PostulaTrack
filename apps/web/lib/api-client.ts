const API_URL = "/api"
const csrfCookieName = "pt_csrf"

function readCsrfCookie() {
  return document.cookie.split("; ").find(part => part.startsWith(`${csrfCookieName}=`))?.slice(csrfCookieName.length + 1)
}

async function csrfFor(path: string, method: string) {
  if (["GET", "HEAD", "OPTIONS"].includes(method) || ["/auth/login", "/auth/register"].includes(path)) return null
  let token = readCsrfCookie()
  if (!token) {
    const response = await fetch(`${API_URL}/auth/csrf`, { credentials: "include" })
    if (!response.ok) throw new ApiClientError(response.status, "INVALID_SESSION", "Inicia sesión nuevamente.")
    token = readCsrfCookie()
  }
  if (!token) throw new ApiClientError(403, "INVALID_CSRF", "Actualiza la página e inténtalo nuevamente.")
  return token
}

export class ApiClientError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message)
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const csrf = await csrfFor(path, (init.method ?? "GET").toUpperCase())
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers, ...(csrf ? { "X-CSRF-Token": csrf } : {}) },
  })
  if (response.status === 204) return undefined as T
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiClientError(response.status, body?.error?.code ?? "REQUEST_FAILED", body?.error?.message ?? "No se pudo completar la solicitud.", body?.error?.details)
  }
  return body as T
}
