import type { NextFunction, Request, Response } from "express"

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message)
  }
}

export const asyncHandler = (fn: (r: Request, s: Response, n: NextFunction) => Promise<unknown>) =>
  (r: Request, s: Response, n: NextFunction) => void fn(r, s, n).catch(n)

export function notFound(_r: Request, _s: Response, n: NextFunction) {
  n(new AppError(404, "ROUTE_NOT_FOUND", "La ruta no existe."))
}

export function errorHandler(error: unknown, _r: Request, response: Response, _n: NextFunction) {
  if (error instanceof AppError) return response.status(error.status).json({ error: { code: error.code, message: error.message, details: error.details } })

  const code = error instanceof Error && "code" in error ? String(error.code) : ""
  if (["ESOCKET", "ETIMEOUT", "ELOGIN"].includes(code)) {
    console.error(`SQL Server no disponible (${code}). Comprueba /ready y la conexión local.`)
    return response.status(503).json({ error: { code: "DATABASE_UNAVAILABLE", message: "No se pudo acceder a la base de datos. Revisa el servicio SQL Server y la configuración local." } })
  }

  console.error(error)
  return response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Ocurrió un error inesperado." } })
}
