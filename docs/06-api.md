# API HTTP · PostgreSQL

El navegador usa `/api` en el origen de la web. Next.js redirige la petición a Express. Las rutas protegidas usan la cookie HttpOnly propia de PostulaTrack. Los permisos se aplican en la API, nunca por un rol suministrado por el cliente.

| Ruta | Acceso | Uso |
|---|---|---|
| `POST /auth/register`, `POST /auth/login` | Público | Cuenta y sesión. |
| `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password` | Sesión | Gestión de identidad. |
| `GET/PUT /profile` | Sesión | Perfil propio. |
| `GET/POST/DELETE /opportunities` | Sesión | Oportunidades propias. |
| `GET/POST /applications`, `GET /applications/:id`, `POST /applications/:id/status` | Sesión | Procesos privados e historial. |
| `GET /dashboard` | Sesión | Indicadores derivados. |
| `GET /jobs` | Sesión | Jooble opcional. |
| `GET /job-offers` | Sesión | Catálogo de ofertas publicadas. |
| `GET /job-offers/manage`, `POST/PUT/PATCH /job-offers` | ADMIN | Publicar, editar o desactivar ofertas. |
| `GET /admin/users`, `PATCH /admin/users/:id/status`, `GET /admin/audit` | ADMIN | Soporte de cuentas. |

El listado masivo aún necesita paginación para la fase de rendimiento. La web no accede a PostgreSQL ni envía `DATABASE_URL`.
