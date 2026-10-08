> **Nota de versión (2026-10-07):** este documento describe decisiones o evidencias de la etapa SQL Server. Para la arquitectura, instalación y estado vigentes usa `README.md`, `docs/01-arquitectura.md`, `docs/07-ESTADO-Y-EVIDENCIA.md` y `docs/16-PLAN-FUENTE-DE-VERDAD.md`. No ejecutes scripts SQL Server en PostgreSQL.

# ADR-003 · Azure condicionado al caso de uso

**Estado:** aceptada para el MVP. **Fecha:** 2026-10-04.

## Contexto

Existe un diseño Azure en `docs/05-despliegue-azure.md`, pero el producto todavía necesita completar seguimiento y medir valor con usuarios. Una suscripción y sus servicios generan costo y trabajo operativo.

## Decisión

Primero validar localmente web, API, SQL Server y la experiencia. Si el curso pide demo remota o se confirma la necesidad de disponibilidad continua, presupuestar y desplegar **una** plataforma coherente. No añadir multicloud ni exponer SQL Server local como sustituto del despliegue.

## Consecuencias

La arquitectura objetivo sigue documentada, pero ninguna capacidad cloud se reporta como terminada sin evidencia de recurso, configuración, seguridad, prueba extremo a extremo y costo. La decisión se revisa si la profesora exige acceso remoto o un piloto real.
