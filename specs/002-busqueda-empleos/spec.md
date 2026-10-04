# Especificación 002 · Descubrir empleos

**Estado:** integración de código inicial; validación externa pendiente. Historia: como postulante, quiero buscar ofertas en una fuente legítima, abrir el enlace original y guardar solo las que decido seguir para unificar descubrimiento y trazabilidad.

## Contrato

`GET /api/jobs?keywords=...&location=...&page=1` requiere sesión; el servidor consulta Jooble Perú cuando tiene una clave regional. Entrega título, empresa, ubicación, extracto, enlace HTTPS y fuente. Sin clave retorna 503; si el proveedor falla, 502 genérico sin detalles de clave. Buscar no modifica SQL; «Guardar oportunidad» crea un registro propio con `createApplication=false`.

## Aceptación

- CA-01 Búsqueda inválida retorna 400 y no consulta al proveedor.
- CA-02 Sin clave retorna 503; datos del usuario siguen accesibles.
- CA-03 Respuesta externa con enlace no HTTPS se descarta y HTML del extracto no se ejecuta.
- CA-04 Repetir la misma búsqueda dentro de diez minutos no gasta una nueva llamada por proceso.
- CA-05 Al guardar, la oferta aparece en oportunidades del propietario; otro usuario no la ve.
- CA-06 El usuario abre la fuente original e identifica claramente proveedor y naturaleza externa.
- CA-07 El proveedor caído genera mensaje comprensible sin exponer clave.

**Evidencia:** pruebas aisladas del adaptador cubren CA-01 a CA-04 y CA-07 parcialmente; CA-05/06 requieren navegador, SQL y clave real. El límite gratuito regional obliga a probar con simulaciones por defecto. Ver [plan](plan.md) y [tareas](tasks.md).
