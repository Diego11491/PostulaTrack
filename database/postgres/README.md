# PostgreSQL vigente

`001_schema.sql` instala **una base nueva vacía** PostgreSQL 15+; `002_verify.sql` comprueba catálogo, tabla de ofertas y conciliación del historial. No mezclar con los `.sql` de SQL Server situados en el directorio padre.

Supabase: crear proyecto, abrir SQL Editor, ejecutar `001` una sola vez y después `002`. Copiar desde Connect la URL de **Session pooler** a `DATABASE_URL` del backend, con TLS (`DATABASE_SSL=true`), manteniéndola fuera de Git. También funciona en Azure Database for PostgreSQL con una URL de conexión equivalente; probar TLS y permisos.

**Actualización para reclutamiento:** sobre la base ya instalada ejecuta `003_recruitment.sql` una vez en SQL Editor y vuelve a ejecutar `002_verify.sql`. `003` añade organizaciones, asignaciones de reclutadores, relación de ofertas y candidaturas consentidas. No borra ofertas ni seguimientos anteriores. Al instalar desde cero: `001`, `003`, `002`, en ese orden. Reinicia la API después de aplicar la migración; las nuevas rutas la requieren.

Si Node muestra `SELF_SIGNED_CERT_IN_CHAIN`, descarga el certificado raíz de **Database Settings → SSL Configuration** para ese proyecto. Guárdalo fuera de Git y añade en el `.env` del backend `DATABASE_CA_CERT_FILE=C:/ruta/absoluta/al/certificado.crt` (sin comillas; adapta la ruta real). Reinicia `npm run dev` por completo y prueba `/ready` y el inicio de sesión. La API lee el certificado y conserva la comprobación de cadena **y nombre de host** (`rejectUnauthorized: true`). Para una solución temporal en la consola que ejecuta `npm run dev`, también puede usarse `$env:NODE_EXTRA_CA_CERTS = 'C:\ruta\al\certificado.crt'` antes de arrancar Node; la variable no persiste al abrir otra consola. No pongas `NODE_TLS_REJECT_UNAUTHORIZED=0` ni el certificado en el repositorio.

La siguiente modificación de esquema debe usar un archivo `004_...sql`, registrar versión en `meta.schema_migrations`, probar instalación limpia y actualización con datos preexistentes. Si ya hay datos SQL Server, diseñar una importación independiente; este esquema no realiza conversión de datos.
