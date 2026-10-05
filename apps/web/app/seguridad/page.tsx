"use client"
import { useState, type FormEvent } from "react"
import {
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react"
import { PostulaShell } from "@/components/postula-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiClientError, apiRequest } from "@/lib/api-client"

export default function SeguridadPage() {
  const [saving, setSaving] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)

    const currentPassword = String(
      formData.get("currentPassword") ?? ""
    )
    const newPassword = String(formData.get("newPassword") ?? "")
    const confirmation = String(formData.get("confirmation") ?? "")

    setError("")
    setSuccess("")

    if (newPassword !== confirmation) {
      setError("Las contraseñas nuevas no coinciden.")
      return
    }

    if (newPassword === currentPassword) {
      setError("La contraseña nueva debe ser diferente de la actual.")
      return
    }

    const validPassword =
      newPassword.length >= 12 &&
      newPassword.length <= 128 &&
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /[0-9]/.test(newPassword)

    if (!validPassword) {
      setError(
        "La contraseña nueva debe tener entre 12 y 128 caracteres, una mayúscula, una minúscula y un número."
      )
      return
    }

    setSaving(true)

    try {
      const response = await apiRequest<{ message: string }>(
        "/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmation,
          }),
        }
      )

      form.reset()
      setShowPasswords(false)
      setSuccess(response.message)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(
          err.status === 429
            ? "Has realizado demasiados intentos. Espera 15 minutos antes de volver a intentarlo."
            : err.message
        )
      } else {
        setError(
          "No se pudo conectar con el servidor. Inténtalo nuevamente."
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const passwordType = showPasswords ? "text" : "password"

  return (
    <PostulaShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-7 md:py-8">
        <section className="mb-7">
          <p className="mb-1 text-sm font-medium text-cyan-700">
            Tu cuenta
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Seguridad y privacidad
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Actualiza tu contraseña y conoce cómo cuidar el acceso a
            tu cuenta.
          </p>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="border-b border-slate-100 pb-5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <KeyRound className="size-5 text-cyan-700" />
                Cambiar contraseña
              </CardTitle>

              <p className="text-sm leading-6 text-slate-500">
                Por seguridad, debes ingresar tu contraseña actual.
                Al guardar el cambio, se cerrarán las otras sesiones
                de tu cuenta.
              </p>
            </CardHeader>

            <CardContent className="px-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <fieldset disabled={saving} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">
                      Contraseña actual
                    </Label>

                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={passwordType}
                      autoComplete="current-password"
                      maxLength={128}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">
                      Nueva contraseña
                    </Label>

                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={passwordType}
                      autoComplete="new-password"
                      minLength={12}
                      maxLength={128}
                      aria-describedby="passwordRequirements"
                      required
                      className="h-11"
                    />

                    <p
                      id="passwordRequirements"
                      className="text-xs leading-5 text-slate-500"
                    >
                      Usa entre 12 y 128 caracteres e incluye una
                      mayúscula, una minúscula y un número.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmation">
                      Confirmar nueva contraseña
                    </Label>

                    <Input
                      id="confirmation"
                      name="confirmation"
                      type={passwordType}
                      autoComplete="new-password"
                      minLength={12}
                      maxLength={128}
                      required
                      className="h-11"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-pressed={showPasswords}
                    onClick={() =>
                      setShowPasswords((current) => !current)
                    }
                    className="px-0 text-slate-600"
                  >
                    {showPasswords ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}

                    {showPasswords
                      ? "Ocultar contraseñas"
                      : "Mostrar contraseñas"}
                  </Button>
                </fieldset>

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700"
                  >
                    {error}
                  </p>
                )}

                {success && (
                  <p
                    role="status"
                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-700"
                  >
                    {success}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={saving}
                  className="h-11 w-full rounded-xl bg-slate-950 text-white"
                >
                  <LockKeyhole className="size-4" />
                  {saving ? "Guardando…" : "Actualizar contraseña"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="size-5 text-cyan-700" />
                  Privacidad de tus postulaciones
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 px-6 text-sm leading-6 text-slate-600">
                <p>
                  Tus oportunidades, postulaciones e historial están
                  asociados a tu cuenta.
                </p>

                <p>
                  Otros usuarios no pueden consultar tus registros
                  privados desde sus cuentas.
                </p>

                <p>
                  El rol de administrador no concede automáticamente
                  acceso a las postulaciones personales de los demás
                  usuarios.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LockKeyhole className="size-5 text-cyan-700" />
                  Cuida tu cuenta
                </CardTitle>
              </CardHeader>

              <CardContent className="px-6">
                <ul className="list-disc space-y-3 pl-5 text-sm leading-6 text-slate-600">
                  <li>
                    Usa una contraseña exclusiva para PostulaTrack.
                  </li>

                  <li>
                    No compartas tu contraseña con otras personas.
                  </li>

                  <li>
                    Cierra sesión si utilizas una computadora
                    compartida.
                  </li>

                  <li>
                    Cambia tu contraseña si sospechas que alguien
                    más la conoce.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PostulaShell>
  )
}