import { readFileSync } from "node:fs"
import assert from "node:assert/strict"
import { after, before, test } from "node:test"
import { PGlite } from "@electric-sql/pglite"
import pg from "pg"

process.env.DATABASE_URL="postgresql://test:test@localhost:5432/test"
process.env.DATABASE_SSL="false"
const db=new PGlite()
let injectHistoryFailure=false,updateObserved=false
const connection={
  async query(sql:string,params?:unknown[]){
    if(injectHistoryFailure&&sql.includes("UPDATE app.applications SET"))updateObserved=true
    if(injectHistoryFailure&&sql.includes("INSERT INTO app.applicationstatushistory")){
      injectHistoryFailure=false
      throw Object.assign(new Error("Fallo controlado de prueba antes de insertar historial"),{code:"23514"})
    }
    return db.query(sql,params as any)
  },release:()=>{},
}
pg.Pool.prototype.query=connection.query as any
pg.Pool.prototype.connect=(async()=>connection) as any
const {query}=await import("./pool.js")
const auth=await import("../modules/auth/auth.repository.js")
const opportunities=await import("../modules/opportunities/opportunities.repository.js")
const applications=await import("../modules/applications/applications.repository.js")
let ownerId:string
before(async()=>{
  await db.exec(readFileSync(new URL("../../../../database/postgres/001_schema.sql",import.meta.url),"utf8"))
  await db.exec(readFileSync(new URL("../../../../database/postgres/003_recruitment.sql",import.meta.url),"utf8"))
  ownerId=await auth.createUser({email:"atomicidad@example.test",password:"PruebaSegura123A",firstName:"Ana",lastName:"QA"},"hash-sintetico")
})
after(async()=>{await db.close()})

test("CB-06: fallo tras UPDATE revierte estado, historial y auditoría; después permite continuar",async()=>{
  const created=await opportunities.createOpportunity(ownerId,{companyName:"Prueba de atomicidad",jobTitle:"Analista",createApplication:true})
  const id=created.applicationId!
  const before=await applications.getApplication(ownerId,id)
  const auditBefore=(await query(`SELECT count(*)::int AS total FROM audit.auditlog WHERE userid=$1`,[ownerId]))[0].total
  injectHistoryFailure=true
  await assert.rejects(()=>applications.changeStatus(ownerId,id,{newStatusCode:"SENT"},null),{code:"23514"})
  assert.equal(updateObserved,true,"El fallo ocurre después de intentar UPDATE, no en una validación previa.")
  const after=await applications.getApplication(ownerId,id)
  assert.equal(after!.application.StatusCode,before!.application.StatusCode)
  assert.equal(after!.history.length,before!.history.length)
  assert.equal((await query(`SELECT count(*)::int AS total FROM audit.auditlog WHERE userid=$1`,[ownerId]))[0].total,auditBefore)
  await applications.changeStatus(ownerId,id,{newStatusCode:"SENT"},null)
  assert.equal((await applications.getApplication(ownerId,id))!.application.StatusCode,"SENT")
})
test("CB-07: búsqueda por correo usa parámetros; texto SQL hostil no altera usuarios",async()=>{
  const countBefore=(await query(`SELECT count(*)::int AS total FROM sec.users`))[0].total
  for(const value of ["noexiste@example.test' OR '1'='1","x'; DROP TABLE sec.users;--"])
    assert.equal(await auth.findByEmail(value),null)
  assert.equal((await query(`SELECT count(*)::int AS total FROM sec.users`))[0].total,countBefore)
  assert.equal((await auth.findByEmail("ATOMICIDAD@EXAMPLE.TEST"))!.userId,ownerId)
})
