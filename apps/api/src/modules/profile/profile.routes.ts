import { profileSchema } from "@postulatrack/contracts"
import { Router } from "express"
import { query } from "../../database/pool.js"
import { authenticate } from "../../middleware/security.js"
import { AppError, asyncHandler } from "../../shared/http.js"
export const profileRouter=Router()
profileRouter.use(authenticate)
profileRouter.get("/",asyncHandler(async(req,res)=>{
  const rows=await query(`SELECT firstname,lastname,phone,country,city,headline,professionalsummary,
    institution,career,graduationyear,updatedatutc FROM app.profiles WHERE userid=$1`,[req.user!.userId])
  if(!rows.length) throw new AppError(404,"PROFILE_NOT_FOUND","No se encontró el perfil.")
  res.json({profile:rows[0]})
}))
profileRouter.put("/",asyncHandler(async(req,res)=>{
  const parsed=profileSchema.safeParse(req.body)
  if(!parsed.success) throw new AppError(400,"VALIDATION_ERROR","Revisa los datos del perfil.",parsed.error.flatten())
  const p=parsed.data
  await query(`UPDATE app.profiles SET firstname=$2,lastname=$3,phone=$4,country=$5,city=$6,
    headline=$7,professionalsummary=$8,institution=$9,career=$10,graduationyear=$11,updatedatutc=now()
    WHERE userid=$1`,[req.user!.userId,p.firstName,p.lastName,p.phone??null,p.country??null,p.city??null,
      p.headline??null,p.professionalSummary??null,p.institution??null,p.career??null,p.graduationYear??null])
  res.json({message:"Perfil actualizado."})
}))
