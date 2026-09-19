import { Database, KeyRound, LockKeyhole, ShieldCheck, UserCog } from "lucide-react"
import { PageHeading } from "@/components/page-heading"
import { PostulaShell } from "@/components/postula-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const controls = [
  { icon: KeyRound, title: "Contraseñas derivadas", detail: "bcrypt con costo 12; nunca se almacena la contraseña original." },
  { icon: LockKeyhole, title: "Sesión protegida", detail: "Token opaco en cookie HttpOnly, SameSite y Secure en producción." },
  { icon: UserCog, title: "Autorización", detail: "Dos roles y validación del propietario en cada consulta privada." },
  { icon: Database, title: "Acceso a datos", detail: "Consultas parametrizadas, baja lógica y cuenta SQL de mínimo privilegio." },
]

export default function SeguridadPage() {
  return <PostulaShell><div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-7 md:py-8"><PageHeading title="Seguridad de la cuenta" description="Controles activos en el incremento actual y mejoras previstas antes de producción." /><div className="mb-5 grid gap-4 sm:grid-cols-2">{controls.map(({ icon: Icon, title, detail }) => <Card key={title} className="border-slate-200 bg-white"><CardContent className="flex gap-4 px-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="size-5" /></span><div><div className="flex items-center gap-2"><p className="font-semibold text-slate-900">{title}</p><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Activo</Badge></div><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p></div></CardContent></Card>)}</div><Card className="border-slate-200 bg-white"><CardHeader className="border-b border-slate-100 pb-4"><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4.5 text-cyan-700" />Antes de producción</CardTitle></CardHeader><CardContent className="px-6"><ul className="grid gap-3 text-sm leading-6 text-slate-600 sm:grid-cols-2"><li>• HTTPS obligatorio y secretos en Key Vault.</li><li>• MFA para administradores.</li><li>• Recuperación de contraseña verificada.</li><li>• Alertas y monitoreo con Application Insights.</li><li>• Pruebas OWASP y análisis de dependencias.</li><li>• Copias de seguridad y pruebas de restauración.</li></ul></CardContent></Card></div></PostulaShell>
}
