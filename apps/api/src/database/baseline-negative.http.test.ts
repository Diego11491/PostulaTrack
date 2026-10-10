import { readFileSync } from "node:fs"
import assert from "node:assert/strict"
import test from "node:test"
import { PGlite } from "@electric-sql/pglite"
import pg from "pg"

process.env.DATABASE_URL="postgresql://test:test@localhost:5432/test"
process.env.DATABASE_SSL="false"
process.env.WEB_ORIGIN="http://localhost:3000"
process.env.SESSION_COOKIE_NAME="pt_session"
const db=new PGlite()
const connection={query:(sql:string,params?:unknown[])=>db.query(sql,params as any),release:()=>{}}
pg.Pool.prototype.query=connection.query as any
pg.Pool.prototype.connect=(async()=>connection) as any
const {createApp}=await import("../app.js")
const {csrfToken}=await import("../middleware/security.js")

// Caja negra: las comprobaciones observan respuestas HTTP, no filas internas.
// PostgreSQL embebido prepara un entorno aislado; no usa cuentas ni servicios reales.
test("Caja negra adicional: cuentas, propiedad, estados y sesiones",async(t)=>{
  await db.exec(readFileSync(new URL("../../../../database/postgres/001_schema.sql",import.meta.url),"utf8"))
  await db.exec(readFileSync(new URL("../../../../database/postgres/003_recruitment.sql",import.meta.url),"utf8"))
  const server=createApp().listen(0,"127.0.0.1")
  await new Promise<void>(r=>server.once("listening",r))
  const address=server.address()
  if(!address||typeof address==="string")throw new Error("Puerto de prueba no disponible")
  const base=`http://127.0.0.1:${address.port}/api`
  type Actor={cookie:string;token:string;email:string}
  async function call(path:string,actor?:Actor,method="GET",body?:unknown,override:Record<string,string>={}){
    const headers:Record<string,string>={origin:"http://localhost:3000","content-type":"application/json"}
    if(actor){const csrf=csrfToken(actor.token);headers.cookie=`${actor.cookie}; pt_csrf=${csrf}`;headers["x-csrf-token"]=csrf}
    const response=await fetch(base+path,{method,headers:{...headers,...override},body:body===undefined?undefined:JSON.stringify(body)})
    return {status:response.status,headers:response.headers,body:response.status===204?null:await response.json() as any}
  }
  const password="PruebaSegura123A"
  async function actor(email:string,firstName:string):Promise<Actor>{
    assert.equal((await call("/auth/register",undefined,"POST",{email,password,firstName,lastName:"Ejemplo"})).status,201)
    return session(email,password)
  }
  async function session(email:string,currentPassword:string):Promise<Actor>{
    const response=await call("/auth/login",undefined,"POST",{email,password:currentPassword})
    assert.equal(response.status,200)
    const cookie=response.headers.get("set-cookie")?.split(";")[0]
    assert.ok(cookie)
    return {cookie,token:cookie.slice("pt_session=".length),email}
  }
  try{
    const a=await actor("ana.qa@example.test","Ana"),b=await actor("beto.qa@example.test","Beto")
    const opportunity=await call("/opportunities",a,"POST",{companyName:"Empresa de prueba",jobTitle:"Analista QA",createApplication:true})
    assert.equal(opportunity.status,201)
    const id=opportunity.body.applicationId as number
    await t.test("CN-08: credenciales incorrectas y correo desconocido -> 401 sin distinguir cuentas",async()=>{
      const wrong=await call("/auth/login",undefined,"POST",{email:a.email,password:"Incorrecta123A"})
      const unknown=await call("/auth/login",undefined,"POST",{email:"nadie.qa@example.test",password})
      assert.equal(wrong.status,401);assert.equal(unknown.status,401)
      assert.equal(wrong.body.error.code,"INVALID_CREDENTIALS")
      assert.equal(wrong.body.error.message,unknown.body.error.message)
      assert.equal(wrong.headers.get("set-cookie"),null)
    })
    await t.test("CN-09: registro débil/incorrecto -> 400; correo repetido -> 409",async()=>{
      const valid={email:a.email,password,firstName:"Ana",lastName:"Ejemplo"}
      assert.equal((await call("/auth/register",undefined,"POST",{...valid,email:"otra.qa@example.test",password:"weak"})).status,400)
      assert.equal((await call("/auth/register",undefined,"POST",{...valid,email:"correo-invalido"})).status,400)
      assert.equal((await call("/auth/register",undefined,"POST",valid)).status,409)
    })
    await t.test("CN-10: perfil inválido -> 400 y datos anteriores conservados",async()=>{
      const before=(await call("/profile",a)).body.profile
      const result=await call("/profile",a,"PUT",{firstName:"Ana",lastName:"Ejemplo",phone:"no-es-telefono",graduationYear:20000})
      assert.equal(result.status,400);assert.equal(result.body.error.code,"VALIDATION_ERROR")
      const after=(await call("/profile",a)).body.profile
      assert.equal(after.Phone,before.Phone);assert.equal(after.GraduationYear,before.GraduationYear)
    })
    await t.test("CN-11: sin sesión -> 401; proceso ajeno -> 404 en lectura y cambio",async()=>{
      assert.equal((await call(`/applications/${id}`)).status,401)
      assert.equal((await call(`/applications/${id}`,b)).status,404)
      assert.equal((await call(`/applications/${id}/status`,b,"POST",{newStatusCode:"SENT"})).status,404)
      assert.equal((await call(`/applications/${id}`,a)).body.application.StatusCode,"REGISTERED")
    })
    await t.test("CN-12: origen externo o CSRF ausente -> 403 y estado intacto",async()=>{
      const external=await call(`/applications/${id}/status`,a,"POST",{newStatusCode:"SENT"},{origin:"https://externo.example.test"})
      const noToken=await call(`/applications/${id}/status`,a,"POST",{newStatusCode:"SENT"},{"x-csrf-token":""})
      assert.equal(external.status,403);assert.equal(external.body.error.code,"INVALID_ORIGIN")
      assert.equal(noToken.status,403);assert.equal(noToken.body.error.code,"INVALID_CSRF")
      assert.equal((await call(`/applications/${id}`,a)).body.application.StatusCode,"REGISTERED")
    })
    await t.test("CN-13: estado inválido -> 400; cambio -> 200; repetición -> 409 sin historial extra",async()=>{
      const before=(await call(`/applications/${id}`,a)).body
      assert.equal((await call(`/applications/${id}/status`,a,"POST",{newStatusCode:"INVENTADO"})).status,400)
      assert.equal((await call(`/applications/${id}/status`,a,"POST",{newStatusCode:"SENT",comment:"Envío confirmado"})).status,200)
      const changed=(await call(`/applications/${id}`,a)).body
      assert.equal(changed.application.StatusCode,"SENT");assert.equal(changed.history.length,before.history.length+1)
      assert.equal(changed.history[0].Comment,"Envío confirmado")
      assert.ok(changed.history[0].ChangedAtUtc)
      assert.equal((await call(`/applications/${id}/status`,a,"POST",{newStatusCode:"SENT"})).status,409)
      assert.equal((await call(`/applications/${id}`,a)).body.history.length,changed.history.length)
      assert.equal((await call("/applications/-1",a)).status,400)
    })
    await t.test("CN-14: cambio de contraseña valida la actual y revoca otras sesiones",async()=>{
      const otherSession=await session(a.email,password),next="NuevaPrueba123B"
      assert.equal((await call("/auth/change-password",a,"POST",{currentPassword:"Erronea123A",newPassword:next,confirmation:next})).status,400)
      assert.equal((await call("/auth/change-password",a,"POST",{currentPassword:password,newPassword:next,confirmation:"NoCoincide123B"})).status,400)
      assert.equal((await call("/auth/change-password",a,"POST",{currentPassword:password,newPassword:next,confirmation:next})).status,200)
      assert.equal((await call("/auth/me",otherSession)).status,401)
      assert.equal((await call("/auth/me",a)).status,200)
      assert.equal((await call("/auth/login",undefined,"POST",{email:a.email,password})).status,401)
      assert.equal((await call("/auth/login",undefined,"POST",{email:a.email,password:next})).status,200)
    })
    await t.test("CN-15: logout -> 204 y reutilización de la cookie -> 401",async()=>{
      assert.equal((await call("/auth/logout",b,"POST")).status,204)
      assert.equal((await call("/auth/me",b)).status,401)
    })
  }finally{await new Promise<void>((r,j)=>server.close(e=>e?j(e):r()));await db.close()}
})
