# ADR-006 · PostgreSQL y fronteras de despliegue

**Estado:** aceptada para este incremento, 2026-10-07. Sustituye ADR-001 y ADR-002 en lo referente al motor SQL Server; conserva el criterio de producto modular.

PostgreSQL 15+ en Supabase se usa en esta fase y permite evaluar después Azure Database for PostgreSQL. `apps/web` y `apps/api` siguen en un monorepo, pero son procesos y despliegues independientes. La web solo usa `/api`; el proxy conoce la URL interna, Express posee sesiones y autorización, y PostgreSQL conserva estado e historial. La API usa `pg` con consultas parametrizadas y transacciones. No se introduce Supabase Auth ni acceso directo del navegador a las tablas.

Consecuencias: los scripts SQL Server de `database/` son históricos; el esquema vigente está en `database/postgres/`. Si hay datos SQL Server existentes, su traspaso requiere trabajo y pruebas separados. Las reglas del producto, ML y chatbot no se deducen de los contratos Zod; se acuerdan en especificaciones y se cierran con evidencia.
