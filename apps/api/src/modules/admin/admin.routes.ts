import { adminUserStatusSchema } from "@postulatrack/contracts"
import { Router } from "express"
import { query, transaction } from "../../database/pool.js"
import { authenticate, requireRole } from "../../middleware/security.js"
import { AppError, asyncHandler } from "../../shared/http.js"
export const adminRouter=Router()
adminRouter.use(authenticate,requireRole("ADMIN"))
adminRouter.get("/users",asyncHandler(async(_req,res)=>{
  const users=await query(`SELECT u.userid,u.email,p.firstname,p.lastname,u.isactive,u.createdatutc,
    string_agg(r.name,',') AS "Roles" FROM sec.users u JOIN app.profiles p USING(userid)
    JOIN sec.userroles ur USING(userid) JOIN sec.roles r USING(roleid)
    GROUP BY u.userid,p.firstname,p.lastname ORDER BY u.createdatutc DESC LIMIT 200`)
  res.json({users})
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
