import { Router } from "express"
import { z } from "zod"
import { query } from "../../database/pool.js"
import {
  authenticate,
  requireRole,
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
  sourcename,sourceurl,publishedon,closingon,isactive,createdatutc,updatedatutc FROM app.joboffers`
jobOffersRouter.get("/",asyncHandler(async(_req,res)=>{
  const offers=await query(`${select} WHERE isactive=true AND (closingon IS NULL OR closingon >=
    (now() AT TIME ZONE 'America/Lima')::date) ORDER BY createdatutc DESC,jobofferid DESC`)
  res.json({offers})
}))
jobOffersRouter.get("/manage",requireRole("ADMIN"),asyncHandler(async(_req,res)=>{
  const offers=await query(`${select} ORDER BY createdatutc DESC,jobofferid DESC`)
  res.json({offers})
}))
jobOffersRouter.post("/",requireRole("ADMIN"),asyncHandler(async(req,res)=>{
  const input=parseOffer(req.body)
  const rows=await query(`INSERT INTO app.joboffers(${fields},createdbyuserid)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING jobofferid`,
    [...values(input),req.user!.userId])
  res.status(201).json({jobOfferId:rows[0].JobOfferId,message:"Oferta registrada correctamente."})
}))
jobOffersRouter.put("/:id",requireRole("ADMIN"),asyncHandler(async(req,res)=>{
  const id=getId(req.params.id),input=parseOffer(req.body)
  const rows=await query(`UPDATE app.joboffers SET jobtitle=$1,companyname=$2,sector=$3,location=$4,
    workmode=$5,requirementssummary=$6,sourcename=$7,sourceurl=$8,publishedon=$9,closingon=$10,
    updatedatutc=now() WHERE jobofferid=$11 RETURNING jobofferid`,[...values(input),id])
  if(!rows.length) throw new AppError(404,"NOT_FOUND","No se encontró la oferta.")
  res.json({message:"Oferta actualizada correctamente."})
}))
jobOffersRouter.patch("/:id/active",requireRole("ADMIN"),asyncHandler(async(req,res)=>{
  const id=getId(req.params.id)
  const parsed=z.object({isActive:z.boolean()}).safeParse(req.body)
  if(!parsed.success) throw new AppError(400,"VALIDATION_ERROR","Debes indicar si la oferta estará activa.")
  const rows=await query(`UPDATE app.joboffers SET isactive=$1,updatedatutc=now()
    WHERE jobofferid=$2 RETURNING jobofferid`,[parsed.data.isActive,id])
  if(!rows.length) throw new AppError(404,"NOT_FOUND","No se encontró la oferta.")
  res.json({message:parsed.data.isActive?"Oferta activada.":"Oferta desactivada."})
}))
