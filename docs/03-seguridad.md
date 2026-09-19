# Seguridad

## Controles implementados

- Contraseñas derivadas con bcrypt y costo 12; nunca se almacenan en texto claro.
- Contraseña mínima de 12 caracteres con mayúscula, minúscula y número.
- Cookie de sesión opaca, `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
- Solo el SHA-256 del token de sesión se almacena en SQL Server.
- Bloqueo de 15 minutos después de cinco credenciales incorrectas.
- Límite de solicitudes global y más estricto en registro/login.
- Helmet para cabeceras defensivas y CORS limitado al origen configurado.
- Comprobación de `Origin` en operaciones que modifican datos.
- Validación Zod y tamaño máximo de cuerpo de 256 KB.
- Consultas SQL parametrizadas.
- Autorización por rol y por propietario.
- Auditoría de cambios de estado y acciones administrativas.
- La cuenta SQL de aplicación no recibe `DELETE` ni permisos de definición de esquema.

## Responsabilidad por capas

| Riesgo | Control principal |
|---|---|
| Robo de contraseña | bcrypt y bloqueo temporal |
| Robo de sesión desde JavaScript | cookie `HttpOnly` |
| CSRF | `SameSite` y validación de origen |
| Inyección SQL | parámetros y validación |
| Acceso a datos de otro usuario | filtro por `OwnerUserId` |
| Abuso administrativo | rol `ADMIN` y auditoría |
| Borrado accidental | baja lógica y permiso `DELETE` denegado |

## Antes de producción

Habilitar HTTPS obligatorio, secretos en Azure Key Vault, rotación de credenciales, MFA para administradores, recuperación de contraseña verificada, análisis de dependencias, pruebas OWASP y alertas de Application Insights. La pantalla de seguridad muestra algunas capacidades futuras, pero MFA no forma parte del incremento actual.
