import { randomBytes } from "node:crypto"
import type { LoginInput, RegisterInput } from "@postulatrack/contracts"
import bcrypt from "bcryptjs"
import { env } from "../../config/env.js"
import { tokenHash } from "../../middleware/security.js"
import { AppError } from "../../shared/http.js"
import { createSession, createUser, findByEmail, registerFailure, resetFailures } from "./auth.repository.js"

export async function register(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, 12)
  const userId = await createUser(input, passwordHash)
  return { userId }
}

export async function login(input: LoginInput, ip: string | null, userAgent: string | null) {
  const record = await findByEmail(input.email)
  if (!record) {
    await bcrypt.compare(input.password, "$2b$12$KIXx.M7QKVZ2tD7g4b5P7O5nWZYJn0/Gpl8x.0x14Vw2FKnLFsc4a")
    throw new AppError(401, "INVALID_CREDENTIALS", "Correo o contraseña incorrectos.")
  }
  if (!record.isActive) throw new AppError(403, "ACCOUNT_DISABLED", "La cuenta está desactivada.")
  if (record.lockedUntilUtc && record.lockedUntilUtc > new Date()) throw new AppError(423, "ACCOUNT_LOCKED", "La cuenta está bloqueada temporalmente.")

  const valid = await bcrypt.compare(input.password, record.passwordHash)
  if (!valid) {
    await registerFailure(record.userId)
    throw new AppError(401, "INVALID_CREDENTIALS", "Correo o contraseña incorrectos.")
  }

  await resetFailures(record.userId)
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + env.SESSION_HOURS * 60 * 60 * 1000)
  await createSession(record.userId, tokenHash(token), expiresAt, ip, userAgent)
  return {
    token,
    user: { userId: record.userId, email: record.email, firstName: record.firstName, lastName: record.lastName, roles: record.roles },
  }
}
