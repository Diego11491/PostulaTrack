# Estado real y puertas de salida

**Corte:** ZIP entregado el 4 de octubre de 2026 más este patch. «Implementado en código» no significa validado contra SQL Server local ni desplegado.

| Capacidad | Estado observado | Evidencia en el repositorio | Qué falta probar o construir |
|---|---|---|---|
| Registro, sesión, bloqueo y rol | Implementado en código | `apps/api/src/modules/auth/`, `middleware/security.ts`, `database/001_schema.sql` | Prueba de integración en SQL Server y navegador. |
| Búsqueda externa de empleos | Implementado en código, condicionado a clave regional | `modules/jobs/`, `app/empleos/` | Prueba de extremo a extremo con clave válida y sin gastar consultas innecesarias; no se probó Jooble en vivo. |
| Perfil propio | Implementado en código | `modules/profile/`, `app/perfil/` | Verificación funcional. |
| Crear oportunidad y proceso opcional | Implementado en código | `modules/opportunities/`, `app/oportunidades/nueva/` | Prueba de rollback, duplicados y validación de URL. |
| Tablero e historial de estado | Implementado en código | `modules/applications/`, `app/postulaciones/`, `app.ChangeApplicationStatus` | Prueba de concurrencia y casos terminales. |
| Panel administrativo de cuentas | Implementado en código | `modules/admin/`, `app/admin/` | Demostrar que ADMIN no lee procesos ajenos. |
| Indicadores del tablero | Básicos; definición revisable | `modules/dashboard/dashboard.routes.ts` | Reemplazar `progressRate` provisional; medir correctamente pendientes y vencidos. |
| Agenda y recordatorios | UI de ejemplo; tabla preparada | `app/agenda/page.tsx`, `database/001_schema.sql` (`app.Activities`) | API, asociación por propietario, edición, completado, agenda real y, después, notificación. |
| Empresas | UI con datos fijos | `app/empresas/page.tsx`, `lib/demo-data.ts` | API y consultas reales o retirar la pantalla de la demo. |
| Documentos | Solo estructura de metadatos | `app.Documents` | Almacenamiento privado, permisos, validación, UX. |
| Azure y alta disponibilidad | Diseño opcional | `docs/05-despliegue-azure.md` | Despliegue, presupuesto y prueba; no afirmar que existe. |
| CI | Configuración de validación | `.github/workflows/ci.yml` | Confirmar ejecución verde en el repositorio remoto. Hay pruebas aisladas de búsqueda; faltan pruebas de integración de dominio con SQL Server. |

## Puertas para afirmar «funciona»

1. `npm ci`, `npm run typecheck`, `npm run build` con salida guardada.
2. `database/001_schema.sql` y `002_verify_installation.sql` ejecutados en SQL Server de pruebas.
3. Navegador con dos usuarios: cada uno ve solo sus datos; ADMIN gestiona accesos sin abrir sus postulaciones.
4. Oportunidad → postulación → cambio de estado → historial tras recargar; error SQL provocado en ambiente de pruebas no deja estado e historial desalineados.
5. Pantallas que aparecen en la demo consumen la API o están rotuladas como prototipo.

`database/004_verify_traceability.sql` devuelve una muestra de discrepancias y ahora
detiene la verificación con el error `51011` si alguna postulación activa tiene
un estado distinto al último registro de su historial. Ejecutarlo en SQL Server
después de instalar `003_owner_integrity.sql`; conservar la salida como evidencia.
La API ordena ese historial por `HistoryId DESC`, para que dos cambios dentro
del mismo segundo mantengan un orden estable.

## Plantilla breve de evidencia

| Fecha | Entorno y versión | Escenario | Comando/pasos | Esperado | Observado | Resultado | Responsable |
|---|---|---|---|---|---|---|---|
| Por completar | Por completar | Por completar | Por completar | Por completar | Por completar | PENDIENTE | Por completar |

## Evidencia técnica de este patch (2026-10-04)

| Escenario | Resultado observado | Alcance |
|---|---|---|
| `npm ci` | PASS | Dependencias desde lockfile actualizado. |
| `npm test` | PASS: cuatro pruebas del adaptador Jooble | Simulación local; no consume API real ni SQL Server. |
| `npm run typecheck` | PASS | Contratos, API y web. |
| `npm run build` | PASS; ruta `/empleos` generada | No prueba consultas a Jooble ni SQL Server. |
| `npm audit --omit=dev --audit-level=high` | PASS: 0 vulnerabilidades reportadas tras actualizar Next.js | Resultado puntual, no certificación de seguridad. |
| CodeQL | PENDIENTE | Workflow añadido para repo público; necesita ejecución en GitHub. |

No guardar contraseñas, sesiones, correos reales ni volcados de usuarios en las evidencias. Una captura solo demuestra el escenario visible; no valida todos los controles de seguridad ni un SLA.

## Incremento 004: interfaz y trazabilidad

El botón para mostrar/ocultar contraseña está en registro y acceso. `/ready` consulta SQL; el pool se recupera después de una conexión fallida. `003_owner_integrity.sql` propone restricciones compuestas para el dueño y el código registra auditoría para creación/archivo; estos últimos cambios **no están comprobados aún contra la instancia SQL Server del equipo**. Los diagramas separan estado actual de extensiones futuras en [modelo de datos](14-MODELO-DE-DATOS-Y-AUDITORIA.md).

Validación en una copia local: `npm test`, `npm run typecheck`, `npm run build` y `git diff --check` superados; la prueba con puerto SQL deliberadamente cerrado confirmó que un siguiente `getPool()` crea un intento nuevo. El intento inicial de build en el entorno restringido falló porque Turbopack no podía abrir un puerto interno; la compilación posterior en un entorno que sí permite ese puerto terminó correctamente. Falta ejecución de las migraciones, prueba de dos propietarios, acceso por teclado y verificación en navegador.
