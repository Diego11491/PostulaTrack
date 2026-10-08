import type { ApplicationInput, StatusChangeInput } from "@postulatrack/contracts"
import { query, transaction } from "../../database/pool.js"
import { AppError } from "../../shared/http.js"
export async function listApplications(userId:string){
  return query(`SELECT a.applicationid,a.appliedon,a.nextaction,a.nextactionatutc,a.updatedatutc,
    s.code AS "StatusCode",s.displayname AS "StatusName",s.sortorder,
    o.opportunityid,o.jobtitle,o.workmode,o.location,c.name AS "CompanyName"
    FROM app.applications a JOIN app.applicationstatuses s ON s.statusid=a.currentstatusid
    JOIN app.opportunities o ON o.opportunityid=a.opportunityid AND o.owneruserid=$1
    JOIN app.companies c ON c.companyid=o.companyid AND c.owneruserid=$1
    WHERE a.owneruserid=$1 AND NOT a.isdeleted ORDER BY s.sortorder,a.updatedatutc DESC`,[userId])
}
export async function getApplication(userId:string,applicationId:number){
  const rows=await query(`SELECT a.applicationid,a.appliedon,a.nextaction,a.nextactionatutc,a.updatedatutc,
    s.code AS "StatusCode",s.displayname AS "StatusName",o.opportunityid,o.jobtitle,o.sourcename,
    o.sourceurl,o.workmode,o.location,o.notes,c.companyid,c.name AS "CompanyName",c.sector
    FROM app.applications a JOIN app.applicationstatuses s ON s.statusid=a.currentstatusid
    JOIN app.opportunities o ON o.opportunityid=a.opportunityid AND o.owneruserid=$1
    JOIN app.companies c ON c.companyid=o.companyid AND c.owneruserid=$1
    WHERE a.applicationid=$2 AND a.owneruserid=$1 AND NOT a.isdeleted`,[userId,applicationId])
  if(!rows.length) return null
  const history=await query(`SELECT h.historyid,prev.displayname AS "PreviousStatus",
    next.displayname AS "NewStatus",h.comment,h.changedatutc,p.firstname,p.lastname
    FROM app.applicationstatushistory h
    LEFT JOIN app.applicationstatuses prev ON prev.statusid=h.previousstatusid
    JOIN app.applicationstatuses next ON next.statusid=h.newstatusid
    JOIN app.profiles p ON p.userid=h.changedbyuserid
    JOIN app.applications a ON a.applicationid=h.applicationid AND a.owneruserid=$1
    WHERE h.applicationid=$2 ORDER BY h.historyid DESC`,[userId,applicationId])
  return {application:rows[0],history}
}
export async function createApplication(userId:string,input:ApplicationInput){
  return transaction(async client=>{
    const owned=await query(`SELECT 1 FROM app.opportunities WHERE opportunityid=$1 AND owneruserid=$2
      AND NOT isdeleted FOR UPDATE`,[input.opportunityId,userId],client)
    if(!owned.length) throw new AppError(404,"OPPORTUNITY_NOT_FOUND","No se encontró la oportunidad.")
    const existing=await query(`SELECT applicationid FROM app.applications
      WHERE opportunityid=$1 AND owneruserid=$2 AND NOT isdeleted`,[input.opportunityId,userId],client)
    if(existing.length) throw new AppError(409,"APPLICATION_EXISTS","Esta oportunidad ya tiene un proceso de seguimiento.")
    const rows=await query(`INSERT INTO app.applications
      (owneruserid,opportunityid,currentstatusid,appliedon,nextaction,nextactionatutc)
      SELECT $1,$2,statusid,$3,$4,$5 FROM app.applicationstatuses WHERE code='REGISTERED'
      RETURNING applicationid`,[userId,input.opportunityId,input.appliedOn??null,
        input.nextAction??null,input.nextActionAtUtc??null],client)
    const applicationId=rows[0].ApplicationId
    await query(`INSERT INTO app.applicationstatushistory(applicationid,previousstatusid,newstatusid,changedbyuserid,comment)
      SELECT $1,NULL,statusid,$2,'Proceso creado.' FROM app.applicationstatuses WHERE code='REGISTERED'`,
      [applicationId,userId],client)
    await query(`INSERT INTO audit.auditlog(userid,actioncode,entitytype,entityid,resultcode)
      VALUES($1,'APPLICATION_CREATED','Application',$2,'SUCCESS')`,[userId,String(applicationId)],client)
    return applicationId as number
  })
}
export async function changeStatus(userId:string,applicationId:number,input:StatusChangeInput,ip:string|null){
  return transaction(async client=>{
    const status=await query(`SELECT statusid FROM app.applicationstatuses WHERE code=$1 AND isactive=true`,
      [input.newStatusCode],client)
    if(!status.length) throw new AppError(400,"INVALID_STATUS","Estado no válido.")
    const current=await query(`SELECT currentstatusid FROM app.applications WHERE applicationid=$1
      AND owneruserid=$2 AND NOT isdeleted FOR UPDATE`,[applicationId,userId],client)
    if(!current.length) throw new AppError(404,"NOT_FOUND","Postulación no encontrada o acceso denegado.")
    const oldId=current[0].currentstatusid as number
    const newId=status[0].statusid as number
    if(oldId===newId) throw new AppError(409,"SAME_STATUS","El nuevo estado debe ser diferente del actual.")
    await query(`UPDATE app.applications SET currentstatusid=$1,updatedatutc=now()
      WHERE applicationid=$2 AND owneruserid=$3`,[newId,applicationId,userId],client)
    await query(`INSERT INTO app.applicationstatushistory(applicationid,previousstatusid,newstatusid,changedbyuserid,comment)
      VALUES($1,$2,$3,$4,$5)`,[applicationId,oldId,newId,userId,input.comment??null],client)
    await query(`INSERT INTO audit.auditlog(userid,actioncode,entitytype,entityid,resultcode,ipaddress,detailsjson)
      VALUES($1,'APPLICATION_STATUS_CHANGED','Application',$2,'SUCCESS',$3,$4::jsonb)`,
      [userId,String(applicationId),ip,JSON.stringify({previousStatusId:oldId,newStatusId:newId})],client)
  })
}
