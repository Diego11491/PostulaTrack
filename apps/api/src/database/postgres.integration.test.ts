import { readFileSync } from "node:fs"
import assert from "node:assert/strict"
import test from "node:test"
import { PGlite } from "@electric-sql/pglite"
import pg from "pg"

// La API usa pg; el motor embebido intercepta el transporte sin abrir sockets ni tocar Supabase.
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test"
process.env.DATABASE_SSL = "false"
const db = new PGlite()
const connection = { query: (text:string, params?:unknown[]) => db.query(text, params as any), release: () => {} }
pg.Pool.prototype.query = connection.query as any
pg.Pool.prototype.connect = (async () => connection) as any

const { query } = await import("./pool.js")
const auth = await import("../modules/auth/auth.repository.js")
const opp = await import("../modules/opportunities/opportunities.repository.js")
const applications = await import("../modules/applications/applications.repository.js")

test("PostgreSQL: esquema, propietarios e historial en transacción", async () => {
  const schema=readFileSync(new URL("../../../../database/postgres/001_schema.sql",import.meta.url),"utf8")
  await db.exec(schema)
  const recruitment=readFileSync(new URL("../../../../database/postgres/003_recruitment.sql",import.meta.url),"utf8")
  await db.exec(recruitment)
  await db.exec(recruitment)
  const a=await auth.createUser({email:"a@example.test",password:"EjemploSeguro123",firstName:"Ana",lastName:"Test"},"hash-test")
  const b=await auth.createUser({email:"b@example.test",password:"EjemploSeguro123",firstName:"Beto",lastName:"Test"},"hash-test")
  const found=await auth.findByEmail("A@EXAMPLE.TEST")
  assert.equal(found?.userId,a)
  assert.deepEqual(found?.roles,["USER"])
  const created=await opp.createOpportunity(a,{companyName:"Empresa A",jobTitle:"Analista de datos",
    createApplication:true,sourceUrl:"https://example.test"})
  assert.ok(created.applicationId)
  assert.equal((await opp.listOpportunities(b)).length,0)
  assert.equal(await applications.getApplication(b,created.applicationId!),null)
  const before=await applications.getApplication(a,created.applicationId!)
  assert.equal(before?.application.StatusCode,"REGISTERED")
  assert.equal(before?.history.length,1)
  await applications.changeStatus(a,created.applicationId!,{newStatusCode:"SENT"},null)
  const after=await applications.getApplication(a,created.applicationId!)
  assert.equal(after?.application.StatusCode,"SENT")
  assert.equal(after?.history.length,2)
  await assert.rejects(applications.changeStatus(a,created.applicationId!,{newStatusCode:"SENT"},null))
  assert.equal((await applications.getApplication(a,created.applicationId!))?.history.length,2)
  await assert.rejects(db.query(`INSERT INTO app.applications(owneruserid,opportunityid,currentstatusid)
    SELECT $1,$2,statusid FROM app.applicationstatuses WHERE code='REGISTERED'`,[b,created.opportunityId]))
  const verify=readFileSync(new URL("../../../../database/postgres/002_verify.sql",import.meta.url),"utf8")
  await db.exec(verify)
  await db.close()
})
