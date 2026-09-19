import type { RegisterInput, Role } from "@postulatrack/contracts"
import { getPool, sql } from "../../database/pool.js"
import { AppError } from "../../shared/http.js"

export type AuthRecord = {
  userId: string
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  isActive: boolean
  failedLoginCount: number
  lockedUntilUtc: Date | null
  roles: Role[]
}

export async function findByEmail(email: string): Promise<AuthRecord | null> {
  const pool = await getPool()
  const result = await pool.request().input("Email", sql.NVarChar(254), email).query(`
    SELECT u.UserId, u.Email, u.PasswordHash, u.IsActive, u.FailedLoginCount, u.LockedUntilUtc,
           p.FirstName, p.LastName, r.Name AS RoleName
    FROM sec.Users u
    JOIN app.Profiles p ON p.UserId = u.UserId
    JOIN sec.UserRoles ur ON ur.UserId = u.UserId
    JOIN sec.Roles r ON r.RoleId = ur.RoleId
    WHERE u.NormalizedEmail = UPPER(LTRIM(RTRIM(@Email)));
  `)
  if (!result.recordset.length) return null
  const first = result.recordset[0]
  return {
    userId: String(first.UserId), email: first.Email, passwordHash: first.PasswordHash,
    firstName: first.FirstName, lastName: first.LastName, isActive: first.IsActive,
    failedLoginCount: first.FailedLoginCount, lockedUntilUtc: first.LockedUntilUtc,
    roles: result.recordset.map((row) => row.RoleName),
  }
}

export async function createUser(input: RegisterInput, passwordHash: string) {
  const pool = await getPool()
  const transaction = new sql.Transaction(pool)
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE)
  try {
    const existing = await new sql.Request(transaction).input("Email", sql.NVarChar(254), input.email)
      .query("SELECT 1 AS ExistsFlag FROM sec.Users WITH (UPDLOCK, HOLDLOCK) WHERE NormalizedEmail = UPPER(LTRIM(RTRIM(@Email)));" )
    if (existing.recordset.length) throw new AppError(409, "EMAIL_EXISTS", "Ya existe una cuenta con ese correo.")

    const inserted = await new sql.Request(transaction)
      .input("Email", sql.NVarChar(254), input.email)
      .input("PasswordHash", sql.NVarChar(255), passwordHash)
      .query("INSERT INTO sec.Users(Email, PasswordHash) OUTPUT inserted.UserId VALUES(@Email, @PasswordHash);")
    const userId = inserted.recordset[0].UserId

    await new sql.Request(transaction)
      .input("UserId", sql.UniqueIdentifier, userId)
      .input("FirstName", sql.NVarChar(80), input.firstName)
      .input("LastName", sql.NVarChar(120), input.lastName)
      .query("INSERT INTO app.Profiles(UserId, FirstName, LastName) VALUES(@UserId, @FirstName, @LastName);")

    await new sql.Request(transaction).input("UserId", sql.UniqueIdentifier, userId).query(`
      INSERT INTO sec.UserRoles(UserId, RoleId)
      SELECT @UserId, RoleId FROM sec.Roles WHERE Name = 'USER';
    `)
    await transaction.commit()
    return String(userId)
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export async function registerFailure(userId: string) {
  const pool = await getPool()
  await pool.request().input("UserId", sql.UniqueIdentifier, userId).query(`
    UPDATE sec.Users
    SET FailedLoginCount = FailedLoginCount + 1,
        LockedUntilUtc = CASE WHEN FailedLoginCount + 1 >= 5 THEN DATEADD(MINUTE, 15, SYSUTCDATETIME()) ELSE LockedUntilUtc END,
        UpdatedAtUtc = SYSUTCDATETIME()
    WHERE UserId = @UserId;
  `)
}

export async function resetFailures(userId: string) {
  const pool = await getPool()
  await pool.request().input("UserId", sql.UniqueIdentifier, userId)
    .query("UPDATE sec.Users SET FailedLoginCount = 0, LockedUntilUtc = NULL, UpdatedAtUtc = SYSUTCDATETIME() WHERE UserId = @UserId;")
}

export async function createSession(userId: string, hash: Buffer, expiresAt: Date, ip: string | null, userAgent: string | null) {
  const pool = await getPool()
  await pool.request()
    .input("UserId", sql.UniqueIdentifier, userId)
    .input("TokenHash", sql.VarBinary(32), hash)
    .input("ExpiresAt", sql.DateTime2(0), expiresAt)
    .input("IpAddress", sql.VarChar(45), ip)
    .input("UserAgent", sql.NVarChar(300), userAgent)
    .query(`INSERT INTO sec.Sessions(UserId, SessionTokenHash, ExpiresAtUtc, IpAddress, UserAgent)
            VALUES(@UserId, @TokenHash, @ExpiresAt, @IpAddress, @UserAgent);`)
}

export async function revokeSession(sessionId: number | undefined) {
  if (!sessionId) return
  const pool = await getPool()
  await pool.request().input("SessionId", sql.BigInt, sessionId)
    .query("UPDATE sec.Sessions SET RevokedAtUtc = SYSUTCDATETIME() WHERE SessionId = @SessionId AND RevokedAtUtc IS NULL;")
}
