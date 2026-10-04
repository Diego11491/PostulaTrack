import assert from "node:assert/strict"
import { test } from "node:test"
import { createJobSearch, jobSearchSchema } from "./jobs.service.js"

const params = { keywords: "Analista de datos", location: "Lima", page: 1 }

test("requiere búsqueda válida y acota página y longitud", () => {
  assert.equal(jobSearchSchema.safeParse({ keywords: "a", location: "Lima" }).success, false)
  assert.equal(jobSearchSchema.safeParse({ keywords: "Datos", page: 999 }).success, false)
  assert.equal(jobSearchSchema.safeParse({ keywords: "Datos", unexpected: "x" }).success, false)
  assert.deepEqual(jobSearchSchema.parse({ keywords: " Datos " }), { keywords: "Datos", location: "Lima", page: 1 })
})

test("sin clave falla sin llamar al proveedor", async () => {
  const search = createJobSearch({ apiKey: undefined, fetcher: (() => { throw new Error("should not call") }) as typeof fetch })
  await assert.rejects(search(params), { code: "JOBS_NOT_CONFIGURED", status: 503 })
})

test("fija host regional, normaliza respuesta y nunca guarda ofertas automáticamente", async () => {
  let requests = 0
  const search = createJobSearch({ apiKey: "test-key", fetcher: (async (url, init) => {
    requests++
    assert.equal(String(url), "https://pe.jooble.org/api/test-key")
    assert.equal(init?.method, "POST")
    assert.deepEqual(JSON.parse(String(init?.body)), { keywords: params.keywords, location: "Lima", page: 1, ResultOnPage: 10 })
    return new Response(JSON.stringify({ totalCount: 2, jobs: [
      { id: 123, title: "Analista", company: "Banco", location: "Lima", snippet: "<b>SQL</b> y datos", link: "https://pe.jooble.org/jdp/123" },
      { id: 124, title: "Mala URL", link: "javascript:alert(1)" },
    ] }), { status: 200 })
  }) as typeof fetch })
  const result = await search(params)
  assert.equal(result.jobs.length, 1)
  assert.equal(result.jobs[0].snippet, "SQL y datos")
  assert.equal(result.jobs[0].source, "Jooble")
  assert.equal(requests, 1)
  await search(params)
  assert.equal(requests, 1, "repetición sale de caché para proteger la cuota")
})

test("fallo externo oculta la clave y no cachea el error", async () => {
  let calls = 0
  const search = createJobSearch({ apiKey: "secret-test-key", fetcher: (async () => {
    calls++
    throw new Error("https://pe.jooble.org/api/secret-test-key")
  }) as typeof fetch })
  for (let i = 0; i < 2; i++) {
    await assert.rejects(search(params), (error: unknown) => {
      assert.equal((error as Error).message.includes("secret-test-key"), false)
      assert.equal((error as { code: string }).code, "JOBS_PROVIDER_UNAVAILABLE")
      return true
    })
  }
  assert.equal(calls, 2)
})
