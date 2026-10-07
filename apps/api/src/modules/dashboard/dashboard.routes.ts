import { Router } from "express"
import { query } from "../../database/pool.js"
import { authenticate } from "../../middleware/security.js"
import { asyncHandler } from "../../shared/http.js"
export const dashboardRouter=Router()
dashboardRouter.use(authenticate)
dashboardRouter.get("/",asyncHandler(async(req,res)=>{
  const id=req.user!.userId
  const [summary,recent,upcoming]=await Promise.all([
    query(`SELECT count(*)::int AS "ActiveProcesses",
      count(*) FILTER (WHERE s.code='INTERVIEW')::int AS "Interviews",
      count(*) FILTER (WHERE a.nextactionatutc IS NOT NULL AND a.nextactionatutc<now()+interval '1 day')::int AS "PendingActions",
      count(*) FILTER (WHERE s.sortorder>=40)::int AS "AdvancedProcesses"
      FROM app.applications a JOIN app.applicationstatuses s ON s.statusid=a.currentstatusid
      WHERE a.owneruserid=$1 AND NOT a.isdeleted AND NOT s.isterminal`,[id]),
    query(`SELECT a.applicationid,o.jobtitle,c.name AS "CompanyName",s.displayname AS "StatusName",a.updatedatutc
      FROM app.applications a JOIN app.applicationstatuses s ON s.statusid=a.currentstatusid
      JOIN app.opportunities o ON o.opportunityid=a.opportunityid AND o.owneruserid=a.owneruserid
      JOIN app.companies c ON c.companyid=o.companyid AND c.owneruserid=a.owneruserid
      WHERE a.owneruserid=$1 AND NOT a.isdeleted ORDER BY a.updatedatutc DESC LIMIT 5`,[id]),
    query(`SELECT activityid,title,activitytype,dueatutc,completedatutc FROM app.activities
      WHERE owneruserid=$1 AND completedatutc IS NULL AND dueatutc>=now()-interval '1 day'
      ORDER BY dueatutc LIMIT 5`,[id]),
  ])
  const m=summary[0]
  const active=Number(m.ActiveProcesses||0)
  res.json({metrics:{activeProcesses:active,interviews:Number(m.Interviews||0),
    pendingActions:Number(m.PendingActions||0),progressRate:active?Math.round(Number(m.AdvancedProcesses||0)*100/active):0},
    recent,upcoming})
}))
