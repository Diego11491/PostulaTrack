import { Router } from "express"
import { z } from "zod"
import { getPool, sql } from "../../database/pool.js"
import {
  authenticate,
  requireRole,
} from "../../middleware/security.js"
import { AppError, asyncHandler } from "../../shared/http.js"

export const jobOffersRouter = Router()

jobOffersRouter.use(authenticate)

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional()

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`)

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    )
  }, "La fecha no es válida.")
  .nullable()
  .optional()

const offerSchema = z
  .object({
    jobTitle: z.string().trim().min(1).max(180),
    companyName: z.string().trim().min(1).max(180),
    sector: optionalText(120),
    location: optionalText(180),
    workMode: z
      .enum(["HYBRID", "REMOTE", "ONSITE"])
      .nullable()
      .optional(),
    requirementsSummary: z.string().trim().min(1).max(2000),
    sourceName: z.string().trim().min(1).max(100),
    sourceUrl: z
      .string()
      .trim()
      .url()
      .max(1000)
      .refine(
        (value) => /^https?:\/\//i.test(value),
        "El enlace debe comenzar con http:// o https://."
      ),
    publishedOn: optionalDate,
    closingOn: optionalDate,
  })
  .refine(
    (data) =>
      !data.publishedOn ||
      !data.closingOn ||
      data.closingOn >= data.publishedOn,
    {
      path: ["closingOn"],
      message:
        "La fecha de cierre no puede ser anterior a la publicación.",
    }
  )

type OfferInput = z.infer<typeof offerSchema>

function getId(value: unknown): number {
  const id = Number(value)

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new AppError(
      400,
      "INVALID_ID",
      "El identificador de la oferta no es válido."
    )
  }

  return id
}

function parseOffer(body: unknown): OfferInput {
  const parsed = offerSchema.safeParse(body)

  if (!parsed.success) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Revisa los datos y las fechas de la oferta. El enlace debe ser una dirección http:// o https:// válida.",
      parsed.error.flatten()
    )
  }

  return parsed.data
}

function addOfferParameters(
  request: sql.Request,
  input: OfferInput
) {
  return request
    .input("JobTitle", sql.NVarChar(180), input.jobTitle)
    .input("CompanyName", sql.NVarChar(180), input.companyName)
    .input("Sector", sql.NVarChar(120), input.sector || null)
    .input("Location", sql.NVarChar(180), input.location || null)
    .input("WorkMode", sql.VarChar(20), input.workMode ?? null)
    .input(
      "RequirementsSummary",
      sql.NVarChar(2000),
      input.requirementsSummary
    )
    .input("SourceName", sql.NVarChar(100), input.sourceName)
    .input("SourceUrl", sql.NVarChar(1000), input.sourceUrl)
    .input("PublishedOn", sql.Date, input.publishedOn ?? null)
    .input("ClosingOn", sql.Date, input.closingOn ?? null)
}

// Catálogo disponible para cualquier usuario autenticado.
jobOffersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const pool = await getPool()

    const result = await pool.request().query(`
      SELECT
        JobOfferId,
        JobTitle,
        CompanyName,
        Sector,
        Location,
        WorkMode,
        RequirementsSummary,
        SourceName,
        SourceUrl,
        PublishedOn,
        ClosingOn,
        IsActive,
        CreatedAtUtc,
        UpdatedAtUtc
      FROM app.JobOffers
      WHERE IsActive = 1
        AND (
          ClosingOn IS NULL
          OR ClosingOn >= CONVERT(
            DATE,
            SYSUTCDATETIME() AT TIME ZONE 'UTC'
              AT TIME ZONE 'SA Pacific Standard Time'
          )
        )
      ORDER BY CreatedAtUtc DESC, JobOfferId DESC;
    `)

    res.json({ offers: result.recordset })
  })
)

// El administrador puede consultar también ofertas inactivas
// y ofertas cuya fecha de cierre ya pasó.
jobOffersRouter.get(
  "/manage",
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const pool = await getPool()

    const result = await pool.request().query(`
      SELECT
        JobOfferId,
        JobTitle,
        CompanyName,
        Sector,
        Location,
        WorkMode,
        RequirementsSummary,
        SourceName,
        SourceUrl,
        PublishedOn,
        ClosingOn,
        IsActive,
        CreatedAtUtc,
        UpdatedAtUtc
      FROM app.JobOffers
      ORDER BY CreatedAtUtc DESC, JobOfferId DESC;
    `)

    res.json({ offers: result.recordset })
  })
)

// Publicar una oferta. No crea ninguna postulación.
jobOffersRouter.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const input = parseOffer(req.body)
    const pool = await getPool()

    const request = addOfferParameters(pool.request(), input)
      .input(
        "CreatedByUserId",
        sql.UniqueIdentifier,
        req.user!.userId
      )

    const result = await request.query(`
      INSERT INTO app.JobOffers (
        JobTitle,
        CompanyName,
        Sector,
        Location,
        WorkMode,
        RequirementsSummary,
        SourceName,
        SourceUrl,
        PublishedOn,
        ClosingOn,
        CreatedByUserId
      )
      OUTPUT inserted.JobOfferId
      VALUES (
        @JobTitle,
        @CompanyName,
        @Sector,
        @Location,
        @WorkMode,
        @RequirementsSummary,
        @SourceName,
        @SourceUrl,
        @PublishedOn,
        @ClosingOn,
        @CreatedByUserId
      );
    `)

    res.status(201).json({
      jobOfferId: Number(result.recordset[0].JobOfferId),
      message: "Oferta registrada correctamente.",
    })
  })
)

// Editar la información de una oferta.
jobOffersRouter.put(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = getId(req.params.id)
    const input = parseOffer(req.body)
    const pool = await getPool()

    const request = addOfferParameters(pool.request(), input)
      .input("JobOfferId", sql.BigInt, id)

    const result = await request.query(`
      UPDATE app.JobOffers
      SET
        JobTitle = @JobTitle,
        CompanyName = @CompanyName,
        Sector = @Sector,
        Location = @Location,
        WorkMode = @WorkMode,
        RequirementsSummary = @RequirementsSummary,
        SourceName = @SourceName,
        SourceUrl = @SourceUrl,
        PublishedOn = @PublishedOn,
        ClosingOn = @ClosingOn,
        UpdatedAtUtc = SYSUTCDATETIME()
      OUTPUT inserted.JobOfferId
      WHERE JobOfferId = @JobOfferId;
    `)

    if (result.recordset.length === 0) {
      throw new AppError(
        404,
        "NOT_FOUND",
        "No se encontró la oferta."
      )
    }

    res.json({ message: "Oferta actualizada correctamente." })
  })
)

// Activar o desactivar sin borrar la oferta.
jobOffersRouter.patch(
  "/:id/active",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = getId(req.params.id)
    const parsed = z
      .object({ isActive: z.boolean() })
      .safeParse(req.body)

    if (!parsed.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Debes indicar si la oferta estará activa."
      )
    }

    const pool = await getPool()

    const result = await pool
      .request()
      .input("JobOfferId", sql.BigInt, id)
      .input("IsActive", sql.Bit, parsed.data.isActive)
      .query(`
        UPDATE app.JobOffers
        SET
          IsActive = @IsActive,
          UpdatedAtUtc = SYSUTCDATETIME()
        OUTPUT inserted.JobOfferId
        WHERE JobOfferId = @JobOfferId;
      `)

    if (result.recordset.length === 0) {
      throw new AppError(
        404,
        "NOT_FOUND",
        "No se encontró la oferta."
      )
    }

    res.json({
      message: parsed.data.isActive
        ? "Oferta activada."
        : "Oferta desactivada.",
    })
  })
)