import type { OpportunityInput } from "@postulatrack/contracts"
import { query, transaction } from "../../database/pool.js"

export async function listOpportunities(userId:string){
  return query(`SELECT o.opportunityid,o.jobtitle,o.sourcename,o.sourceurl,o.workmode,o.location,
    o.publishedon,o.closingon,o.notes,o.createdatutc,c.companyid,c.name AS "CompanyName",
    a.applicationid,s.code AS "ApplicationStatusCode",s.displayname AS "ApplicationStatus"
    FROM app.opportunities o JOIN app.companies c ON c.companyid=o.companyid AND c.owneruserid=$1
    LEFT JOIN app.applications a ON a.opportunityid=o.opportunityid AND a.owneruserid=$1 AND NOT a.isdeleted
    LEFT JOIN app.applicationstatuses s ON s.statusid=a.currentstatusid
    WHERE o.owneruserid=$1 AND NOT o.isdeleted ORDER BY o.createdatutc DESC`,[userId])
}
export async function createOpportunity(userId:string,input:OpportunityInput){
  return transaction(async client=>{
    // ON CONFLICT usa el índice único filtrado; dos solicitudes paralelas no duplican la empresa.
    const companies=await query(`INSERT INTO app.companies(owneruserid,name,sector) VALUES($1,$2,$3)
      ON CONFLICT (owneruserid,name) WHERE NOT isdeleted DO UPDATE SET name=EXCLUDED.name
      RETURNING companyid`,[userId,input.companyName,input.sector??null],client)
    const companyId=companies[0].CompanyId
    const opportunity=await query(`INSERT INTO app.opportunities
      (owneruserid,companyid,jobtitle,sourcename,sourceurl,workmode,location,publishedon,closingon,notes)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING opportunityid`,
      [userId,companyId,input.jobTitle,input.sourceName??null,input.sourceUrl||null,
        input.workMode??null,input.location??null,input.publishedOn??null,input.closingOn??null,input.notes??null],client)
    const opportunityId=opportunity[0].OpportunityId
    let applicationId:number|null=null
    if(input.createApplication){
      const applications=await query(`INSERT INTO app.applications(owneruserid,opportunityid,currentstatusid)
        SELECT $1,$2,statusid FROM app.applicationstatuses WHERE code='REGISTERED'
        RETURNING applicationid`,[userId,opportunityId],client)
      applicationId=applications[0].ApplicationId
      await query(`INSERT INTO app.applicationstatushistory(applicationid,previousstatusid,newstatusid,changedbyuserid,comment)
        SELECT $1,NULL,statusid,$2,'Proceso creado desde una oportunidad.'
        FROM app.applicationstatuses WHERE code='REGISTERED'`,[applicationId,userId],client)
    }
    await query(`INSERT INTO audit.auditlog(userid,actioncode,entitytype,entityid,resultcode)
      VALUES($1,'OPPORTUNITY_CREATED','Opportunity',$2,'SUCCESS')`,[userId,String(opportunityId)],client)
    if(applicationId!==null) await query(`INSERT INTO audit.auditlog(userid,actioncode,entitytype,entityid,resultcode)
      VALUES($1,'APPLICATION_CREATED','Application',$2,'SUCCESS')`,[userId,String(applicationId)],client)
    return {opportunityId,applicationId}
  })
}
export async function deleteOpportunity(userId:string,opportunityId:number){
  return transaction(async client=>{
    const rows=await query(`UPDATE app.opportunities SET isdeleted=true,updatedatutc=now()
      WHERE opportunityid=$1 AND owneruserid=$2 AND NOT isdeleted RETURNING opportunityid`,[opportunityId,userId],client)
    if(rows.length) await query(`INSERT INTO audit.auditlog(userid,actioncode,entitytype,entityid,resultcode)
      VALUES($1,'OPPORTUNITY_ARCHIVED','Opportunity',$2,'SUCCESS')`,[userId,String(opportunityId)],client)
    return rows.length>0
  })
}
