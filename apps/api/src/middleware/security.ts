import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import type { NextFunction, Request, Response } from "express"
import { env, isProduction } from "../config/env.js"
import { query } from "../database/pool.js"
import { AppError, asyncHandler } from "../shared/http.js"

export const sessionCookie = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: env.SESSION_HOURS * 3_600_000,
  path: "/",
}
export const cookieOptions = sessionCookie
export const tokenHash = (token: string) => createHash("sha256").update(token).digest()
export const csrfToken = (sessionToken: string) =>
  createHmac("sha256", sessionToken).update("postulatrack:csrf:v1").digest("hex")
export const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: sessionCookie.maxAge,
  path: "/",
}

export function enforceOrigin(req: Request, _res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next()
  if (req.get("origin") !== env.WEB_ORIGIN) return next(new AppError(403, "INVALID_ORIGIN", "Origen no autorizado."))
  next()
}

// El token visible al navegador está ligado a la cookie de sesión HttpOnly.
// Login y registro no usan una sesión existente y siguen protegidos por enforceOrigin.
export function enforceCsrf(req: Request, res: Response, next: NextFunction) {
  const sessionToken = req.cookies?.[env.SESSION_COOKIE_NAME]
  if (req.method === "GET" && req.path === "/api/auth/csrf" && sessionToken) {
    res.cookie("pt_csrf", csrfToken(sessionToken), csrfCookieOptions)
  }
  if (["GET", "HEAD", "OPTIONS"].includes(req.method) ||
      (req.method === "POST" && ["/api/auth/login", "/api/auth/register"].includes(req.path))) return next()
  if (!sessionToken) return next() // Las rutas privadas responderán 401.

  const expected = csrfToken(sessionToken)
  const csrfCookie = req.cookies?.pt_csrf
  const csrfHeader = req.get("x-csrf-token")
  const matches = (value: unknown) => typeof value === "string" && value.length === expected.length &&
    timingSafeEqual(Buffer.from(value), Buffer.from(expected))
  if (!matches(csrfCookie) || !matches(csrfHeader))
    return next(new AppError(403, "INVALID_CSRF", "Actualiza la página e inténtalo nuevamente."))
  next()
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME]
  if (!token) throw new AppError(401, "UNAUTHENTICATED", "Debes iniciar sesión.")
  const rows = await query(`SELECT s.sessionid, u.userid, u.email, p.firstname, p.lastname, r.name AS "RoleName"
    FROM sec.sessions s JOIN sec.users u USING(userid) JOIN app.profiles p USING(userid)
    JOIN sec.userroles ur USING(userid) JOIN sec.roles r USING(roleid)
    WHERE s.sessiontokenhash=$1 AND s.revokedatutc IS NULL
      AND s.expiresatutc>now() AND u.isactive=true`, [tokenHash(token)])
  if (!rows.length) throw new AppError(401, "INVALID_SESSION", "La sesión venció.")
  const first = rows[0]
  req.sessionId = first.SessionId
  req.user = { userId: String(first.UserId), email: first.Email, firstName: first.FirstName, lastName: first.LastName, roles: rows.map(row => row.RoleName) }
  next()
})

export const requireRole = (role: "USER" | "ADMIN" | "RECRUITER") => (req: Request, _res: Response, next: NextFunction) =>
  req.user?.roles.includes(role) ? next() : next(new AppError(403, "FORBIDDEN", "No tienes permisos."))

// Una cuenta de RR. HH. conserva USER en la base para poder recuperar su rol
// anterior, pero mientras sea RECRUITER no actúa como postulante.
export const requireCandidate = (req: Request, _res: Response, next: NextFunction) =>
  req.user?.roles.includes("USER") && !req.user.roles.some(role => role === "ADMIN" || role === "RECRUITER")
    ? next() : next(new AppError(403, "FORBIDDEN", "Esta sección corresponde a postulantes."))
