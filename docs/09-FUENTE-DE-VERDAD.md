# Fuente de verdad de los datos

| Dato | Fuente autoritativa | Vista derivada |
|---|---|---|
| Cuenta, roles y sesiones | `sec.users`, `sec.userroles`, `sec.sessions` | Identidad entregada por `/auth/me`. |
| Empresas y oportunidades personales | `app.companies`, `app.opportunities` | Listado propio. |
| Ofertas publicadas por ADMIN | `app.joboffers` | Catálogo público para cuentas autenticadas. No es una postulación personal. |
| Estado actual | `app.applications.currentstatusid` | Tarjeta del tablero. |
| Secuencia de cambios | `app.applicationstatushistory` | Historial cronológico y métricas futuras. |
| Auditoría | `audit.auditlog` | Revisión administrativa. |
| Agenda y documentos | Tablas `app.activities` y `app.documents` | Interfaz todavía no conectada; no presentar como funcional. |

La transacción de cambio de estado conserva estado, historial y auditoría juntos. `database/postgres/002_verify.sql` detecta divergencias. Las fechas se guardan en `timestamptz`; el navegador las presenta en la zona del usuario. Los datos ficticios de la UI no son fuente de verdad. El contrato Zod valida entradas HTTP, pero no define por sí solo el alcance del producto ni sustituye historias, ADR y pruebas.
