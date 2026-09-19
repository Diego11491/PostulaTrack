import { createHash } from "node:crypto"
import type { NextFunction, Request, Response } from "express"
import { env, isProduction } from "../config/env.js"
import { getPool, sql } from "../database/pool.js"
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

export function enforceOrigin(req: Request, _res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next()
  if (req.get("origin") !== env.WEB_ORIGIN) return next(new AppError(403, "INVALID_ORIGIN", "Origen no autorizado."))
  next()
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME]
  if (!token) throw new AppError(401, "UNAUTHENTICATED", "Debes iniciar sesión.")
  const result = await (await getPool()).request().input("TokenHash", sql.VarBinary(32), tokenHash(token)).query(`
    SELECT s.SessionId, u.UserId, u.Email, p.FirstName, p.LastName, r.Name AS RoleName
    FROM sec.Sessions s
    JOIN sec.Users u ON u.UserId=s.UserId
    JOIN app.Profiles p ON p.UserId=u.UserId
    JOIN sec.UserRoles ur ON ur.UserId=u.UserId
    JOIN sec.Roles r ON r.RoleId=ur.RoleId
    WHERE s.SessionTokenHash=@TokenHash AND s.RevokedAtUtc IS NULL
      AND s.ExpiresAtUtc>SYSUTCDATETIME() AND u.IsActive=1;
  `)
  if (!result.recordset.length) throw new AppError(401, "INVALID_SESSION", "La sesión venció.")
  const first = result.recordset[0]
  req.sessionId = first.SessionId
  req.user = { userId: String(first.UserId), email: first.Email, firstName: first.FirstName, lastName: first.LastName, roles: result.recordset.map(row => row.RoleName) }
  next()
})

export const requireRole = (role: "USER" | "ADMIN") => (req: Request, _res: Response, next: NextFunction) =>
  req.user?.roles.includes(role) ? next() : next(new AppError(403, "FORBIDDEN", "No tienes permisos."))
