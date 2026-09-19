import { spawn } from "node:child_process"

const npmCli = process.env.npm_execpath

function runNpmScript(script) {
  if (npmCli) {
    return spawn(process.execPath, [npmCli, "run", script], {
      stdio: "inherit",
      env: process.env,
    })
  }

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm"
  return spawn(npmCommand, ["run", script], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  })
}

const children = [runNpmScript("dev:api"), runNpmScript("dev:web")]

function stop() {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM")
  }
}

for (const child of children) {
  child.on("error", (error) => {
    console.error("No se pudo iniciar un proceso de desarrollo:", error.message)
    stop()
    process.exitCode = 1
  })
}

process.on("SIGINT", stop)
process.on("SIGTERM", stop)
