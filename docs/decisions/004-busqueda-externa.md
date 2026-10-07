> **Nota de versión (2026-10-07):** este documento describe decisiones o evidencias de la etapa SQL Server. Para la arquitectura, instalación y estado vigentes usa `README.md`, `docs/01-arquitectura.md`, `docs/07-ESTADO-Y-EVIDENCIA.md` y `docs/16-PLAN-FUENTE-DE-VERDAD.md`. No ejecutes scripts SQL Server en PostgreSQL.

# ADR-004 · Ofertas externas con guardado explícito

**Estado:** aceptada para integración inicial. **Fecha:** 2026-10-04.

El usuario quiere encontrar ofertas además de registrar enlaces manuales. La API de Jooble Perú ofrece búsqueda regional con clave; la cuota gratuita es finita. El backend posee la clave y consulta un host fijo. El resultado externo se presenta con fuente y enlace; no se convierte en postulación ni altera SQL Server. Solo al pulsar «Guardar oportunidad» se crea un registro personal en el núcleo.

**Consecuencia:** buscar sin clave devuelve 503 controlado; la función puede probarse con respuesta simulada. Caché local y límites de tasa disminuyen consultas, aunque para varias instancias se requeriría coordinación compartida. Antes de lanzamiento se verifican términos y se resuelve deduplicación al guardar. [Contrato](../../specs/002-busqueda-empleos/spec.md).
