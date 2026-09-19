import { opportunitySchema } from "@postulatrack/contracts"
import { Router } from "express"
import { authenticate } from "../../middleware/security.js"
import { AppError, asyncHandler } from "../../shared/http.js"
import { createOpportunity, deleteOpportunity, listOpportunities } from "./opportunities.repository.js"

export const opportunitiesRouter = Router()
opportunitiesRouter.use(authenticate)

opportunitiesRouter.get("/", asyncHandler(async (req, res) => {
  res.json({ opportunities: await listOpportunities(req.user!.userId) })
}))

opportunitiesRouter.post("/", asyncHandler(async (req, res) => {
  const parsed = opportunitySchema.safeParse(req.body)
  if (!parsed.success) throw new AppError(400, "VALIDATION_ERROR", "Revisa los datos de la oportunidad.", parsed.error.flatten())
  res.status(201).json(await createOpportunity(req.user!.userId, parsed.data))
}))

opportunitiesRouter.delete("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(400, "INVALID_ID", "Identificador no válido.")
  if (!await deleteOpportunity(req.user!.userId, id)) throw new AppError(404, "NOT_FOUND", "No se encontró la oportunidad.")
  res.status(204).send()
}))
