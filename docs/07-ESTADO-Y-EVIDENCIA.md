# Estado y evidencia · migración PostgreSQL (2026-10-07)

| Capacidad | Estado del código | Verificación pendiente |
|---|---|---|
| Cuenta, perfil, sesión y ADMIN | Adaptados a `pg`; sesión propia en `sec.sessions` | Probar contra Supabase real, cookies HTTPS, cambio de contraseña y rol ADMIN. |
| Oportunidad, postulación e historial | Transacción PostgreSQL con bloqueo de fila y auditoría | Concurrencia, rollback, dos cuentas y datos trasladados desde SQL Server si existen. |
| Ofertas ADMIN | Tabla y rutas PostgreSQL | CRUD por rol, paginación y carga. |
| Jooble | Adaptador independiente del motor SQL | Clave real y límite de consultas. |
| Agenda y empresas visuales | Datos de ejemplo | API y persistencia funcional. |
| Documentos | Metadatos de base, sin archivos | Almacenamiento privado y autorización. |
| ML y chatbot | Plan de fases | Implementación y evaluación. |
| Hosting | Proxy `/api` configurado | Despliegue real y verificación en navegador. |

## Evidencia ejecutada en esta revisión

- `npm run typecheck`: PASS (contratos, API, web).
- `npm test`: PASS; cinco archivos de prueba, diez casos, incluido PostgreSQL embebido. La prueba de integración crea dos usuarios, cambia estado, comprueba historial y rechaza relaciones entre dueños.
- `database/postgres/001_schema.sql` y `002_verify.sql`: PASS en PostgreSQL embebido.
- `npm run build`: PASS en entorno con permiso para el puerto interno de Turbopack. El primer intento restringido falló por ese permiso, no por TypeScript.
- Supabase remoto y datos SQL Server existentes: **NO PROBADOS**. No registrar como completado en Jira hasta adjuntar salida con fecha y commit.

Plantilla de evidencia: fecha, commit, entorno, caso, pasos, esperado, observado, resultado y responsable. No subir credenciales, cookies ni datos reales de estudiantes.
