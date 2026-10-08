# API HTTP · PostgreSQL

El navegador usa `/api` en el origen de la web. Next.js redirige la petición a Express. Las rutas protegidas usan la cookie HttpOnly propia de PostulaTrack. Los permisos se aplican en la API, nunca por un rol suministrado por el cliente.

| Ruta | Acceso | Uso |
|---|---|---|
| `POST /auth/register`, `POST /auth/login` | Público | Cuenta y sesión. |
| `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password` | Sesión | Gestión de identidad. |
| `GET/PUT /profile` | Sesión | Datos de la propia cuenta, comunes a los tres roles. |
| `GET/POST/DELETE /opportunities` | USER postulante | Oportunidades propias. |
| `GET/POST /applications`, `GET /applications/:id`, `POST /applications/:id/status` | USER postulante | Procesos privados e historial. |
| `GET /dashboard` | USER postulante | Indicadores derivados. |
| `GET /notifications` | USER postulante | Hasta 8 avisos de acciones pendientes y cierres de oportunidades, con total de pendientes. Se calculan solo con los registros del postulante; no hay lectura/marcado ni envío externo. |
| `GET /jobs` | USER postulante | Jooble opcional. |
| `GET /job-offers` | USER postulante | Catálogo de ofertas publicadas. |
| `GET /job-offers/manage`, `POST/PUT/PATCH /job-offers` | ADMIN | Publicar, editar o desactivar ofertas. |
| `GET /admin/organizations`, `POST /admin/organizations`, `POST /admin/organizations/:id/recruiters` | ADMIN | Verificar organización y asignar una cuenta USER existente a RR. HH.; invalida su sesión anterior. |
| `GET /recruiter/context`, `GET /recruiter/submissions` | RECRUITER | Nombre de empresa y candidaturas consentidas de sus propias ofertas. |
| `GET /job-offers/manage`, `POST/PUT/PATCH /job-offers` | RECRUITER | Gestionar únicamente ofertas de la organización asignada. |
| `POST /job-offers/:id/apply`, `DELETE /job-offers/:id/application` | USER postulante | Compartir expresamente nombre y correo con la empresa reclutadora, o retirar la candidatura. El seguimiento personal no se comparte. |
| `GET /admin/users`, `PATCH /admin/users/:id/status`, `GET /admin/audit` | ADMIN | Soporte de cuentas. |

El listado masivo aún necesita paginación para la fase de rendimiento. La web no accede a PostgreSQL ni envía `DATABASE_URL`.

`USER postulante` exige USER sin ADMIN ni RECRUITER. Una cuenta asignada a RR. HH. conserva USER en la base para recuperarlo tras la revocación, pero recibe 403 en todas las rutas personales mientras tenga RECRUITER. ADMIN recibe 403 en esas rutas. La navegación envía ADMIN a `/admin`, RECRUITER a `/reclutamiento` y al postulante a `/`; también evita abrir pantallas ajenas mediante URL directa.

Guardar una oportunidad con `createApplication: false` no crea un proceso. Desde «Mis oportunidades», «Iniciar seguimiento» envía `POST /applications` con `opportunityId` y abre el proceso creado. La API exige que la oportunidad sea del usuario y devuelve `409 APPLICATION_EXISTS` si ya existe un proceso activo para ella; así se evita duplicar el historial.
