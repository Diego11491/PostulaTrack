import { Router } from "express"
import rateLimit from "express-rate-limit"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { registerSchema } from "@postulatrack/contracts"
import { getPool, sql } from "../../database/pool.js"
import { authenticate } from "../../middleware/security.js"
import { AppError, asyncHandler } from "../../shared/http.js"

export const passwordRouter = Router()

const passwordLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: registerSchema.shape.password,
    confirmation: z.string().min(1).max(128),
  })
  .superRefine((data, context) => {
    if (data.newPassword !== data.confirmation) {
      context.addIssue({
        code: "custom",
        path: ["confirmation"],
        message: "Las contraseñas nuevas no coinciden.",
      })
    }

    if (data.currentPassword === data.newPassword) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "La contraseña nueva debe ser diferente de la actual.",
      })
    }
  })

passwordRouter.post(
  "/change-password",
  authenticate,
  passwordLimit,
  asyncHandler(async (req, res) => {
    const parsed = passwordSchema.safeParse(req.body)

    if (!parsed.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Revisa los campos. La contraseña nueva debe tener entre 12 y 128 caracteres, una mayúscula, una minúscula y un número.",
        parsed.error.flatten()
      )
    }

    const userId = req.user!.userId
    const sessionId = req.sessionId

    if (!sessionId) {
      throw new AppError(
        401,
        "UNAUTHORIZED",
        "Debes iniciar sesión para cambiar tu contraseña."
      )
    }

    const { currentPassword, newPassword } = parsed.data
    const pool = await getPool()

    const result = await pool
      .request()
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`
        SELECT PasswordHash
        FROM sec.Users
        WHERE UserId = @UserId
          AND IsActive = 1;
      `)

    const account = result.recordset[0] as
      | { PasswordHash: string }
      | undefined

    if (!account) {
      throw new AppError(
        401,
        "UNAUTHORIZED",
        "Tu cuenta no está disponible. Inicia sesión nuevamente."
      )
    }

    const validPassword = await bcrypt.compare(
      currentPassword,
      account.PasswordHash
    )

    if (!validPassword) {
      throw new AppError(
        400,
        "INVALID_CURRENT_PASSWORD",
        "La contraseña actual es incorrecta."
      )
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    const transaction = new sql.Transaction(pool)

    await transaction.begin()

    try {
      const updated = await new sql.Request(transaction)
        .input("UserId", sql.UniqueIdentifier, userId)
        .input("SessionId", sql.BigInt, sessionId)
        .input("OldHash", sql.NVarChar(255), account.PasswordHash)
        .input("NewHash", sql.NVarChar(255), newHash)
        .query(`
          UPDATE sec.Users
          SET PasswordHash = @NewHash,
              FailedLoginCount = 0,
              LockedUntilUtc = NULL,
              UpdatedAtUtc = SYSUTCDATETIME()
          OUTPUT inserted.UserId
          WHERE UserId = @UserId
            AND IsActive = 1
            AND PasswordHash = @OldHash
            AND EXISTS (
              SELECT 1
              FROM sec.Sessions
              WHERE SessionId = @SessionId
                AND UserId = @UserId
                AND RevokedAtUtc IS NULL
                AND ExpiresAtUtc > SYSUTCDATETIME()
            );
        `)

      if (updated.recordset.length === 0) {
        throw new AppError(
          409,
          "ACCOUNT_CHANGED",
          "La cuenta o la sesión cambió. Inicia sesión nuevamente e inténtalo otra vez."
        )
      }

      await new sql.Request(transaction)
        .input("UserId", sql.UniqueIdentifier, userId)
        .input("SessionId", sql.BigInt, sessionId)
        .query(`
          UPDATE sec.Sessions
          SET RevokedAtUtc = SYSUTCDATETIME()
          WHERE UserId = @UserId
            AND SessionId <> @SessionId
            AND RevokedAtUtc IS NULL;
        `)

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }

    res.json({
      message:
        "Contraseña actualizada correctamente. Se cerraron las otras sesiones de tu cuenta.",
    })
  })
)