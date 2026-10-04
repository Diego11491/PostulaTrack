# API HTTP

Base local: `http://localhost:4000/api`. Las rutas protegidas utilizan la cookie `pt_session`.

| Método | Ruta | Rol | Uso |
|---|---|---|---|
| `POST` | `/auth/register` | Público | Crear usuario `USER`. |
| `POST` | `/auth/login` | Público | Crear sesión segura. |
| `GET` | `/auth/me` | Sesión | Consultar identidad actual. |
| `POST` | `/auth/logout` | Sesión | Revocar sesión. |
| `GET` | `/profile` | Sesión | Consultar perfil propio. |
| `PUT` | `/profile` | Sesión | Actualizar perfil propio. |
| `GET` | `/opportunities` | Sesión | Listar oportunidades propias. |
| `POST` | `/opportunities` | Sesión | Crear oportunidad y proceso opcional. |
| `DELETE` | `/opportunities/:id` | Sesión | Baja lógica de oportunidad propia. |
| `GET` | `/applications` | Sesión | Listar procesos propios. |
| `POST` | `/applications` | Sesión | Crear proceso desde oportunidad propia. |
| `GET` | `/applications/:id` | Sesión | Consultar detalle e historial propios. |
| `POST` | `/applications/:id/status` | Sesión | Registrar cambio de estado. |
| `GET` | `/dashboard` | Sesión | Obtener indicadores propios. |
| `GET` | `/jobs?keywords=&location=&page=` | Sesión | Buscar en Jooble Perú; 503 si falta clave, sin escribir en SQL. |
| `GET` | `/admin/users` | ADMIN | Listar cuentas. |
| `PATCH` | `/admin/users/:id/status` | ADMIN | Activar o desactivar cuenta. |
| `GET` | `/admin/audit` | ADMIN | Consultar auditoría. |

Los errores usan la forma:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revisa los datos ingresados."
  }
}
```
