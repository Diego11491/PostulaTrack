import { Router } from "express"
import { query } from "../../database/pool.js"
import { authenticate, requireRole } from "../../middleware/security.js"
import { AppError, asyncHandler } from "../../shared/http.js"

export const recruiterRouter=Router()
recruiterRouter.use(authenticate,requireRole("RECRUITER"))

async function organization(userId:string) {
  const rows=await query(`SELECT o.organizationid,o.name AS "Name" FROM app.organizationmembers m
    JOIN app.organizations o ON o.organizationid=m.organizationid AND o.isactive=true
    WHERE m.userid=$1`,[userId])
  if(!rows.length) throw new AppError(403,"NO_ORGANIZATION","La cuenta no tiene una organización activa asignada.")
  return rows[0]
}

recruiterRouter.get("/context",asyncHandler(async(req,res)=>{
  res.json({organization:await organization(req.user!.userId)})
}))

recruiterRouter.get("/submissions",asyncHandler(async(req,res)=>{
  const org=await organization(req.user!.userId)
  const submissions=await query(`SELECT a.submissionid,a.jobofferid,a.applicantname,a.applicantemail,
    a.consentatutc,j.jobtitle FROM app.recruiterapplications a
    JOIN app.joboffers j ON j.jobofferid=a.jobofferid AND j.organizationid=$1
    WHERE a.organizationid=$1 AND a.withdrawnatutc IS NULL
    ORDER BY a.consentatutc DESC LIMIT 100`,[org.OrganizationId])
  res.json({submissions})
}))
