# Seguridad y pruebas · PostgreSQL

## Controles del código

- Contraseñas: hash bcrypt; no se recupera texto original. Las credenciales de PostgreSQL y Jooble solo pertenecen a la API.
- Sesión: token aleatorio en cookie HttpOnly; su SHA-256 y caducidad se guardan en `sec.sessions`. La API vuelve a consultar rol y cuenta activa.
- Autorización: ADMIN administra cuentas y ofertas publicadas; no obtiene permiso automático sobre las postulaciones privadas. Las consultas filtran por dueño y las claves compuestas impiden vínculos entre dueños.
- SQL: `pg` recibe texto fijo y parámetros `$1...$n`; no se forma SQL concatenando datos del usuario. Los enlaces externos se limitan a HTTP(S).
- Transporte: TLS de PostgreSQL debe estar activado para hosting y el certificado validado. `DATABASE_URL` permanece fuera de Git y fuera de variables `NEXT_PUBLIC_`.

## Evidencia por tipo

| Tipo | Escenarios mínimos | Registro |
|---|---|---|
| Unitarias | Validación de perfil, búsquedas y errores | Salida de `npm test`. |
| Integración | Esquema PostgreSQL, historial atómico, dueño A/B, rutas HTTP y rol ADMIN | Pruebas embebidas + repetición en Supabase. |
| Caja negra | Registro, login, oportunidad, postulación, cambio, historial, logout, cuenta ajena | Pasos/capturas con fecha, commit y entorno. |
| Caja blanca | Ramas de sesión, autorización, validación, duplicado y rollback | Código señalado y casos que cubren cada rama. |
| Rendimiento | Listas, búsqueda, cambio de estado y web móvil | Línea base, carga definida, p95/error, planes SQL y métricas de navegador. |

Las pruebas embebidas no prueban red, TLS, cuota ni respaldo de Supabase. Faltan prueba de carga, paginación completa, política de secretos y restauración. No llamar «certificado» a un flujo sin resultado observado y firmado por el equipo.
