import { loginSchema, registerSchema } from "@postulatrack/contracts"
import { Router } from "express"
import { rateLimit } from "express-rate-limit"
import { env } from "../../config/env.js"
import { authenticate, sessionCookie } from "../../middleware/security.js"
import { AppError, asyncHandler } from "../../shared/http.js"
import { revokeSession } from "./auth.repository.js"
import { login, register } from "./auth.service.js"

export const authRouter = Router()
const strictLimit = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false })

authRouter.post("/register", strictLimit, asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) throw new AppError(400, "VALIDATION_ERROR", "Revisa los datos ingresados.", parsed.error.flatten())
  const result = await register(parsed.data)
  res.status(201).json(result)
}))

authRouter.post("/login", strictLimit, asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) throw new AppError(400, "VALIDATION_ERROR", "Revisa los datos ingresados.", parsed.error.flatten())
  const result = await login(parsed.data, req.ip ?? null, req.get("user-agent") ?? null)
  res.cookie(env.SESSION_COOKIE_NAME, result.token, sessionCookie)
  res.json({ user: result.user })
}))

authRouter.get("/me", authenticate, (req, res) => res.json({ user: req.user }))

authRouter.post("/logout", authenticate, asyncHandler(async (req, res) => {
  await revokeSession(req.sessionId)
  res.clearCookie(env.SESSION_COOKIE_NAME, { ...sessionCookie, maxAge: undefined })
  res.status(204).send()
}))
