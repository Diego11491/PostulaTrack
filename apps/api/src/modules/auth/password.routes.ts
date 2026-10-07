import { Router } from "express"
import rateLimit from "express-rate-limit"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { registerSchema } from "@postulatrack/contracts"
import { query, transaction } from "../../database/pool.js"
import { authenticate } from "../../middleware/security.js"
import { AppError, asyncHandler } from "../../shared/http.js"

export const passwordRouter = Router()
const passwordLimit = rateLimit({ windowMs: 15*60_000, limit: 10 })
const schema = z.object({
  currentPassword:z.string().min(1).max(128),
  newPassword:registerSchema.shape.password,
  confirmation:z.string().min(1).max(128),
}).superRefine((value, context) => {
  if (value.newPassword !== value.confirmation) context.addIssue({ code:"custom",path:["confirmation"],message:"Las contraseñas nuevas no coinciden." })
  if (value.currentPassword === value.newPassword) context.addIssue({ code:"custom",path:["newPassword"],message:"La contraseña nueva debe ser diferente." })
})
passwordRouter.post("/change-password",authenticate,passwordLimit,asyncHandler(async(req,res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) throw new AppError(400,"VALIDATION_ERROR","Revisa las contraseñas.",parsed.error.flatten())
  if (!req.sessionId) throw new AppError(401,"UNAUTHORIZED","Debes iniciar sesión.")
  const {currentPassword,newPassword} = parsed.data
  const changed = await transaction(async client => {
    const rows = await query(`SELECT passwordhash FROM sec.users WHERE userid=$1 AND isactive=true FOR UPDATE`,[req.user!.userId],client)
    if (!rows.length) throw new AppError(401,"UNAUTHORIZED","Cuenta no disponible.")
    const valid = await bcrypt.compare(currentPassword,rows[0].PasswordHash)
    if (!valid) throw new AppError(400,"INVALID_CURRENT_PASSWORD","La contraseña actual es incorrecta.")
    const session = await query(`SELECT sessionid FROM sec.sessions WHERE sessionid=$1 AND userid=$2
      AND revokedatutc IS NULL AND expiresatutc>now()`,[req.sessionId,req.user!.userId],client)
    if (!session.length) throw new AppError(409,"ACCOUNT_CHANGED","La sesión cambió. Inicia sesión nuevamente.")
    const hash = await bcrypt.hash(newPassword,12)
    await query(`UPDATE sec.users SET passwordhash=$1, failedlogincount=0,
      lockeduntilutc=NULL,updatedatutc=now() WHERE userid=$2`,[hash,req.user!.userId],client)
    await query(`UPDATE sec.sessions SET revokedatutc=now() WHERE userid=$1 AND sessionid<>$2
      AND revokedatutc IS NULL`,[req.user!.userId,req.sessionId],client)
    return true
  })
  if (changed) res.json({message:"Contraseña actualizada correctamente. Se cerraron las otras sesiones de tu cuenta."})
}))
