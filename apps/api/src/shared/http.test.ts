import assert from "node:assert/strict"
import test from "node:test"
import type { Response } from "express"
import { AppError, errorHandler } from "./http.js"

function responseStub() {
  const result: { status?: number; body?: unknown } = {}
  const response = {
    status(code: number) { result.status = code; return this },
    json(body: unknown) { result.body = body; return this },
  } as Response
  return { response, result }
}

test("an unreachable SQL Server gives a safe, actionable 503", () => {
  const { response, result } = responseStub()
  const previous = console.error
  console.error = () => undefined
  try {
    errorHandler(Object.assign(new Error("host=127.0.0.1; password=never-return"), { code: "ESOCKET" }), {} as never, response, {} as never)
  } finally {
    console.error = previous
  }
  assert.equal(result.status, 503)
  assert.deepEqual(result.body, {
    error: {
      code: "DATABASE_UNAVAILABLE",
      message: "No se pudo acceder a la base de datos. Revisa el servicio SQL Server y la configuración local.",
    },
  })
})

test("domain errors preserve their own status and message", () => {
  const { response, result } = responseStub()
  errorHandler(new AppError(404, "NOT_FOUND", "No se encontró."), {} as never, response, {} as never)
  assert.equal(result.status, 404)
  assert.deepEqual(result.body, { error: { code: "NOT_FOUND", message: "No se encontró.", details: undefined } })
})
