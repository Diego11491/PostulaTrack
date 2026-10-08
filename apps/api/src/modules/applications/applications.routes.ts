import { applicationSchema, statusChangeSchema } from "@postulatrack/contracts"
import { Router } from "express"
import { authenticate, requireCandidate } from "../../middleware/security.js"
import { AppError, asyncHandler } from "../../shared/http.js"
import { changeStatus, createApplication, getApplication, listApplications } from "./applications.repository.js"

export const applicationsRouter = Router()
applicationsRouter.use(authenticate,requireCandidate)

applicationsRouter.get("/", asyncHandler(async (req, res) => {
  res.json({ applications: await listApplications(req.user!.userId) })
}))

applicationsRouter.post("/", asyncHandler(async (req, res) => {
  const parsed = applicationSchema.safeParse(req.body)
  if (!parsed.success) throw new AppError(400, "VALIDATION_ERROR", "Revisa los datos del proceso.", parsed.error.flatten())
  res.status(201).json({ applicationId: await createApplication(req.user!.userId, parsed.data) })
}))

applicationsRouter.get("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(400, "INVALID_ID", "Identificador no válido.")
  const result = await getApplication(req.user!.userId, id)
  if (!result) throw new AppError(404, "NOT_FOUND", "No se encontró la postulación.")
  res.json(result)
}))

applicationsRouter.post("/:id/status", asyncHandler(async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(400, "INVALID_ID", "Identificador no válido.")
  const parsed = statusChangeSchema.safeParse(req.body)
  if (!parsed.success) throw new AppError(400, "VALIDATION_ERROR", "Revisa el nuevo estado.", parsed.error.flatten())
  await changeStatus(req.user!.userId, id, parsed.data, req.ip ?? null)
  res.json({ message: "Estado e historial actualizados." })
}))
