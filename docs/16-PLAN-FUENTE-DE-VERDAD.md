# Plan incremental y fuente de verdad · 2026-10-07

## Regla de trabajo

- El código y el esquema versionados describen qué está implementado; una prueba con commit, fecha y entorno demuestra qué se verificó. Jira enlaza esa evidencia y puede seguir abierto aunque haya código.
- `README.md` indica instalación; `docs/01-arquitectura.md` marca límites; `docs/09-FUENTE-DE-VERDAD.md` asigna datos; `docs/07-ESTADO-Y-EVIDENCIA.md` registra resultados; ADR conserva decisiones y su reemplazo. Los contratos Zod no definen la visión completa.
- Base nueva: `database/postgres/001_schema.sql`. Base existente: no volver a ejecutar el inicial; cada cambio futuro usa una migración numerada y una prueba de reconciliación. SQL Server queda como legado de lectura hasta trasladar datos.

## Fases y puertas

| Fase | Entrega | Verificación de cierre |
|---|---|---|
| 1. PostgreSQL y separación | API con `pg`, esquema, web `/api`, sesión y propietario | Prueba embebida, pruebas sobre Supabase con dos usuarios, instalación limpia y compatibilidad de cookies HTTPS. |
| 2. Datos y seguridad | Traslado real SQL Server→PostgreSQL si existen datos; límites de campos revisados; rol SQL de mínimo privilegio | Conteos, historial, integridad, respaldo/restauración, pruebas de acceso cruzado y cifrado TLS. |
| 3. Escala y pruebas | Paginación en listas, índices medidos, caja negra/blanca, carga API y auditoría web | Datos sintéticos representativos, p95/error en API, Lighthouse/experiencia móvil; CI reproducible. |
| 4. Producto | Agenda real, documentos privados, definición de métricas y ofertas ADMIN | Pruebas funcionales y de propietario; reemplazar pantallas con datos fijos. |
| 5. ML | Afinidad explicable perfil–oferta usando modelo multilingüe y comparación con reglas simples | Ofertas etiquetadas, precisión@5 por perfiles de prueba, costo y latencia; sin promesa de contratación. |
| 6. Chatbot | Borrador de seguimiento revisado por usuario, en contexto de su candidatura | Casos sintéticos, prevención de filtración entre cuentas y prompt injection, costo, utilidad frente a plantilla. |
| 7. Hosting | Web y API como servicios independientes; PostgreSQL Supabase o Azure | Login/logout por HTTPS, secretos privados, monitoreo, restauración y presupuesto. |

ML y chatbot son requisitos del proyecto y tienen planificación propia; no se anuncian como implementados. La API externa Jooble ya es opcional: clave en servidor, timeout y guardado solo por decisión del usuario. Evaluar otras API gratuitas según utilidad, cuota y condiciones, antes de añadirlas.
