import { Router, type Request, type Response, type NextFunction } from "express"
import { z } from "zod"
import { query, transaction } from "../../database/pool.js"
import {
  authenticate,
  requireCandidate,
} from "../../middleware/security.js"
import { AppError, asyncHandler } from "../../shared/http.js"

export const jobOffersRouter = Router()

jobOffersRouter.use(authenticate)

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional()

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`)

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    )
  }, "La fecha no es válida.")
  .nullable()
  .optional()

const offerSchema = z
  .object({
    jobTitle: z.string().trim().min(1).max(180),
    companyName: z.string().trim().min(1).max(180),
    sector: optionalText(120),
    location: optionalText(180),
    workMode: z
      .enum(["HYBRID", "REMOTE", "ONSITE"])
      .nullable()
      .optional(),
    requirementsSummary: z.string().trim().min(1).max(2000),
    sourceName: z.string().trim().min(1).max(100),
    sourceUrl: z
      .string()
      .trim()
      .url()
      .max(1000)
      .refine(
        (value) => /^https?:\/\//i.test(value),
        "El enlace debe comenzar con http:// o https://."
      ),
    publishedOn: optionalDate,
    closingOn: optionalDate,
  })
  .refine(
    (data) =>
      !data.publishedOn ||
      !data.closingOn ||
      data.closingOn >= data.publishedOn,
    {
      path: ["closingOn"],
      message:
        "La fecha de cierre no puede ser anterior a la publicación.",
    }
  )

type OfferInput = z.infer<typeof offerSchema>

function getId(value: unknown): number {
  const id = Number(value)

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new AppError(
      400,
      "INVALID_ID",
      "El identificador de la oferta no es válido."
    )
  }

  return id
}

function parseOffer(body: unknown): OfferInput {
  const parsed = offerSchema.safeParse(body)

  if (!parsed.success) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Revisa los datos y las fechas de la oferta. El enlace debe ser una dirección http:// o https:// válida.",
      parsed.error.flatten()
    )
  }

  return parsed.data
}

function values(input: OfferInput) {
  return [input.jobTitle,input.companyName,input.sector||null,input.location||null,input.workMode??null,
    input.requirementsSummary,input.sourceName,input.sourceUrl,input.publishedOn??null,input.closingOn??null]
}
const fields = `jobtitle,companyname,sector,location,workmode,requirementssummary,sourcename,sourceurl,publishedon,closingon`
const select = `SELECT jobofferid,jobtitle,companyname,sector,location,workmode,requirementssummary,
  sourcename,sourceurl,publishedon,closingon,isactive,organizationid,createdatutc,updatedatutc FROM app.joboffers`
const canManage=(req:Request,_res:Response,next:NextFunction)=>
  req.user?.roles.some(role=>role==="ADMIN"||role==="RECRUITER")
    ? next() : next(new AppError(403,"FORBIDDEN","No tienes permisos."))
async function orgFor(req:Request) {
  if(req.user!.roles.includes("ADMIN")) return null
  const rows=await query(`SELECT o.organizationid,o.name AS "Name" FROM app.organizationmembers m
    JOIN app.organizations o ON o.organizationid=m.organizationid AND o.isactive=true
    WHERE m.userid=$1`,[req.user!.userId])
  if(!rows.length) throw new AppError(403,"NO_ORGANIZATION","No tienes una organización activa asignada.")
  return rows[0] as {OrganizationId:number;Name:string}
}
jobOffersRouter.get("/",requireCandidate,asyncHandler(async(req,res)=>{
  const offers=await query(`SELECT j.jobofferid,j.jobtitle,j.companyname,j.sector,j.location,j.workmode,
    j.requirementssummary,j.sourcename,j.sourceurl,j.publishedon,j.closingon,j.organizationid,
    EXISTS(SELECT 1 FROM app.recruiterapplications a WHERE a.jobofferid=j.jobofferid
      AND a.applicantuserid=$1 AND a.withdrawnatutc IS NULL) AS "HasApplied",
    EXISTS(SELECT 1 FROM app.recruiterapplications a WHERE a.jobofferid=j.jobofferid
      AND a.applicantuserid=$1 AND a.withdrawnatutc IS NOT NULL) AS "HasWithdrawn"
    FROM app.joboffers j WHERE j.isactive=true AND (j.closingon IS NULL OR j.closingon >=
    (now() AT TIME ZONE 'America/Lima')::date) ORDER BY j.createdatutc DESC,j.jobofferid DESC`,[req.user!.userId])
  res.json({offers})
}))
jobOffersRouter.get("/manage",canManage,asyncHandler(async(req,res)=>{
  const org=await orgFor(req)
  const offers=await query(`${select} ${org?"WHERE organizationid=$1":""} ORDER BY createdatutc DESC,jobofferid DESC`,
    org?[org.OrganizationId]:[])
  res.json({offers})
}))
jobOffersRouter.post("/",canManage,asyncHandler(async(req,res)=>{
  const input=parseOffer(req.body)
  const org=await orgFor(req)
  const rows=await query(`INSERT INTO app.joboffers(${fields},createdbyuserid,organizationid)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING jobofferid`,
    [...values({...input,companyName:org?.Name??input.companyName}),req.user!.userId,org?.OrganizationId??null])
  res.status(201).json({jobOfferId:rows[0].JobOfferId,message:"Oferta registrada correctamente."})
}))
jobOffersRouter.put("/:id",canManage,asyncHandler(async(req,res)=>{
  const id=getId(req.params.id),input=parseOffer(req.body)
  const org=await orgFor(req)
  const existing=await query(`SELECT j.organizationid,o.name AS "Name" FROM app.joboffers j
    LEFT JOIN app.organizations o ON o.organizationid=j.organizationid WHERE j.jobofferid=$1`,[id])
  if(!existing.length||org&&existing[0].OrganizationId!==org.OrganizationId)
    throw new AppError(404,"NOT_FOUND","No se encontró la oferta.")
  const company=existing[0].OrganizationId ? existing[0].Name : input.companyName
  const rows=await query(`UPDATE app.joboffers SET jobtitle=$1,companyname=$2,sector=$3,location=$4,
    workmode=$5,requirementssummary=$6,sourcename=$7,sourceurl=$8,publishedon=$9,closingon=$10,
    updatedatutc=now() WHERE jobofferid=$11 ${org?"AND organizationid=$12":""} RETURNING jobofferid`,
    [...values({...input,companyName:company}),id,...(org?[org.OrganizationId]:[])])
  if(!rows.length) throw new AppError(404,"NOT_FOUND","No se encontró la oferta.")
  res.json({message:"Oferta actualizada correctamente."})
}))
jobOffersRouter.patch("/:id/active",canManage,asyncHandler(async(req,res)=>{
  const id=getId(req.params.id)
  const org=await orgFor(req)
  const parsed=z.object({isActive:z.boolean()}).safeParse(req.body)
  if(!parsed.success) throw new AppError(400,"VALIDATION_ERROR","Debes indicar si la oferta estará activa.")
  const rows=await query(`UPDATE app.joboffers SET isactive=$1,updatedatutc=now()
    WHERE jobofferid=$2 ${org?"AND organizationid=$3":""} RETURNING jobofferid`,
    [parsed.data.isActive,id,...(org?[org.OrganizationId]:[])])
  if(!rows.length) throw new AppError(404,"NOT_FOUND","No se encontró la oferta.")
  res.json({message:parsed.data.isActive?"Oferta activada.":"Oferta desactivada."})
}))

jobOffersRouter.post("/:id/apply",requireCandidate,asyncHandler(async(req,res)=>{
  const id=getId(req.params.id)
  if(!z.object({consent:z.literal(true)}).safeParse(req.body).success)
    throw new AppError(400,"CONSENT_REQUIRED","Confirma qué datos compartirás con la organización.")
  try {
    const submissionId=await transaction(async client=>{
      const offers=await query(`SELECT j.organizationid FROM app.joboffers j
        JOIN app.organizations o ON o.organizationid=j.organizationid AND o.isactive=true
        WHERE j.jobofferid=$1 AND j.isactive=true
        AND NOT EXISTS(SELECT 1 FROM app.organizationmembers m WHERE m.userid=$2 AND m.organizationid=j.organizationid)
        AND (j.closingon IS NULL OR j.closingon >= (now() AT TIME ZONE 'America/Lima')::date)`,[id,req.user!.userId],client)
      if(!offers.length) throw new AppError(404,"NOT_FOUND","Oferta de reclutamiento no disponible.")
      const rows=await query(`INSERT INTO app.recruiterapplications
        (organizationid,jobofferid,applicantuserid,applicantname,applicantemail)
        SELECT $1,$2,u.userid,p.firstname||' '||p.lastname,u.email FROM sec.users u
        JOIN app.profiles p ON p.userid=u.userid WHERE u.userid=$3
        RETURNING submissionid`,[offers[0].OrganizationId,id,req.user!.userId],client)
      await query(`INSERT INTO audit.auditlog(userid,actioncode,entitytype,entityid,resultcode)
        VALUES($1,'CANDIDACY_SHARED','JobOffer',$2,'SUCCESS')`,[req.user!.userId,String(id)],client)
      return rows[0].SubmissionId
    })
    res.status(201).json({submissionId})
  }catch(error:any){
    if(error?.code==="23505") throw new AppError(409,"ALREADY_APPLIED","Ya enviaste o retiraste una candidatura a esta oferta.")
    throw error
  }
}))
jobOffersRouter.delete("/:id/application",requireCandidate,asyncHandler(async(req,res)=>{
  const id=getId(req.params.id)
  const rows=await query(`UPDATE app.recruiterapplications SET withdrawnatutc=now()
    WHERE jobofferid=$1 AND applicantuserid=$2 AND withdrawnatutc IS NULL RETURNING submissionid`,[id,req.user!.userId])
  if(!rows.length) throw new AppError(404,"NOT_FOUND","Candidatura activa no encontrada.")
  await query(`INSERT INTO audit.auditlog(userid,actioncode,entitytype,entityid,resultcode)
    VALUES($1,'CANDIDACY_WITHDRAWN','JobOffer',$2,'SUCCESS')`,[req.user!.userId,String(id)])
  res.status(204).send()
}))
