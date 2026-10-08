# Base de datos vigente · PostgreSQL

El esquema vigente está en `database/postgres/001_schema.sql`; la comprobación en `002_verify.sql`. Los scripts `database/001_schema.sql` a `006_job-offers.sql` son un historial **SQL Server** que no se ejecuta contra PostgreSQL. `meta.schema_migrations` registra la versión inicial. Las siguientes modificaciones deberán ser archivos numerados, idempotentes cuando corresponda, con prueba de actualización y de instalación limpia.

`sec` contiene usuarios, roles y sesiones; `app` perfiles, empresas, oportunidades privadas, ofertas públicas de ADMIN, postulaciones, historial y estructuras futuras; `audit` guarda eventos; `meta` controla migraciones. Las relaciones compuestas `(id, owneruserid)` impiden que documentos, actividades y procesos apunten a registros de otro dueño. Los índices responden a consultas concretas; futuras optimizaciones requieren `EXPLAIN (ANALYZE, BUFFERS)` y carga representativa, no añadir índices sin medir.

El cambio de estado se realiza en una transacción de la API con `SELECT ... FOR UPDATE`: actualiza estado, agrega historial y auditoría, o revierte todo. `002_verify.sql` falla si un proceso activo no coincide con su último evento. La API sigue filtrando consultas privadas por `owneruserid`; la base impide referencias cruzadas.

Para mover datos existentes desde SQL Server: inventario y backup, exportación de tablas con relaciones, mapeo de IDs y fechas UTC, importación en ensayo, ajuste de secuencias, reconciliación de recuentos y de historial, prueba de dos usuarios y corte controlado. La migración de datos **no está realizada** por el esquema inicial.
