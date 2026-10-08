import { Router } from "express"
import { rateLimit } from "express-rate-limit"
import { env } from "../../config/env.js"
import { authenticate, requireCandidate } from "../../middleware/security.js"
import { AppError, asyncHandler } from "../../shared/http.js"
import { createJobSearch, jobSearchSchema } from "./jobs.service.js"

export const jobsRouter = Router()
const search = createJobSearch({ apiKey: env.JOOBLE_PE_API_KEY })
jobsRouter.use(authenticate, requireCandidate, rateLimit({ windowMs: 60_000, limit: 12, standardHeaders: "draft-8", legacyHeaders: false }))
jobsRouter.get("/", asyncHandler(async (req, res) => {
  const parsed = jobSearchSchema.safeParse(req.query)
  if (!parsed.success) throw new AppError(400, "INVALID_SEARCH", "Indica un puesto y ubicación válidos.")
  res.json(await search(parsed.data))
}))
