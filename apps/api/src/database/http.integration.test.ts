import { readFileSync } from "node:fs"
import assert from "node:assert/strict"
import test from "node:test"
import { PGlite } from "@electric-sql/pglite"
import pg from "pg"

process.env.DATABASE_URL="postgresql://test:test@localhost:5432/test"
process.env.DATABASE_SSL="false"
process.env.WEB_ORIGIN="http://localhost:3000"
const db=new PGlite()
const connection={query:(text:string,params?:unknown[])=>db.query(text,params as any),release:()=>{}}
pg.Pool.prototype.query=connection.query as any
pg.Pool.prototype.connect=(async()=>connection) as any
const {createApp}=await import("../app.js")

test("HTTP: sesión, perfil, ofertas ADMIN y tablero sobre PostgreSQL",async()=>{
  await db.exec(readFileSync(new URL("../../../../database/postgres/001_schema.sql",import.meta.url),"utf8"))
  const server=createApp().listen(0,"127.0.0.1")
  await new Promise<void>(resolve=>server.once("listening",resolve))
  const address=server.address()
  if(!address || typeof address==="string") throw new Error("Puerto no disponible")
  const base=`http://127.0.0.1:${address.port}/api`
  const call=async(path:string,options:RequestInit={})=>{
    const response=await fetch(base+path,{...options,headers:{origin:"http://localhost:3000",
      "content-type":"application/json",...options.headers}})
    return {response,body:response.status===204?null:await response.json() as any}
  }
  const post=(path:string,body:unknown,cookie?:string)=>call(path,{method:"POST",body:JSON.stringify(body),headers:cookie?{cookie}:undefined})
  try{
    const user={email:"usuario@example.test",password:"Segura123456A",firstName:"Ana",lastName:"Ejemplo"}
    assert.equal((await post("/auth/register",user)).response.status,201)
    const login=await post("/auth/login",{email:user.email,password:user.password})
    assert.equal(login.response.status,200)
    const cookie=login.response.headers.get("set-cookie")?.split(";")[0]
    assert.ok(cookie)
    assert.equal((await call("/profile",{headers:{cookie}})).body.profile.FirstName,"Ana")
    const opportunity=await post("/opportunities",{companyName:"Compañía",jobTitle:"Analista",
      createApplication:true,sourceUrl:"https://example.test"},cookie)
    assert.equal(opportunity.response.status,201)
    assert.ok(opportunity.body.applicationId)
    const board=await call("/dashboard",{headers:{cookie}})
    assert.equal(board.response.status,200)
    assert.equal(board.body.metrics.activeProcesses,1)
    const status=await post(`/applications/${opportunity.body.applicationId}/status`,{newStatusCode:"SENT"},cookie)
    assert.equal(status.response.status,200)
    const adminId=(await db.query<{userid:string}>(`INSERT INTO sec.users(email,passwordhash,emailverified)
      VALUES('admin@example.test','hash',true) RETURNING userid`)).rows[0].userid
    await db.query(`INSERT INTO app.profiles(userid,firstname,lastname) VALUES($1,'Admin','Test')`,[adminId])
    await db.query(`INSERT INTO sec.userroles(userid,roleid) SELECT $1,roleid FROM sec.roles WHERE name='ADMIN'`,[adminId])
    // Un USER no puede publicar; ADMIN sí. La prueba de login ADMIN se hace por sesión persistida.
    assert.equal((await post("/job-offers",{},cookie)).response.status,403)
    const hash=(await import("../middleware/security.js")).tokenHash("admin-token")
    await db.query(`INSERT INTO sec.sessions(userid,sessiontokenhash,expiresatutc)
      VALUES($1,$2,now()+interval '1 hour')`,[adminId,hash])
    const adminCookie="pt_session=admin-token"
    const published=await post("/job-offers",{jobTitle:"Analista de datos",companyName:"Empresa",
      requirementsSummary:"SQL y Python",sourceName:"Portal",sourceUrl:"https://example.test/empleo"},adminCookie)
    assert.equal(published.response.status,201)
    const offers=await call("/job-offers",{headers:{cookie}})
    assert.equal(offers.response.status,200)
    assert.equal(offers.body.offers[0].JobTitle,"Analista de datos")
    assert.equal((await call("/admin/users",{headers:{cookie}})).response.status,403)
    assert.equal((await call("/admin/users",{headers:{cookie:adminCookie}})).response.status,200)
  }finally{
    await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()))
    await db.close()
  }
})
