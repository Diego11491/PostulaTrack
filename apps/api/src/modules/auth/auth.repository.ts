import type { RegisterInput, Role } from "@postulatrack/contracts"
import { query, transaction } from "../../database/pool.js"
import { AppError } from "../../shared/http.js"

export type AuthRecord = {
  userId: string; email: string; passwordHash: string; firstName: string; lastName: string
  isActive: boolean; failedLoginCount: number; lockedUntilUtc: Date | null; roles: Role[]
}
export async function findByEmail(email: string): Promise<AuthRecord | null> {
  const rows = await query(`SELECT u.userid, u.email, u.passwordhash, u.isactive, u.failedlogincount,
    u.lockeduntilutc, p.firstname, p.lastname, r.name AS "RoleName"
    FROM sec.users u JOIN app.profiles p USING(userid)
    JOIN sec.userroles ur USING(userid) JOIN sec.roles r USING(roleid)
    WHERE lower(btrim(u.email))=lower(btrim($1))`, [email])
  if (!rows.length) return null
  const first = rows[0]
  return { userId: first.UserId, email: first.Email, passwordHash: first.PasswordHash,
    firstName: first.FirstName, lastName: first.LastName, isActive: first.IsActive,
    failedLoginCount: first.FailedLoginCount, lockedUntilUtc: first.LockedUntilUtc,
    roles: rows.map(row => row.RoleName as Role) }
}
export async function createUser(input: RegisterInput, passwordHash: string) {
  try {
    return await transaction(async client => {
      const inserted = await query(`INSERT INTO sec.users(email,passwordhash) VALUES($1,$2)
        RETURNING userid`, [input.email,passwordHash], client)
      const userId = inserted[0].UserId as string
      await query(`INSERT INTO app.profiles(userid,firstname,lastname) VALUES($1,$2,$3)`,
        [userId,input.firstName,input.lastName], client)
      await query(`INSERT INTO sec.userroles(userid,roleid)
        SELECT $1,roleid FROM sec.roles WHERE name='USER'`, [userId], client)
      return userId
    })
  } catch (error: any) {
    if (error?.code === "23505" && error?.constraint === "ux_users_normalizedemail")
      throw new AppError(409,"EMAIL_EXISTS","Ya existe una cuenta con ese correo.")
    throw error
  }
}
export async function registerFailure(userId: string) {
  await query(`UPDATE sec.users SET failedlogincount=failedlogincount+1,
    lockeduntilutc=CASE WHEN failedlogincount+1>=5 THEN now()+interval '15 minutes' ELSE lockeduntilutc END,
    updatedatutc=now() WHERE userid=$1`, [userId])
}
export async function resetFailures(userId: string) {
  await query(`UPDATE sec.users SET failedlogincount=0, lockeduntilutc=NULL, updatedatutc=now() WHERE userid=$1`, [userId])
}
export async function createSession(userId: string, hash: Buffer, expiresAt: Date, ip: string|null, userAgent: string|null) {
  await query(`INSERT INTO sec.sessions(userid,sessiontokenhash,expiresatutc,ipaddress,useragent)
    VALUES($1,$2,$3,$4,$5)`, [userId,hash,expiresAt,ip,userAgent?.slice(0,300) ?? null])
}
export async function revokeSession(sessionId: number | undefined) {
  if (sessionId) await query(`UPDATE sec.sessions SET revokedatutc=now()
    WHERE sessionid=$1 AND revokedatutc IS NULL`, [sessionId])
}
