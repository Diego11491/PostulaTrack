import { readFileSync } from "node:fs"
import { Pool, type PoolClient } from "pg"
import { env } from "../config/env.js"

// Una sola frontera de acceso a PostgreSQL; ni la web ni el navegador usan la credencial.
const url = new URL(env.DATABASE_URL)
const ssl = env.DATABASE_SSL
  ? { rejectUnauthorized: true, ...(env.DATABASE_CA_CERT_FILE ? { ca: readFileSync(env.DATABASE_CA_CERT_FILE, "utf8") } : {}) }
  : false
const pool = new Pool({
  host: url.hostname,
  port: Number(url.port || 5432),
  database: decodeURIComponent(url.pathname.slice(1)),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  ssl,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 8_000,
})

// El contrato HTTP existente emplea PascalCase; PostgreSQL almacena identificadores en minúsculas.
const apiFields = `UserId Email PasswordHash IsActive FailedLoginCount LockedUntilUtc FirstName LastName RoleName
SessionId Phone Country City Headline ProfessionalSummary Institution Career GraduationYear UpdatedAtUtc
CompanyId CompanyName OpportunityId JobTitle SourceName SourceUrl WorkMode Location PublishedOn
ClosingOn Notes CreatedAtUtc ApplicationId AppliedOn NextAction NextActionAtUtc StatusCode StatusName
SortOrder HistoryId PreviousStatus NewStatus Comment ChangedAtUtc Sector ActivityId Title ActivityType
DueAtUtc CompletedAtUtc JobOfferId RequirementsSummary CreatedByUserId AuditId ActionCode EntityType
EntityId ResultCode IpAddress Roles ActiveProcesses Interviews PendingActions AdvancedProcesses
OrganizationId OrganizationName SubmissionId ApplicantName ApplicantEmail ConsentAtUtc WithdrawnAtUtc HasApplied`.trim().split(/\s+/)
const names = new Map(apiFields.map(name => [name.toLowerCase(), name]))
export function toApiRow(row: Record<string, unknown>): Record<string, any> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [names.get(key.toLowerCase()) ?? key, value]))
}
export type DbClient = Pool | PoolClient
export async function query(text: string, params: unknown[] = [], client: DbClient = pool) {
  const result = await client.query(text, params)
  return result.rows.map(toApiRow)
}
export async function transaction<T>(work: (client: PoolClient) => Promise<T>, isolation?: "SERIALIZABLE") {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    if (isolation) await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`)
    const result = await work(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}
export function getPool() { return pool }
export async function closePool() { await pool.end() }
