> **Nota de versión (2026-10-07):** este documento describe decisiones o evidencias de la etapa SQL Server. Para la arquitectura, instalación y estado vigentes usa `README.md`, `docs/01-arquitectura.md`, `docs/07-ESTADO-Y-EVIDENCIA.md` y `docs/16-PLAN-FUENTE-DE-VERDAD.md`. No ejecutes scripts SQL Server en PostgreSQL.

# ADR-002 · SQL Server y trazabilidad

**Estado:** aceptada para el MVP. **Fecha:** 2026-10-04.

## Contexto

La pantalla necesita mostrar estado actual y responder «qué cambió». Guardarlos por separado sin una transacción permitiría desacuerdos.

## Decisión

SQL Server mantiene los datos autoritativos. `app.Applications.CurrentStatusId` sirve para consulta rápida, `app.ApplicationStatusHistory` guarda la secuencia, y `app.ChangeApplicationStatus` actualiza ambos y registra auditoría en una transacción. Las métricas son lecturas derivadas; ni la web ni un archivo CSV son fuentes de verdad.

## Consecuencias

Hay que comprobar periódicamente consistencia entre estado actual e historial, probar rollback y definir retención. Para la agenda futura se usará `app.Activities` como candidato autoritativo, pero los campos `NextAction*` actuales requieren una migración explícita antes de declarar una fuente única.
