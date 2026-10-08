> **Nota de versión (2026-10-07):** este documento describe decisiones o evidencias de la etapa SQL Server. Para la arquitectura, instalación y estado vigentes usa `README.md`, `docs/01-arquitectura.md`, `docs/07-ESTADO-Y-EVIDENCIA.md` y `docs/16-PLAN-FUENTE-DE-VERDAD.md`. No ejecutes scripts SQL Server en PostgreSQL.

# Búsqueda de empleos: integración inicial

La búsqueda consulta la API regional de Jooble Perú mediante `GET /api/jobs` → módulo del servidor → `https://pe.jooble.org/api/{clave}`. El navegador nunca recibe la clave. El servidor acepta solo palabras clave, ubicación y página 1–5; limita la respuesta a diez ofertas por página, aplica timeout de seis segundos y guarda resultados en memoria diez minutos por búsqueda. El usuario guarda explícitamente la oferta por la API normal de oportunidades y puede crear un proceso después. PostgreSQL es la fuente de verdad de las oportunidades guardadas y postulaciones del usuario; la disponibilidad o vigencia de ofertas externas pertenece al proveedor.

## Configuración

1. Obtener una clave en el portal regional de Perú y revisar sus términos. Guardarla solo en `.env` como `JOOBLE_PE_API_KEY`; no usar `NEXT_PUBLIC_`, ni publicar capturas de la clave.
2. Con `npm run dev`, entrar con usuario de prueba y visitar `/empleos`. Sin clave el resultado es un error claro `JOBS_NOT_CONFIGURED`, sin afectar el resto del producto.
3. Buscar, abrir la oferta original y guardar si interesa; verificar en `/oportunidades` que se guarda una sola vez por acción del usuario. La prueba automática usa proveedor simulado y no gasta cuota.

El plan gratuito documenta **500 solicitudes totales por clave**, no 500 mensuales. La clave debe pertenecer a la región consultada. La caché reduce llamadas repetidas, pero no garantiza controlar gasto en múltiples instancias. No iniciar búsquedas automáticas o un crawler. Fuente: [documentación Jooble](https://help.jooble.org/en/support/solutions/articles/60001448238-rest-api-documentation), [portal de Perú](https://pe.jooble.org/api/about).

## Riesgos y siguientes pasos

- Si la clave falla, expira o la cuota se agota, el módulo responde error controlado; las postulaciones propias siguen disponibles.
- Antes de compartir la aplicación públicamente, verificar términos de republicación, atribución, cuota, límites y política de caché del proveedor. La interfaz enlaza siempre a la oferta original e identifica la fuente.
- La URL y texto vienen de un tercero. Se ignoran URLs que no sean HTTPS, se recorta el contenido y React lo muestra como texto; nunca ejecutar HTML del proveedor.
- Siguiente iteración: deduplicar al guardar por fuente/ID, registrar vencimiento y filtros adecuados. No asumir que un resultado externo equivale a una oferta activa o verificada.
