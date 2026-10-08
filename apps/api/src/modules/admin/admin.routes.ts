import { adminUserStatusSchema } from "@postulatrack/contracts"
import { Router } from "express"
import { z } from "zod"
import { query, transaction } from "../../database/pool.js"
import { authenticate, requireRole } from "../../middleware/security.js"
import { AppError, asyncHandler } from "../../shared/http.js"
export const adminRouter=Router()
adminRouter.use(authenticate,requireRole("ADMIN"))
adminRouter.get("/users",asyncHandler(async(_req,res)=>{
  const users=await query(`SELECT u.userid,u.email,p.firstname,p.lastname,u.isactive,u.createdatutc,
    string_agg(r.name,',') AS "Roles",max(o.name) AS "OrganizationName",
    max(o.organizationid) AS "OrganizationId" FROM sec.users u JOIN app.profiles p USING(userid)
    JOIN sec.userroles ur USING(userid) JOIN sec.roles r USING(roleid)
    LEFT JOIN app.organizationmembers m ON m.userid=u.userid LEFT JOIN app.organizations o ON o.organizationid=m.organizationid
    GROUP BY u.userid,p.firstname,p.lastname ORDER BY u.createdatutc DESC LIMIT 200`)
  res.json({users})
}))
adminRouter.get("/organizations",asyncHandler(async(_req,res)=>{
  const organizations=await query(`SELECT o.organizationid,o.name AS "Name",o.isactive,
    count(m.userid)::int AS "Recruiters" FROM app.organizations o
    LEFT JOIN app.organizationmembers m ON m.organizationid=o.organizationid
    GROUP BY o.organizationid ORDER BY o.name`)
  res.json({organizations})
}))
adminRouter.post("/organizations",asyncHandler(async(req,res)=>{
  const parsed=z.object({name:z.string().trim().min(2).max(180)}).safeParse(req.body)
  if(!parsed.success) throw new AppError(400,"VALIDATION_ERROR","Ingresa el nombre de la organización.")
  try {
    const rows=await query(`INSERT INTO app.organizations(name,createdbyuserid) VALUES($1,$2)
      RETURNING organizationid`,[parsed.data.name,req.user!.userId])
    res.status(201).json({organizationId:rows[0].OrganizationId})
  } catch(error:any) {
    if(error?.code==="23505") throw new AppError(409,"ORGANIZATION_EXISTS","La organización ya existe.")
    throw error
  }
}))
adminRouter.post("/organizations/:id/recruiters",asyncHandler(async(req,res)=>{
  const id=Number(req.params.id)
  const parsed=z.object({userId:z.string().uuid()}).safeParse(req.body)
  if(!Number.isSafeInteger(id)||id<1||!parsed.success) throw new AppError(400,"VALIDATION_ERROR","Organización o usuario no válido.")
  try { await transaction(async client=>{
    const org=await query(`SELECT 1 FROM app.organizations WHERE organizationid=$1 AND isactive=true`,[id],client)
    if(!org.length) throw new AppError(404,"ORGANIZATION_NOT_FOUND","Organización no encontrada.")
    const member=await query(`SELECT u.userid FROM sec.users u JOIN sec.userroles ur ON ur.userid=u.userid
      JOIN sec.roles r ON r.roleid=ur.roleid AND r.name='USER'
      WHERE u.userid=$1 AND u.isactive=true AND NOT EXISTS
      (SELECT 1 FROM sec.userroles x JOIN sec.roles ar ON ar.roleid=x.roleid AND ar.name='ADMIN' WHERE x.userid=u.userid)`,[parsed.data.userId],client)
    if(!member.length) throw new AppError(400,"INVALID_RECRUITER","Selecciona una cuenta USER activa que no sea ADMIN.")
    const assigned=await query(`SELECT organizationid FROM app.organizationmembers WHERE userid=$1 FOR UPDATE`,[parsed.data.userId],client)
    if(assigned.length) throw new AppError(409,"ALREADY_ASSIGNED","Esta cuenta ya está asignada a una organización.")
    await query(`INSERT INTO app.organizationmembers(userid,organizationid,assignedbyuserid) VALUES($1,$2,$3)`,
      [parsed.data.userId,id,req.user!.userId],client)
    await query(`INSERT INTO sec.userroles(userid,roleid) SELECT $1,roleid FROM sec.roles WHERE name='RECRUITER'`,
      [parsed.data.userId],client)
    await query(`UPDATE sec.sessions SET revokedatutc=now() WHERE userid=$1 AND revokedatutc IS NULL`,[parsed.data.userId],client)
    await query(`INSERT INTO audit.auditlog(userid,actioncode,entitytype,entityid,resultcode,detailsjson)
      VALUES($1,'RECRUITER_ASSIGNED','User',$2,'SUCCESS',$3::jsonb)`,
      [req.user!.userId,parsed.data.userId,JSON.stringify({organizationId:id})],client)
  }) } catch(error:any) {
    if(error?.code==="23505") throw new AppError(409,"ALREADY_ASSIGNED","Esta cuenta ya está asignada a una organización.")
    throw error
  }
  res.status(201).json({message:"Reclutador asignado. Debe iniciar sesión nuevamente."})
}))
adminRouter.delete("/organizations/:id/recruiters/:userId",asyncHandler(async(req,res)=>{
  const id=Number(req.params.id)
  const parsed=z.string().uuid().safeParse(req.params.userId)
  if(!Number.isSafeInteger(id)||id<1||!parsed.success) throw new AppError(400,"INVALID_ID","Organización o usuario no válido.")
  await transaction(async client=>{
    const rows=await query(`DELETE FROM app.organizationmembers WHERE organizationid=$1 AND userid=$2
      RETURNING userid`,[id,parsed.data],client)
    if(!rows.length) throw new AppError(404,"NOT_FOUND","No se encontró esa asignación.")
    await query(`DELETE FROM sec.userroles WHERE userid=$1 AND roleid=(SELECT roleid FROM sec.roles WHERE name='RECRUITER')`,[parsed.data],client)
    await query(`UPDATE sec.sessions SET revokedatutc=now() WHERE userid=$1 AND revokedatutc IS NULL`,[parsed.data],client)
    await query(`INSERT INTO audit.auditlog(userid,actioncode,entitytype,entityid,resultcode,detailsjson)
      VALUES($1,'RECRUITER_REVOKED','User',$2,'SUCCESS',$3::jsonb)`,
      [req.user!.userId,parsed.data,JSON.stringify({organizationId:id})],client)
  })
  res.status(204).send()
}))
adminRouter.patch("/users/:id/status",asyncHandler(async(req,res)=>{
  const parsed=adminUserStatusSchema.safeParse(req.body)
  if(!parsed.success) throw new AppError(400,"VALIDATION_ERROR","Estado no válido.")
  if(req.params.id===req.user!.userId&&!parsed.data.isActive) throw new AppError(400,"SELF_DISABLE","No puedes desactivar tu propia cuenta.")
  if(!/^[0-9a-f-]{36}$/i.test(String(req.params.id))) throw new AppError(400,"INVALID_ID","Usuario no válido.")
  await transaction(async client=>{
    const updated=await query(`UPDATE sec.users SET isactive=$1,updatedatutc=now()
      WHERE userid=$2 RETURNING userid`,[parsed.data.isActive,req.params.id],client)
    if(!updated.length) throw new AppError(404,"USER_NOT_FOUND","Usuario no encontrado.")
    if(!parsed.data.isActive) await query(`UPDATE sec.sessions SET revokedatutc=now()
      WHERE userid=$1 AND revokedatutc IS NULL`,[req.params.id],client)
    await query(`INSERT INTO audit.auditlog(userid,actioncode,entitytype,entityid,resultcode,detailsjson)
      VALUES($1,'ACCOUNT_STATUS_CHANGED','User',$2,'SUCCESS',$3::jsonb)`,
      [req.user!.userId,req.params.id,JSON.stringify({isActive:parsed.data.isActive})],client)
  })
  res.json({message:parsed.data.isActive?"Cuenta activada.":"Cuenta desactivada."})
}))
adminRouter.get("/audit",asyncHandler(async(_req,res)=>{
  const events=await query(`SELECT a.auditid,a.actioncode,a.entitytype,a.entityid,a.resultcode,
    a.ipaddress,a.createdatutc,u.email FROM audit.auditlog a LEFT JOIN sec.users u USING(userid)
    ORDER BY a.createdatutc DESC LIMIT 200`)
  res.json({events})
}))
