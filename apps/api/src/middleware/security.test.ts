import assert from "node:assert/strict"
import { test } from "node:test"
import type { NextFunction, Request, Response } from "express"

process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test"
process.env.WEB_ORIGIN = "http://localhost:3000"
const { csrfToken, enforceCsrf, enforceOrigin, requireCandidate, requireRole } = await import("./security.js")

function check(middleware: (req: Request, res: Response, next: NextFunction) => void,
  input: { method?: string; path?: string; origin?: string; session?: string; csrfCookie?: string;
    csrfHeader?: string; roles?: string[] }) {
  let result: unknown = "not-called"
  const req = {
    method: input.method ?? "POST",
    path: input.path ?? "/api/profile",
    cookies: { pt_session: input.session, pt_csrf: input.csrfCookie },
    user: input.roles ? { roles: input.roles } : undefined,
    get: (name: string) => name.toLowerCase() === "origin" ? input.origin :
      name.toLowerCase() === "x-csrf-token" ? input.csrfHeader : undefined,
  } as unknown as Request
  middleware(req, { cookie() { return this } } as unknown as Response, (error?: unknown) => { result = error ?? "allowed" })
  return result
}

test("caja blanca: Origin rechaza peticiones mutables ausentes o externas", () => {
  for (const origin of [undefined, "https://otro.example.test"])
    assert.deepEqual((check(enforceOrigin, { origin }) as { code: string }).code, "INVALID_ORIGIN")
  assert.equal(check(enforceOrigin, { origin: "http://localhost:3000" }), "allowed")
  assert.equal(check(enforceOrigin, { method: "GET" }), "allowed")
})

test("caja blanca: CSRF liga cookie y cabecera a la sesión, y permite renovar el token", () => {
  const session = "session-aleatoria-de-prueba"
  const token = csrfToken(session)
  const valid = { session, csrfCookie: token, csrfHeader: token }
  assert.equal(check(enforceCsrf, valid), "allowed")
  for (const invalid of [{ ...valid, csrfHeader: undefined }, { ...valid, csrfCookie: undefined },
    { ...valid, session: "otra-sesion" }])
    assert.equal((check(enforceCsrf, invalid) as { code: string }).code, "INVALID_CSRF")
  assert.equal(check(enforceCsrf, { method: "GET", path: "/api/auth/csrf", session }), "allowed")
  assert.equal(check(enforceCsrf, { method: "POST", path: "/api/auth/login", session }), "allowed")
})

test("caja blanca: RBAC separa postulante, reclutador y administrador", () => {
  assert.equal(check(requireCandidate, { roles: ["USER"] }), "allowed")
  for (const roles of [["USER", "RECRUITER"], ["USER", "ADMIN"], ["ADMIN"]])
    assert.equal((check(requireCandidate, { roles }) as { code: string }).code, "FORBIDDEN")
  assert.equal(check(requireRole("RECRUITER"), { roles: ["RECRUITER"] }), "allowed")
  assert.equal((check(requireRole("ADMIN"), { roles: ["USER"] }) as { code: string }).code, "FORBIDDEN")
})
