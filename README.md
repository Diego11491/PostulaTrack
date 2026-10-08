# PostulaTrack

Plataforma para organizar oportunidades y seguir postulaciones con historial verificable. **Esta versión usa PostgreSQL 15+** y puede conectarse a Supabase, PostgreSQL local o Azure Database for PostgreSQL. La web Next.js y la API Express son procesos independientes dentro de un monorepo npm; PostgreSQL es la fuente de verdad. No se ha desplegado esta revisión en Supabase ni en Azure.

## Estado del producto

Implementado en código: registro y sesión propia, perfil, empresas y oportunidades personales, postulaciones con historial, ADMIN para cuentas y ofertas publicadas, cambio de contraseña y búsqueda opcional por Jooble. La migración `003_recruitment.sql` habilita empresas, asignación controlada de RECRUITER y candidaturas consentidas separadas del seguimiento personal. Las pantallas de Agenda y Empresas contienen datos de ejemplo; documentos tienen solo metadatos en el esquema. ML para afinidad de ofertas y chatbot de seguimiento son **fases exigidas del proyecto aún no implementadas**. Ver [estado y evidencia](docs/07-ESTADO-Y-EVIDENCIA.md) y [plan](docs/16-PLAN-FUENTE-DE-VERDAD.md).

## Puesta en marcha de una base nueva

1. Crear una base PostgreSQL 15+ (Supabase: crear proyecto y copiar la cadena **Session pooler** desde *Connect*; usa el puerto que muestre el panel). La cadena de conexión se guarda **solo en la API**.
2. Ejecutar `database/postgres/001_schema.sql` sobre una base vacía desde el editor SQL de Supabase o `psql`, después `database/postgres/003_recruitment.sql` y finalmente `database/postgres/002_verify.sql`. En una base ya instalada ejecutar solo `003` y verificar con `002`. **No ejecutar los `.sql` antiguos de la raíz `database/`: son SQL Server legado.**
3. Copiar `.env.example` a `.env`; sustituir `DATABASE_URL`. Para PostgreSQL local sin TLS: `DATABASE_SSL=false`. Para Supabase/Azure: `DATABASE_SSL=true`. Si la verificación TLS falla por certificado raíz no reconocido, descargarlo del proveedor y configurar `DATABASE_CA_CERT_FILE` en `.env` (ver `database/postgres/README.md`). Nunca subir `.env` a Git ni poner la cadena en variables `NEXT_PUBLIC_`.
4. Ejecutar `npm ci`, `npm run typecheck`, `npm test`, `npm run build` y `npm run dev`. Web: <http://localhost:3000>; API: <http://localhost:4000/health>; `/ready` verifica también PostgreSQL.
5. Crear la primera cuenta USER desde `/registro`. Crear ADMIN con `npm run admin:create -- --email ... --password ... --first-name ... --last-name ...` solo en un equipo controlado. El argumento de contraseña puede quedar en el historial del shell: sustituiremos este bootstrap en la fase de credenciales.

Para probar RR. HH.: una persona se registra como USER; ADMIN comprueba su vínculo con la empresa, crea la organización y la asigna desde `/admin`. Esa cuenta vuelve a iniciar sesión y encuentra `/reclutamiento`. Las ofertas antiguas de ADMIN no se convierten automáticamente en ofertas de una empresa. Solo candidaturas enviadas expresamente a una oferta de RECRUITER llegan a su bandeja.

La navegación y el inicio están separados por rol: postulante `/`, ADMIN `/admin` y RR. HH. `/reclutamiento`. ADMIN usa cuentas, empresas, ofertas y auditoría; RR. HH. usa candidaturas y ofertas de su organización. Mi cuenta y Seguridad son comunes. Express devuelve 403 si ADMIN o RECRUITER intentan usar endpoints personales de postulante, incluso cuando la cuenta de RR. HH. conserva USER durante la asignación. No hace falta otra migración para esta separación.

La web utiliza `/api` bajo el mismo origen. En desarrollo, Next.js lo redirige a la API local. En hosting, configurar `API_INTERNAL_URL` **en el servidor web** con la URL HTTPS de Express sin `/api`, y `WEB_ORIGIN` en la API con el origen HTTPS exacto de la web. La API acepta `PORT` del proveedor o `API_PORT` local. No configurar `NEXT_PUBLIC_API_URL`.

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` | Inicia web y API por separado. |
| `npm test` | Pruebas aisladas e integración PostgreSQL embebida, sin conexión a Supabase. |
| `npm run typecheck` | Contratos, API y web. |
| `npm run build` | Compilación de los tres workspaces. |
| `npm run admin:create -- ...` | Crea el primer ADMIN. |

## Límites de esta migración

El esquema nuevo prepara una **base vacía**. Si hay información real en SQL Server, no ejecutar una importación improvisada: exportar, mapear IDs/fechas/hashes, importar en un entorno de ensayo, comprobar recuentos, relaciones e historial, y planificar el corte. Las sesiones activas se pueden invalidar y exigir nuevo inicio de sesión. No hay evidencia todavía de ese traslado de datos ni de un despliegue vivo. Ver [plan y fuente de verdad](docs/16-PLAN-FUENTE-DE-VERDAD.md).
