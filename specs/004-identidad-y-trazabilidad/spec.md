# 004 · Acceso local y trazabilidad por propietario

**Problema:** si SQL Server está apagado, el registro falla sin una explicación útil; el esquema inicial acepta por clave foránea simple que una postulación apunte a la oportunidad de otro dueño si un futuro camino de escritura omite la validación de API. El usuario tampoco puede comprobar lo escrito en el campo de contraseña.

**Criterios verificables:**

1. Registro y acceso permiten revelar y volver a ocultar la contraseña con botón de tipo `button`, accesible por teclado, con nombre y estado; cada campo conserva su valor al alternar.
2. `/health` responde mientras la API vive; `/ready` responde 503 si SQL Server no acepta `SELECT 1` y 200 cuando se recupera, sin exponer credenciales.
3. Una conexión fallida no deja el pool permanentemente en estado rechazado.
4. Una fila de oportunidad, postulación, actividad o documento no puede enlazarse en SQL con una entidad de otro propietario; la migración aborta si los datos existentes violan la regla.
5. Crear oportunidad o postulación y archivar oportunidad genera un evento de auditoría en la **misma transacción**. La transición de estado conserva su historial y auditoría existentes.
6. El diseño de ofertas repetidas, recordatorios y asistente se documenta como siguiente fase, sin presentar tablas vacías como funcionalidades completas.

**Pruebas de aceptación pendientes en la máquina del equipo:** arrancar y apagar SQL Server, inspeccionar `/ready`, hacer la migración tras un respaldo, ejecutar `004_verify_traceability.sql`, registrar dos usuarios y probar la restricción cruzada en una transacción de prueba que termina con `ROLLBACK`. Probar registro, acceso y alternancia del ojo en móvil y teclado. Usar cuentas sintéticas; no publicar credenciales ni datos reales.
