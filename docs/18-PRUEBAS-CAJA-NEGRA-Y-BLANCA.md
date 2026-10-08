# Pruebas automatizadas: caja negra y caja blanca

## Ejecución

Desde la raíz, con `npm ci` ya ejecutado:

```powershell
Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git rev-parse --short HEAD
npm run test:blackbox
npm run test:whitebox
```

`npm test` ejecuta ambos grupos y es el comando que usa CI. Una captura de la salida con fecha y commit sirve como evidencia de ejecución; guardar también el resultado de CI del mismo commit. No hace falta repetir cada historia manualmente para demostrar lo que estos casos ya comprueban.

## Caja negra: entradas y respuestas HTTP

`npm run test:blackbox` levanta Express con PostgreSQL embebido (PGlite) y llama a la API como cliente. Los datos se preparan en una base temporal; las comprobaciones funcionales observan códigos y respuestas HTTP en `apps/api/src/database/http.integration.test.ts`.

| Caso | Flujo comprobado | Resultado esperado |
|---|---|---|
| CN-01 | Registro, inicio de sesión y lectura de perfil | 201, 200 y perfil propio. |
| CN-02 | Guardar oportunidad con o sin seguimiento; iniciar proceso y consultar tablero | Proceso creado solo cuando corresponde; duplicado 409. |
| CN-03 | Avisos de acción y cierre de plazo para dos cuentas | Cada cuenta ve solo sus avisos. |
| CN-04 | Acceso al proceso ajeno y cambio de estado | Acceso ajeno 404; estado propio actualizado. |
| CN-05 | Usuario, administrador y reclutador en sus espacios | Accesos fuera del rol 403; ofertas del reclutador limitadas a su organización. |
| CN-06 | Candidatura con consentimiento, repetición, bandeja de RR. HH. y retiro | Sin consentimiento 400, envío 201, repetición 409; retiro 204 y deja de aparecer. |
| CN-07 | Operación sin token CSRF y con token incorrecto; disponibilidad de base | Rechazo 403; `/ready` llega a 429 al superar 30 solicitudes/minuto. |

El archivo HTTP contiene un flujo largo con múltiples aserciones y se informa como **una prueba integrada** en el contador de Node. La tabla desglosa sus escenarios, no afirma siete pruebas independientes.

## Caja blanca: reglas y ramas internas

`npm run test:whitebox` ejecuta `security.test.ts`, `jobs.service.test.ts`, `profile.contract.test.ts`, `shared/http.test.ts` y `postgres.integration.test.ts`.

| Caso | Código inspeccionado | Ramas comprobadas |
|---|---|---|
| CB-01 | `middleware/security.ts` | Origen válido/ausente/externo; CSRF correcto/ausente/incorrecto/otra sesión; USER frente a ADMIN y RECRUITER. |
| CB-02 | Contratos de perfil y búsqueda | Datos válidos frente a teléfono, año, página y parámetros inválidos. |
| CB-03 | Servicio de empleos Jooble | Sin clave, respuesta válida, enlace peligroso, caché y fallo externo sin exponer la clave. |
| CB-04 | `shared/http.ts` | Error de PostgreSQL convertido a 503 sin secretos y error de dominio conservado. |
| CB-05 | Esquema PostgreSQL e historial | Invariantes, propietario y cambio de estado atómico. |

## Alcance de la evidencia

Estas pruebas son automáticas y repetibles; usan PGlite y un servidor local, no la instancia Supabase. Para una entrega sobre el despliegue real, basta añadir una prueba breve en navegador de login, seguimiento y acceso por rol, con capturas. El rendimiento del frontend/backend y el TLS del hosting requieren mediciones aparte. Se trata de resultados de pruebas del equipo, no de una certificación externa.
