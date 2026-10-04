import sql from "mssql"
import { env } from "../config/env.js"

let pool: Promise<sql.ConnectionPool> | undefined

export function getPool() {
  if (!pool) {
    pool = new sql.ConnectionPool({
      server: env.SQLSERVER_HOST,
      port: env.SQLSERVER_PORT,
      database: env.SQLSERVER_DATABASE,
      user: env.SQLSERVER_USER,
      password: env.SQLSERVER_PASSWORD,
      pool: { min: 0, max: 10, idleTimeoutMillis: 30000 },
      options: {
        encrypt: env.SQLSERVER_ENCRYPT,
        trustServerCertificate: env.SQLSERVER_TRUST_CERTIFICATE,
        enableArithAbort: true,
      },
    }).connect().catch(error => {
      // Un primer intento fallido no debe dejar la API atada a una promesa rechazada.
      pool = undefined
      throw error
    })
  }
  return pool
}

export async function closePool() {
  if (pool) (await pool).close()
  pool = undefined
}

export { sql }
