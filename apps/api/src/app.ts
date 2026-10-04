import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import { env } from "./config/env.js"
import { enforceOrigin } from "./middleware/security.js"
import { adminRouter } from "./modules/admin/admin.routes.js"
import { applicationsRouter } from "./modules/applications/applications.routes.js"
import { authRouter } from "./modules/auth/auth.routes.js"
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js"
import { opportunitiesRouter } from "./modules/opportunities/opportunities.routes.js"
import { profileRouter } from "./modules/profile/profile.routes.js"
import { jobsRouter } from "./modules/jobs/jobs.routes.js"
import { errorHandler, notFound } from "./shared/http.js"
import { getPool } from "./database/pool.js"

export function createApp() {
  const app = express()
  app.disable("x-powered-by")
  // Solo confiar en X-Forwarded-For cuando el despliegue tenga un proxy propio.
  if (env.TRUST_PROXY) app.set("trust proxy", 1)
  app.use(helmet())
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }))
  app.use(express.json({ limit: "256kb" }))
  app.use(cookieParser())
  app.use(enforceOrigin)
  app.use("/api", rateLimit({ windowMs: 60_000, limit: 180 }))
  app.use("/api/auth", authRouter)
  app.use("/api/profile", profileRouter)
  app.use("/api/opportunities", opportunitiesRouter)
  app.use("/api/jobs", jobsRouter)
  app.use("/api/applications", applicationsRouter)
  app.use("/api/dashboard", dashboardRouter)
  app.use("/api/admin", adminRouter)
  app.get("/health", (_req, res) => res.json({ status: "ok" }))
  app.get("/ready", async (_req, res) => {
    try {
      const pool = await getPool()
      await pool.request().query("SELECT 1 AS Connected")
      res.json({ status: "ok", database: "reachable" })
    } catch {
      res.status(503).json({ status: "unavailable", database: "unreachable" })
    }
  })
  app.use(notFound)
  app.use(errorHandler)
  return app
}
