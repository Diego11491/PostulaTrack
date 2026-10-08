# Seguridad de PostulaTrack

La aplicación conserva sesiones en `sec.sessions` dentro de PostgreSQL y utiliza cookies `HttpOnly`, `SameSite=Lax` y `Secure` en producción. El backend controla `WEB_ORIGIN`, valida entradas con Zod, verifica rol y propietario, y ejecuta consultas parametrizadas. El hash bcrypt protege la contraseña almacenada; no se cifra reversiblemente. La URL de la base y la clave Jooble nunca deben exponerse en Next.js como `NEXT_PUBLIC_`.

Para operaciones que modifican datos, el navegador envía `X-CSRF-Token` y la cookie legible `pt_csrf`. El servidor verifica ambos contra un HMAC ligado al token de sesión HttpOnly, además de comprobar `Origin`. Login y registro no requieren sesión previa y mantienen la comprobación de origen. `GET /api/auth/csrf` renueva la cookie para sesiones anteriores al cambio; al cerrar sesión se elimina. `/ready` tiene un límite propio de 30 solicitudes por minuto por IP; `/api` conserva su límite global. En despliegues con varias réplicas, utilizar un almacén compartido de límites.

La conexión de producción a PostgreSQL debe usar TLS con certificado válido (`DATABASE_SSL=true`). En Supabase, los esquemas `sec`, `app` y `audit` son para acceso del backend; no conceder acceso directo al navegador. Crear un rol SQL de mínimo privilegio después de verificar las necesidades de lectura/escritura y separar la cuenta que instala migraciones de la cuenta de la API.

Quedan por probar formalmente: cookies en hosting HTTPS, acceso cruzado A/B, sesiones revocadas, limitación de intentos entre varias instancias, secretos, respaldo/restauración y enlaces externos. La prueba HTTP embebida ya cubre rechazo de token CSRF ausente o incorrecto; repetir el flujo en hosting HTTPS. Ver `docs/13-SEGURIDAD-Y-PRUEBAS.md`.
