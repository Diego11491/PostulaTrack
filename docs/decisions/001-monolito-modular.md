> **Nota de versión (2026-10-07):** este documento describe decisiones o evidencias de la etapa SQL Server. Para la arquitectura, instalación y estado vigentes usa `README.md`, `docs/01-arquitectura.md`, `docs/07-ESTADO-Y-EVIDENCIA.md` y `docs/16-PLAN-FUENTE-DE-VERDAD.md`. No ejecutes scripts SQL Server en PostgreSQL.

# ADR-001 · Producto web con API modular

**Estado:** aceptada para el MVP. **Fecha:** 2026-10-04.

## Contexto

La operación principal guarda una postulación y sus cambios; la profesora valora una solución clara al problema del postulante. La carga actual y un equipo académico no justifican operar muchos servicios independientes.

## Decisión

Conservar un monorepo con Next.js para experiencia web, Express organizado por módulos, contratos Zod compartidos y SQL Server relacional. Mantener la lógica de autorización en la API y la transición de estado en una transacción SQL.

## Consecuencias

Entrega y depuración más sencillas; la API puede crecer por módulos. La escala debe medirse: paginación, índices, pool y pruebas de concurrencia antes de rediseñar. Una posible separación futura se decide por un cuello de botella medido y una responsabilidad operativa definida, no por el tamaño del diagrama.
