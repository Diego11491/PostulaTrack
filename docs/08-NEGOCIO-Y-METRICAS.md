> **Nota de versión (2026-10-07):** este documento describe decisiones o evidencias de la etapa SQL Server. Para la arquitectura, instalación y estado vigentes usa `README.md`, `docs/01-arquitectura.md`, `docs/07-ESTADO-Y-EVIDENCIA.md` y `docs/16-PLAN-FUENTE-DE-VERDAD.md`. No ejecutes scripts SQL Server en PostgreSQL.

# Negocio, hipótesis y métricas

## Actor y resultado

El usuario busca conseguir entrevistas sin perder seguimiento ni contexto. PostulaTrack aporta **organización y continuidad** de una búsqueda; no garantiza contratación ni «predice» a qué oferta lo aceptarán. La universidad podría evaluar la solución como herramienta de acompañamiento, pero no se asume adopción institucional.

## Hipótesis comprobables

| Hipótesis | Prueba de bajo costo | Criterio propuesto, no resultado |
|---|---|---|
| Tener una siguiente acción visible reduce olvidos | 5 a 8 usuarios intentan gestionar varios procesos con y sin agenda; observar tareas vencidas | Menos tareas olvidadas en PostulaTrack que en su método previo. |
| El historial ahorra tiempo al retomar un proceso | Pedir al usuario que reconstruya qué pasó y cuándo | Menor tiempo mediano y menos errores de reconstrucción. |
| Una vista única ayuda a priorizar | Entrevistas y test de tareas con postulaciones de prueba | El usuario identifica la próxima acción correcta sin ayuda. |

No publicar cifras de impacto hasta medirlas. Registrar tamaño de muestra, fecha, tareas, línea base, definición de éxito y limitaciones.

## Indicadores del producto

| Indicador | Definición propuesta | Fuente | Frecuencia |
|---|---|---|---|
| Procesos activos | Postulaciones propias no eliminadas con estado no terminal | `app.Applications` + `app.ApplicationStatuses` | Al cargar el panel. |
| Acciones vencidas | Acciones propias no completadas con `DueAtUtc < ahora UTC` | `app.Activities` cuando se implemente API | Al cargar el panel. |
| Acciones próximas | Acciones propias no completadas entre ahora UTC y 7 días | `app.Activities` cuando se implemente API | Al cargar el panel. |
| Tasa de avance a entrevista | Procesos creados en una cohorte que alguna vez llegaron a `INTERVIEW` o etapa posterior de selección / procesos creados en esa cohorte × 100 | Historial; especificar tratamiento de `REJECTED` y `WITHDRAWN` | Semanal/mensual por cohorte. |
| Días hasta primera respuesta | Mediana entre `SENT` y el primer estado de respuesta posterior, únicamente para procesos con ambas fechas | Historial | Mensual. |
| Integridad del historial | Procesos con estado actual consistente con último evento de historial / procesos analizados × 100 | SQL Server | Por despliegue. |

**Precaución:** `progressRate` hoy calcula proporción de procesos no terminales cuyo `SortOrder >= 40`. Eso no mide tasa de entrevista ni tasa de contratación, y el orden de estados terminales no equivale a una escala de éxito. `PendingActions` hoy incluye `NextActionAtUtc` anterior a mañana, por lo que mezcla vencidas con próximas. Hasta cambiar y validar las consultas, rotular estos valores como indicadores provisionales; no usarlos como evidencia de mejora.

## Valor para un eventual patrocinador

La historia defendible es reducción de pérdida de seguimiento y visibilidad del recorrido; la arquitectura respalda esto con trazabilidad, autorización por propietario y una sola fuente de datos. Si se desea explotar indicadores institucionales, se requiere consentimiento, propósito definido, agregación y reglas de privacidad antes de cualquier tablero para terceros. ADMIN no recibe acceso libre a datos laborales privados.
