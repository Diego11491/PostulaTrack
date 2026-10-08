"use client"

import Link from "next/link"
import { Bell, CalendarDays, Clock3 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { apiRequest } from "@/lib/api-client"

type Notice = {
  Id: string
  Kind: "ACTION" | "DEADLINE"
  Title: string
  Detail: string
  DueAtUtc: string
  Href: string
}
type NoticeResponse = { total: number; notifications: Notice[] }

export function NotificationsPopover() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<NoticeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      setData(await apiRequest<NoticeResponse>("/notifications"))
    } catch {
      setData(null)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  return (
    <Popover open={open} onOpenChange={value => {
      setOpen(value)
      if (value) void refresh()
    }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-9 rounded-lg text-slate-600 hover:bg-slate-100" aria-label={`Notificaciones: ${data?.total ?? 0} avisos pendientes`}>
          <Bell className="size-5" />
          {!!data?.total && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold leading-5 text-slate-950" aria-hidden="true">{data.total > 99 ? "99+" : data.total}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-xl">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-slate-950">Notificaciones</h2>
          <p className="text-xs text-slate-500">Acciones pendientes y fechas límite de los próximos 7 días · hora de Lima</p>
        </div>
        <div className="max-h-[min(26rem,60vh)] overflow-y-auto">
          {loading && <p role="status" className="p-5 text-sm text-slate-500">Cargando avisos…</p>}
          {!loading && error && <div className="p-5 text-sm text-slate-600"><p>No se pudieron cargar los avisos.</p><button type="button" onClick={() => void refresh()} className="mt-2 font-semibold text-cyan-700 underline">Reintentar</button></div>}
          {!loading && !error && data?.total === 0 && <p className="p-5 text-sm text-slate-500">No tienes acciones pendientes ni fechas límite próximas.</p>}
          {!loading && !error && data?.notifications.map(item => {
            const overdue = item.Kind === "ACTION" && new Date(item.DueAtUtc).getTime() < Date.now()
            const date = new Intl.DateTimeFormat("es-PE", {
              dateStyle: "medium",
              ...(item.Kind === "ACTION" ? { timeStyle: "short" as const } : {}),
              timeZone: "America/Lima",
            }).format(new Date(item.DueAtUtc))
            return <Link key={item.Id} href={item.Href} onClick={() => setOpen(false)} className="flex gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none">
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${overdue ? "bg-amber-50 text-amber-700" : "bg-cyan-50 text-cyan-700"}`}>
                {item.Kind === "ACTION" ? <Clock3 className="size-4" /> : <CalendarDays className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-cyan-700">{item.Kind === "ACTION" ? overdue ? "Acción vencida" : "Próxima acción" : "Cierre de oportunidad"}</span>
                <span className="block truncate text-sm font-semibold text-slate-900">{item.Title}</span>
                <span className="block truncate text-xs text-slate-500">{item.Detail} · {date}</span>
              </span>
            </Link>
          })}
        </div>
        {!loading && !error && !!data && data.total > data.notifications.length && <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">Mostrando {data.notifications.length} de {data.total} avisos.</p>}
      </PopoverContent>
    </Popover>
  )
}
