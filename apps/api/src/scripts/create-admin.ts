import { randomUUID } from "node:crypto"
import { registerSchema } from "@postulatrack/contracts"
import bcrypt from "bcryptjs"
import { getPool, sql } from "../database/pool.js"

const argument = (name: string) => {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const input = registerSchema.safeParse({
  email: argument("email"),
  password: argument("password"),
  firstName: argument("first-name") ?? "Administrador",
  lastName: argument("last-name") ?? "PostulaTrack",
})

if (!input.success) {
  console.error("Uso: npm run admin:create -- --email admin@correo.com --password ClaveSegura123 --first-name Admin --last-name Principal")
  process.exit(1)
}

const pool = await getPool()
const transaction = new sql.Transaction(pool)
await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE)

try {
  const id = randomUUID()
  const passwordHash = await bcrypt.hash(input.data.password, 12)
  const existing = await new sql.Request(transaction).input("Email", sql.NVarChar(254), input.data.email)
    .query("SELECT 1 FROM sec.Users WITH (UPDLOCK,HOLDLOCK) WHERE NormalizedEmail=UPPER(LTRIM(RTRIM(@Email)));")
  if (existing.recordset.length) throw new Error("Ya existe una cuenta con ese correo.")

  await new sql.Request(transaction)
    .input("UserId", sql.UniqueIdentifier, id)
    .input("Email", sql.NVarChar(254), input.data.email)
    .input("PasswordHash", sql.NVarChar(255), passwordHash)
    .input("FirstName", sql.NVarChar(80), input.data.firstName)
    .input("LastName", sql.NVarChar(120), input.data.lastName)
    .query(`
      INSERT sec.Users(UserId, Email, PasswordHash, EmailVerified) VALUES(@UserId, @Email, @PasswordHash, 1);
      INSERT app.Profiles(UserId, FirstName, LastName) VALUES(@UserId, @FirstName, @LastName);
      INSERT sec.UserRoles(UserId, RoleId) SELECT @UserId, RoleId FROM sec.Roles WHERE Name='ADMIN';
    `)
  await transaction.commit()
  console.log(`Administrador creado: ${input.data.email}`)
  process.exit(0)
} catch (error) {
  await transaction.rollback()
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
