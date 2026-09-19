import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { config } from "dotenv"
import { z } from "zod"

const localEnv = resolve(process.cwd(), ".env")
const rootEnv = resolve(process.cwd(), "../../.env")
config({ path: existsSync(localEnv) ? localEnv : rootEnv })

const booleanFromString = z.string().default("false").transform((value) => value.toLowerCase() === "true")
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  SQLSERVER_HOST: z.string().min(1),
  SQLSERVER_PORT: z.coerce.number().default(1433),
  SQLSERVER_DATABASE: z.string().default("PostulaTrack"),
  SQLSERVER_USER: z.string().min(1),
  SQLSERVER_PASSWORD: z.string().min(8),
  SQLSERVER_ENCRYPT: booleanFromString,
  SQLSERVER_TRUST_CERTIFICATE: booleanFromString,
  SESSION_COOKIE_NAME: z.string().default("pt_session"),
  SESSION_HOURS: z.coerce.number().min(1).max(168).default(8),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error("Configuración inválida", parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export const isProduction = env.NODE_ENV === "production"
