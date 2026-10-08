# Ruta futura a Azure · PostgreSQL

La primera etapa usa PostgreSQL compatible con Supabase y web/API como servicios independientes. Azure Database for PostgreSQL Flexible Server es una ruta posterior: la API cambia la cadena privada `DATABASE_URL`, conserva `pg` y ejecuta las mismas migraciones verificadas. La compatibilidad funcional, precio, región, red privada, TLS, backups y restauración se prueban antes de cortar tráfico. Esto no es evidencia de un despliegue Azure ya realizado.

Se puede alojar Next.js y Express por separado. El navegador debe llamar a `/api` sobre el origen web; Next.js redirige a Express mediante `API_INTERNAL_URL`. En la API se fija `WEB_ORIGIN` exactamente, se habilita HTTPS y se configura `TRUST_PROXY` solo tras verificar el proxy del proveedor. No exponer `DATABASE_URL` ni una clave de proveedor en el navegador. Probar registro, login, logout y cambio de contraseña con las cookies reales antes de una demo.
