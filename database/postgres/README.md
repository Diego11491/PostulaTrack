# PostgreSQL vigente

`001_schema.sql` instala **una base nueva vacía** PostgreSQL 15+; `002_verify.sql` comprueba catálogo, tabla de ofertas y conciliación del historial. No mezclar con los `.sql` de SQL Server situados en el directorio padre.

Supabase: crear proyecto, abrir SQL Editor, ejecutar `001` una sola vez y después `002`. Copiar desde Connect la URL de **Session pooler** a `DATABASE_URL` del backend, con TLS (`DATABASE_SSL=true`), manteniéndola fuera de Git. También funciona en Azure Database for PostgreSQL con una URL de conexión equivalente; probar TLS y permisos.

La siguiente modificación de esquema debe usar un archivo `003_...sql`, registrar versión en `meta.schema_migrations`, probar instalación limpia y actualización con datos preexistentes. Si ya hay datos SQL Server, diseñar una importación independiente; este esquema no realiza conversión de datos.
