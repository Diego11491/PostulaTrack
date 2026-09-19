import { rm } from "node:fs/promises"

await Promise.all([
  rm("apps/api/dist", { recursive: true, force: true }),
  rm("apps/web/.next", { recursive: true, force: true }),
  rm("apps/web/tsconfig.tsbuildinfo", { force: true }),
  rm("packages/contracts/dist", { recursive: true, force: true }),
])
