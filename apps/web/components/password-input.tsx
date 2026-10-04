"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">

export function PasswordInput({ className = "", ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false)

  return <div className="relative">
    <Input
      {...props}
      type={visible ? "text" : "password"}
      className={`${className} pr-11`}
    />
    <button
      type="button"
      aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      aria-pressed={visible}
      title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      onClick={() => setVisible(value => !value)}
      className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
    >
      {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
    </button>
  </div>
}
