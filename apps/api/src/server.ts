import { createApp } from "./app.js"
import { env } from "./config/env.js"
import { closePool } from "./database/pool.js"

const server = createApp().listen(env.API_PORT, () => console.log(`API disponible en http://localhost:${env.API_PORT}`))

async function stop() {
  server.close(async () => {
    await closePool()
    process.exit(0)
  })
}

process.on("SIGINT", stop)
process.on("SIGTERM", stop)
