# Diagnóstico de SQL Server local en Windows

`ESOCKET: Failed to connect to localhost:1433` indica que la conexión TCP falló **antes** de validar usuario, contraseña o existencia de la base `PostulaTrack`. La página web puede cargar y `/health` puede responder aunque la base no esté disponible. `/ready` comprueba también SQL Server y responde 503 cuando no puede consultarlo.

## Comprobar servicio y puerto (PowerShell)

Desde cualquier terminal:

```powershell
Get-Service | Where-Object { $_.Name -like 'MSSQL*' } | Select-Object Name, Status, DisplayName
Test-NetConnection 127.0.0.1 -Port 1433
Get-NetTCPConnection -State Listen -LocalPort 1433 -ErrorAction SilentlyContinue
```

- Si no aparece ningún servicio `MSSQLSERVER` o `MSSQL$...`, confirma que instalaste **el motor de SQL Server**; SSMS es solamente el cliente.
- Si el servicio está detenido, inicia tu instancia desde *Servicios de Windows* o SQL Server Configuration Manager. Puedes usar `Start-Service MSSQLSERVER` en PowerShell elevado **solo si existe esa instancia predeterminada**. Si se llama, por ejemplo, `MSSQL$SQLEXPRESS`, usa ese nombre exacto.
- Si el servicio corre pero `TcpTestSucceeded` es `False`, habilita **TCP/IP** para esa instancia en SQL Server Configuration Manager → SQL Server Network Configuration → Protocols for [instancia]. En las propiedades de TCP/IP, sección IP Addresses, comprueba el puerto efectivo en IPAll; si usas 1433, desactiva puerto dinámico y fija TCP Port a `1433`. Reinicia **tu instancia**. No cambies puertos de otra instalación sin revisar su uso.
- Si tu instancia escucha en otro puerto fijo, usa ese puerto en `SQLSERVER_PORT` y repite la prueba. La conexión a `localhost` en SSMS puede utilizar Shared Memory y funcionar aunque TCP esté deshabilitado.

## Comprobar base y cuenta (SSMS)

Conéctate a la **misma instancia** cuyo puerto probaste. Ejecuta `database/001_schema.sql` solo si aún no instalaste el esquema. Luego verifica:

```sql
SELECT DB_ID(N'PostulaTrack') AS DatabaseId;
SELECT name, is_disabled FROM sys.sql_logins WHERE name=N'PostulaTrackApp';
USE PostulaTrack;
SELECT name FROM sys.database_principals WHERE name=N'PostulaTrackApp';
```

`PostulaTrack` es el nombre que crea el script; `PostulaTrackApp` es solo un **login sugerido dentro de un bloque comentado** al final de `001_schema.sql`. Si no lo creaste, el valor de `.env` no lo crea por sí solo. Ejecuta ese bloque con contraseña nueva y permisos mínimos desde una cuenta administradora, o usa el nombre del login de aplicación que realmente creaste. Activa autenticación mixta (SQL Server and Windows) si usarás un login SQL y reinicia la instancia cuando SQL Server lo indique.

No hay forma de recuperar la contraseña original de un login SQL Server: se establece al crearlo o se **restablece** con una cuenta autorizada mediante `ALTER LOGIN`. Mantén la misma contraseña en `.env`; no la compartas en chats, capturas ni commits. No conectes la API con `sa`.

Si tienes `sqlcmd` instalado, prueba la cuenta sin poner la contraseña en la línea de comandos: `sqlcmd -S tcp:127.0.0.1,1433 -U PostulaTrackApp -d PostulaTrack -Q "SELECT DB_NAME() AS DatabaseName"`. El programa te pedirá la contraseña. Si la conexión TCP pasa pero aquí falla, revisa autenticación, permisos y nombre de la base; ya no sería el mismo error `ESOCKET`.

## Variables locales

| Variable | Valor local típico | Comprobación |
|---|---|---|
| `SQLSERVER_HOST` | `127.0.0.1` | La máquina donde realmente corre el motor; si está en otro equipo o contenedor, cambia el host. |
| `SQLSERVER_PORT` | `1433` | Debe coincidir con el puerto TCP que escucha la instancia. |
| `SQLSERVER_DATABASE` | `PostulaTrack` | Correcto si ejecutaste `001_schema.sql` sin cambiar el nombre. |
| `SQLSERVER_USER` | `PostulaTrackApp` | Correcto solo si creaste ese login y usuario de base. |
| `SQLSERVER_PASSWORD` | Tu contraseña real | La que tú configuraste para ese login; el ejemplo no funciona. |
| `SQLSERVER_ENCRYPT` y `SQLSERVER_TRUST_CERTIFICATE` | `false` y `true` | Solo para desarrollo local; revisar cifrado y certificado para un despliegue real. |

`NODE_ENV`, puertos web/API, `WEB_ORIGIN` y `NEXT_PUBLIC_API_URL` del ejemplo son adecuados para ejecutar ambas interfaces en tu máquina. La URL de frontend debe terminar en `/api`; la contraseña y la clave Jooble van solo en `.env` del servidor, nunca en variables `NEXT_PUBLIC_`.
