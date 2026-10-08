import { registerSchema } from "@postulatrack/contracts"
import bcrypt from "bcryptjs"
import { query, transaction, closePool } from "../database/pool.js"
const argument=(name:string)=>{const index=process.argv.indexOf(`--${name}`);return index>=0?process.argv[index+1]:undefined}
const input=registerSchema.safeParse({email:argument("email"),password:argument("password"),
  firstName:argument("first-name")??"Administrador",lastName:argument("last-name")??"PostulaTrack"})
if(!input.success){console.error("Uso: npm run admin:create -- --email ... --password ...");process.exit(1)}
try{
  await transaction(async client=>{
    const hash=await bcrypt.hash(input.data.password,12)
    const rows=await query(`INSERT INTO sec.users(email,passwordhash,emailverified) VALUES($1,$2,true)
      RETURNING userid`,[input.data.email,hash],client)
    const id=rows[0].UserId
    await query(`INSERT INTO app.profiles(userid,firstname,lastname) VALUES($1,$2,$3)`,
      [id,input.data.firstName,input.data.lastName],client)
    await query(`INSERT INTO sec.userroles(userid,roleid) SELECT $1,roleid FROM sec.roles WHERE name='ADMIN'`,[id],client)
  })
  console.log(`Administrador creado: ${input.data.email}`)
}catch(error){console.error(error instanceof Error?error.message:error);process.exitCode=1}
finally{await closePool()}
