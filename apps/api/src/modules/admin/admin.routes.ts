import { adminUserStatusSchema } from "@postulatrack/contracts"
import { Router } from "express"
import { getPool, sql } from "../../database/pool.js"
import { authenticate, requireRole } from "../../middleware/security.js"
import { AppError, asyncHandler } from "../../shared/http.js"

export const adminRouter = Router()
adminRouter.use(authenticate, requireRole("ADMIN"))

adminRouter.get("/users", asyncHandler(async (_req, res) => {
  const pool = await getPool()
  const result = await pool.request().query(`
    SELECT u.UserId, u.Email, p.FirstName, p.LastName, u.IsActive, u.CreatedAtUtc,
           STRING_AGG(r.Name, ',') AS Roles
    FROM sec.Users u
    JOIN app.Profiles p ON p.UserId=u.UserId
    JOIN sec.UserRoles ur ON ur.UserId=u.UserId
    JOIN sec.Roles r ON r.RoleId=ur.RoleId
    GROUP BY u.UserId, u.Email, p.FirstName, p.LastName, u.IsActive, u.CreatedAtUtc
    ORDER BY u.CreatedAtUtc DESC;
  `)
  res.json({ users: result.recordset })
}))

adminRouter.patch("/users/:id/status", asyncHandler(async (req, res) => {
  const parsed = adminUserStatusSchema.safeParse(req.body)
  if (!parsed.success) throw new AppError(400, "VALIDATION_ERROR", "Estado no válido.")
  if (req.params.id === req.user!.userId && !parsed.data.isActive) throw new AppError(400, "SELF_DISABLE", "No puedes desactivar tu propia cuenta.")
  const pool = await getPool()
  const result = await pool.request()
    .input("UserId", sql.UniqueIdentifier, req.params.id)
    .input("ActorUserId", sql.UniqueIdentifier, req.user!.userId)
    .input("IsActive", sql.Bit, parsed.data.isActive)
    .query(`
      UPDATE sec.Users SET IsActive=@IsActive, UpdatedAtUtc=SYSUTCDATETIME() WHERE UserId=@UserId;
      DECLARE @Affected INT = @@ROWCOUNT;
      IF @IsActive=0 UPDATE sec.Sessions SET RevokedAtUtc=SYSUTCDATETIME() WHERE UserId=@UserId AND RevokedAtUtc IS NULL;
      IF @Affected=1
        INSERT INTO audit.AuditLog(UserId, ActionCode, EntityType, EntityId, ResultCode, DetailsJson)
        VALUES(@ActorUserId, 'ACCOUNT_STATUS_CHANGED', 'User', CONVERT(NVARCHAR(80), @UserId), 'SUCCESS', JSON_OBJECT('isActive': @IsActive));
      SELECT @Affected AS Affected;
    `)
  if (!result.recordset[0]?.Affected) throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado.")
  res.json({ message: parsed.data.isActive ? "Cuenta activada." : "Cuenta desactivada." })
}))

adminRouter.get("/audit", asyncHandler(async (_req, res) => {
  const pool = await getPool()
  const result = await pool.request().query(`
    SELECT TOP 200 a.AuditId, a.ActionCode, a.EntityType, a.EntityId, a.ResultCode,
           a.IpAddress, a.CreatedAtUtc, u.Email
    FROM audit.AuditLog a LEFT JOIN sec.Users u ON u.UserId=a.UserId
    ORDER BY a.CreatedAtUtc DESC;
  `)
  res.json({ events: result.recordset })
}))
