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
  API_PORT: z.coerce.number().default(Number(process.env.PORT || 4000)),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  TRUST_PROXY: booleanFromString,
  DATABASE_URL: z.string().url().refine(value => value.startsWith("postgres://") || value.startsWith("postgresql://"), "Se requiere PostgreSQL"),
  DATABASE_SSL: z.string().default("true").transform(value => value.toLowerCase() === "true"),
  DATABASE_CA_CERT_FILE: z.string().trim().min(1).optional(),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(5),
  SESSION_COOKIE_NAME: z.string().default("pt_session"),
  SESSION_HOURS: z.coerce.number().min(1).max(168).default(8),
  JOOBLE_PE_API_KEY: z.string().optional(),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error("Configuración inválida", parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export const isProduction = env.NODE_ENV === "production"
