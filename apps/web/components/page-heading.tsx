import { Button } from "@/components/ui/button"

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <header className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        {eyebrow && <p className="mb-1 text-sm font-semibold text-cyan-700">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-[-0.025em] text-slate-950 sm:text-[2rem]">{title}</h1>
        <p className="mt-2 max-w-2xl text-[0.98rem] leading-6 text-slate-600">{description}</p>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  )
}

export function PrimaryAction({ children, ...props }: React.ComponentProps<typeof Button>) {
  return <Button size="lg" className="h-11 rounded-xl bg-slate-950 px-5 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800" {...props}>{children}</Button>
}
