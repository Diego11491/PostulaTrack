import type { NextConfig } from "next"

// La URL privada de la API se resuelve en el servidor web; el navegador solo conoce /api.
const upstream = process.env.API_INTERNAL_URL ?? "http://localhost:4000"
const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${upstream}/api/:path*` }]
  },
}
export default nextConfig
