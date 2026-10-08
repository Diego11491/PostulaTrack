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
  await db.exec(readFileSync(new URL("../../../../database/postgres/003_recruitment.sql",import.meta.url),"utf8"))
  const server=createApp().listen(0,"127.0.0.1")
  await new Promise<void>(resolve=>server.once("listening",resolve))
  const address=server.address()
  if(!address || typeof address==="string") throw new Error("Puerto no disponible")
  const base=`http://127.0.0.1:${address.port}/api`
  const call=async(path:string,options:RequestInit={})=>{
    const headers: Record<string,string> = {origin:"http://localhost:3000",
      "content-type":"application/json",...(options.headers as Record<string,string>|undefined)}
    if (headers.cookie && !["GET","HEAD","OPTIONS"].includes((options.method??"GET").toUpperCase()) &&
        !["/auth/login","/auth/register"].includes(path)) {
      const csrfResponse=await fetch(base+"/auth/csrf",{headers:{cookie:headers.cookie}})
      const token=csrfResponse.headers.get("set-cookie")?.match(/pt_csrf=([^;]+)/)?.[1]
      if (csrfResponse.ok && token) {
        headers.cookie+=`; pt_csrf=${token}`
        headers["x-csrf-token"]=token
      }
    }
    const response=await fetch(base+path,{...options,headers})
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
    const forged=await fetch(base+"/opportunities",{method:"POST",headers:{origin:"http://localhost:3000",
      "content-type":"application/json",cookie},body:JSON.stringify({companyName:"X",jobTitle:"Y"})})
    assert.equal(forged.status,403)
    assert.equal((await forged.json() as any).error.code,"INVALID_CSRF")
    const csrfResponse=await fetch(base+"/auth/csrf",{headers:{cookie}})
    assert.equal(csrfResponse.status,200)
    const csrf=csrfResponse.headers.get("set-cookie")?.match(/pt_csrf=([^;]+)/)?.[1]
    assert.ok(csrf)
    const mismatched=await fetch(base+"/opportunities",{method:"POST",headers:{origin:"http://localhost:3000",
      "content-type":"application/json",cookie:`${cookie}; pt_csrf=${csrf}`,"x-csrf-token":"bad"},
      body:JSON.stringify({companyName:"X",jobTitle:"Y"})})
    assert.equal(mismatched.status,403)
    assert.equal((await call("/profile",{headers:{cookie}})).body.profile.FirstName,"Ana")
    const opportunity=await post("/opportunities",{companyName:"Compañía",jobTitle:"Analista",
      createApplication:true,sourceUrl:"https://example.test"},cookie)
    assert.equal(opportunity.response.status,201)
    assert.ok(opportunity.body.applicationId)
    const board=await call("/dashboard",{headers:{cookie}})
    assert.equal(board.response.status,200)
    assert.equal(board.body.metrics.activeProcesses,1)
    assert.equal((await call("/notifications")).response.status,401)
    await db.query(`UPDATE app.applications SET nextaction='Preparar entrevista',
      nextactionatutc=now()+interval '1 day' WHERE applicationid=$1`,[opportunity.body.applicationId])
    await db.query(`UPDATE app.opportunities SET closingon=(now() AT TIME ZONE 'America/Lima')::date+2
      WHERE opportunityid=$1`,[opportunity.body.opportunityId])
    const notices=await call("/notifications",{headers:{cookie}})
    assert.equal(notices.response.status,200)
    assert.equal(notices.body.total,2)
    assert.deepEqual(notices.body.notifications.map((item:any)=>item.Kind).sort(),["ACTION","DEADLINE"])
    assert.equal(notices.body.notifications.find((item:any)=>item.Kind==="ACTION").Href,
      `/postulaciones/${opportunity.body.applicationId}`)
    assert.equal((await post("/auth/register",{email:"otro@example.test",password:"Segura123456A",
      firstName:"Otro",lastName:"Usuario"})).response.status,201)
    const other=await post("/auth/login",{email:"otro@example.test",password:"Segura123456A"})
    const otherCookie=other.response.headers.get("set-cookie")?.split(";")[0]
    assert.ok(otherCookie)
    const privateNotices=await call("/notifications",{headers:{cookie:otherCookie}})
    assert.equal(privateNotices.body.total,0)
    assert.deepEqual(privateNotices.body.notifications,[])
    const saved=await post("/opportunities",{companyName:"Otra empresa",jobTitle:"Prácticas de verano",
      createApplication:false},cookie)
    assert.equal(saved.response.status,201)
    assert.equal(saved.body.applicationId,null)
    const savedList=await call("/opportunities",{headers:{cookie}})
    assert.equal(savedList.body.opportunities.find((item:any)=>item.OpportunityId===saved.body.opportunityId).ApplicationId,null)
    assert.equal((await post("/applications",{opportunityId:saved.body.opportunityId},otherCookie)).response.status,404)
    const started=await post("/applications",{opportunityId:saved.body.opportunityId},cookie)
    assert.equal(started.response.status,201)
    assert.ok(started.body.applicationId)
    assert.equal((await post("/applications",{opportunityId:saved.body.opportunityId},cookie)).response.status,409)
    const updatedList=await call("/opportunities",{headers:{cookie}})
    assert.equal(updatedList.body.opportunities.find((item:any)=>item.OpportunityId===saved.body.opportunityId).ApplicationId,started.body.applicationId)
    assert.equal((await call("/applications",{headers:{cookie}})).body.applications.length,2)
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
    assert.equal((await call("/profile",{headers:{cookie:adminCookie}})).response.status,200)
    for(const path of ["/dashboard","/opportunities","/applications","/notifications","/jobs?q=datos","/job-offers"])
      assert.equal((await call(path,{headers:{cookie:adminCookie}})).response.status,403,`ADMIN ${path}`)
    assert.equal((await post("/opportunities",{companyName:"X",jobTitle:"Y"},adminCookie)).response.status,403)
    const published=await post("/job-offers",{jobTitle:"Analista de datos",companyName:"Empresa",
      requirementsSummary:"SQL y Python",sourceName:"Portal",sourceUrl:"https://example.test/empleo"},adminCookie)
    assert.equal(published.response.status,201)
    const offers=await call("/job-offers",{headers:{cookie}})
    assert.equal(offers.response.status,200)
    assert.equal(offers.body.offers[0].JobTitle,"Analista de datos")
    assert.equal((await call("/admin/users",{headers:{cookie}})).response.status,403)
    assert.equal((await call("/admin/users",{headers:{cookie:adminCookie}})).response.status,200)
    assert.equal((await call("/admin/audit",{headers:{cookie:adminCookie}})).response.status,200)
    const companyA=await post("/admin/organizations",{name:"Empresa A"},adminCookie)
    const companyB=await post("/admin/organizations",{name:"Empresa B"},adminCookie)
    assert.equal(companyA.response.status,201)
    assert.equal(companyB.response.status,201)
    const otherId=other.body.user.userId
    assert.equal((await post(`/admin/organizations/${companyA.body.organizationId}/recruiters`,{userId:otherId},cookie)).response.status,403)
    assert.equal((await post(`/admin/organizations/${companyA.body.organizationId}/recruiters`,{userId:otherId},adminCookie)).response.status,201)
    assert.equal((await call("/recruiter/context",{headers:{cookie:otherCookie}})).response.status,401)
    const recruiter=await post("/auth/login",{email:"otro@example.test",password:"Segura123456A"})
    const recruiterCookie=recruiter.response.headers.get("set-cookie")?.split(";")[0]
    assert.ok(recruiterCookie)
    assert.ok(recruiter.body.user.roles.includes("RECRUITER"))
    assert.equal((await call("/profile",{headers:{cookie:recruiterCookie}})).response.status,200)
    for(const path of ["/dashboard","/opportunities","/applications","/notifications","/jobs?q=datos","/job-offers"])
      assert.equal((await call(path,{headers:{cookie:recruiterCookie}})).response.status,403,`RECRUITER ${path}`)
    assert.equal((await post("/applications",{opportunityId:saved.body.opportunityId},recruiterCookie)).response.status,403)
    const offerInput={jobTitle:"Analista",companyName:"Nombre falsificado",requirementsSummary:"SQL",
      sourceName:"Portal",sourceUrl:"https://example.test/analista"}
    const ownOffer=await post("/job-offers",offerInput,recruiterCookie)
    assert.equal(ownOffer.response.status,201)
    const managed=await call("/job-offers/manage",{headers:{cookie:recruiterCookie}})
    assert.equal(managed.body.offers.length,1)
    assert.equal(managed.body.offers[0].CompanyName,"Empresa A")
    assert.equal((await post("/auth/register",{email:"rrhh-b@example.test",password:"Segura123456A",
      firstName:"Rosa",lastName:"Perez"})).response.status,201)
    const bId=(await db.query<{userid:string}>(`SELECT userid FROM sec.users WHERE email='rrhh-b@example.test'`)).rows[0].userid
    assert.equal((await post(`/admin/organizations/${companyB.body.organizationId}/recruiters`,{userId:bId},adminCookie)).response.status,201)
    const recruiterB=await post("/auth/login",{email:"rrhh-b@example.test",password:"Segura123456A"})
    const bCookie=recruiterB.response.headers.get("set-cookie")?.split(";")[0]
    assert.ok(bCookie)
    const offerB=await post("/job-offers",{...offerInput,jobTitle:"Otro puesto"},bCookie)
    assert.equal(offerB.response.status,201)
    assert.equal((await call("/job-offers/manage",{headers:{cookie:recruiterCookie}})).body.offers.length,1)
    assert.equal((await call(`/job-offers/${offerB.body.jobOfferId}`,{method:"PUT",body:JSON.stringify(offerInput),
      headers:{cookie:recruiterCookie}})).response.status,404)
    assert.equal((await call(`/job-offers/${offerB.body.jobOfferId}/active`,{method:"PATCH",
      body:JSON.stringify({isActive:false}),headers:{cookie:recruiterCookie}})).response.status,404)
    assert.equal((await call("/recruiter/submissions",{headers:{cookie:adminCookie}})).response.status,403)
    assert.equal((await post(`/job-offers/${ownOffer.body.jobOfferId}/apply`,{},cookie)).response.status,400)
    assert.equal((await post(`/job-offers/${ownOffer.body.jobOfferId}/apply`,{consent:true},cookie)).response.status,201)
    assert.equal((await post(`/job-offers/${ownOffer.body.jobOfferId}/apply`,{consent:true},cookie)).response.status,409)
    const inboxA=await call("/recruiter/submissions",{headers:{cookie:recruiterCookie}})
    assert.equal(inboxA.body.submissions.length,1)
    assert.equal(inboxA.body.submissions[0].ApplicantEmail,user.email)
    assert.equal((await call("/recruiter/submissions",{headers:{cookie:bCookie}})).body.submissions.length,0)
    assert.equal((await call("/applications",{headers:{cookie:recruiterCookie}})).response.status,403)
    assert.equal((await call(`/applications/${opportunity.body.applicationId}`,{headers:{cookie:recruiterCookie}})).response.status,403)
    assert.equal((await post(`/job-offers/${ownOffer.body.jobOfferId}/apply`,{consent:true},recruiterCookie)).response.status,403)
    assert.equal((await call(`/job-offers/${ownOffer.body.jobOfferId}/application`,{method:"DELETE",headers:{cookie}})).response.status,204)
    assert.equal((await call("/recruiter/submissions",{headers:{cookie:recruiterCookie}})).body.submissions.length,0)
    assert.equal((await call(`/admin/organizations/${companyB.body.organizationId}/recruiters/${bId}`,
      {method:"DELETE",headers:{cookie:adminCookie}})).response.status,204)
    assert.equal((await call("/recruiter/context",{headers:{cookie:bCookie}})).response.status,401)
    const afterRevoke=await post("/auth/login",{email:"rrhh-b@example.test",password:"Segura123456A"})
    const candidateCookie=afterRevoke.response.headers.get("set-cookie")?.split(";")[0]
    assert.ok(candidateCookie)
    assert.equal(afterRevoke.body.user.roles.includes("RECRUITER"),false)
    assert.equal((await call("/dashboard",{headers:{cookie:candidateCookie}})).response.status,200)
    for (let attempt=0;attempt<30;attempt++)
      assert.equal((await fetch(`http://127.0.0.1:${address.port}/ready`)).status,200)
    assert.equal((await fetch(`http://127.0.0.1:${address.port}/ready`)).status,429)
  }finally{
    await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()))
    await db.close()
  }
})
