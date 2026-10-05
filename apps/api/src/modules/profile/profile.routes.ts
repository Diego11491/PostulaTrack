import { profileSchema } from "@postulatrack/contracts"
import { Router } from "express"
import { getPool, sql } from "../../database/pool.js"
import { authenticate } from "../../middleware/security.js"
import { AppError, asyncHandler } from "../../shared/http.js"

export const profileRouter = Router()
profileRouter.use(authenticate)

profileRouter.get("/", asyncHandler(async (req, res) => {
  const pool = await getPool()
  const result = await pool.request().input("UserId", sql.UniqueIdentifier, req.user!.userId).query(`
    SELECT FirstName, LastName, Phone, Country, City, Headline, ProfessionalSummary,
           Institution, Career, GraduationYear, UpdatedAtUtc
    FROM app.Profiles WHERE UserId = @UserId;
  `)
  if (!result.recordset.length) throw new AppError(404, "PROFILE_NOT_FOUND", "No se encontró el perfil.")
  res.json({ profile: result.recordset[0] })
}))

profileRouter.put("/", asyncHandler(async (req, res) => {
  const parsed = profileSchema.safeParse(req.body)
  if (!parsed.success) throw new AppError(400, "VALIDATION_ERROR", "Revisa los datos del perfil.", parsed.error.flatten())
  const data = parsed.data
  const pool = await getPool()
  await pool.request()
    .input("UserId", sql.UniqueIdentifier, req.user!.userId)
    .input("FirstName", sql.NVarChar(80), data.firstName)
    .input("LastName", sql.NVarChar(120), data.lastName)
    .input("Phone", sql.NVarChar(25), data.phone ?? null)
    .input("Country", sql.NVarChar(100), data.country ?? null)
    .input("City", sql.NVarChar(100), data.city ?? null)
    .input("Headline", sql.NVarChar(180), data.headline ?? null)
    .input("ProfessionalSummary", sql.NVarChar(1000), data.professionalSummary ?? null)
    .input("Institution", sql.NVarChar(180), data.institution ?? null)
    .input("Career", sql.NVarChar(160), data.career ?? null)
    .input("GraduationYear", sql.SmallInt, data.graduationYear ?? null)
    .query(`
      UPDATE app.Profiles SET FirstName=@FirstName, LastName=@LastName, Phone=@Phone, Country=@Country, City=@City,
        Headline=@Headline, ProfessionalSummary=@ProfessionalSummary, Institution=@Institution,
        Career=@Career, GraduationYear=@GraduationYear, UpdatedAtUtc=SYSUTCDATETIME()
      WHERE UserId=@UserId;
    `)
  res.json({ message: "Perfil actualizado." })
}))
