# Seguridad de PostulaTrack

La aplicación conserva sesiones en `sec.sessions` dentro de PostgreSQL y utiliza cookies `HttpOnly`, `SameSite=Lax` y `Secure` en producción. El backend controla `WEB_ORIGIN`, valida entradas con Zod, verifica rol y propietario, y ejecuta consultas parametrizadas. El hash bcrypt protege la contraseña almacenada; no se cifra reversiblemente. La URL de la base y la clave Jooble nunca deben exponerse en Next.js como `NEXT_PUBLIC_`.

La conexión de producción a PostgreSQL debe usar TLS con certificado válido (`DATABASE_SSL=true`). En Supabase, los esquemas `sec`, `app` y `audit` son para acceso del backend; no conceder acceso directo al navegador. Crear un rol SQL de mínimo privilegio después de verificar las necesidades de lectura/escritura y separar la cuenta que instala migraciones de la cuenta de la API.

Quedan por probar formalmente: cookies en hosting HTTPS, acceso cruzado A/B, sesiones revocadas, limitación de intentos entre varias instancias, secretos, respaldo/restauración, CSRF/Origin y enlaces externos. Ver `docs/13-SEGURIDAD-Y-PRUEBAS.md`.
