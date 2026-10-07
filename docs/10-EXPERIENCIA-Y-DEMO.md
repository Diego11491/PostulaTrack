> **Nota de versión (2026-10-07):** este documento describe decisiones o evidencias de la etapa SQL Server. Para la arquitectura, instalación y estado vigentes usa `README.md`, `docs/01-arquitectura.md`, `docs/07-ESTADO-Y-EVIDENCIA.md` y `docs/16-PLAN-FUENTE-DE-VERDAD.md`. No ejecutes scripts SQL Server en PostgreSQL.

# Experiencia web y guion de demostración

## Principio visual

PostulaTrack debe parecer un espacio de trabajo confiable: tipografía legible, jerarquía clara, contraste, buen uso móvil y acciones explícitas. La escala visual viene de presentar varios procesos sin perder orientación, no de añadir módulos vacíos o cifras enormes. Mantener el lenguaje en español y usar la paleta actual como base; no cambiar componentes sin una necesidad del usuario.

## Flujo principal de pantalla

| Momento | Información principal | Acción del usuario | Estado vacío o fallo |
|---|---|---|---|
| Inicio | Próxima acción, vencidas y procesos activos | Abrir tarea o registrar oferta | «Crea tu primera oportunidad»; error de API visible. |
| Oportunidades | Empresa, puesto, fuente, fecha y vínculo al proceso | Guardar y convertir | Buscar sin resultados y reintentar. |
| Tablero | Etapas agrupadas con conteos | Abrir proceso | Columnas vacías diferenciadas de error. |
| Detalle | Historial, estado y comentario | Registrar cambio válido | Error de permisos/conflicto sin borrar el formulario. |
| Agenda futura | Acciones de SQL, zona horaria, vencimientos | Crear, editar, completar | No mostrar calendario ficticio como dato real. |

## Prioridad de diseño

1. Conectar la agenda o retirarla de la demo; sustituir también la página Empresas con API real si va a mostrarse.
2. Diferenciar carga, ausencia de datos y error. Confirmar acciones irreversibles o de cierre; prevenir doble envío.
3. Móvil: probar ancho de 360 px; tablero navegable sin esconder estados; botones y textos accesibles por teclado.
4. Visualizar la línea temporal de una candidatura y su próxima acción como eje del producto.
5. Cuando haya 50+ procesos, añadir filtros y paginación de servidor antes de reclamar soporte de volumen.

## Demo honesta de 3 minutos

1. Crear o usar cuenta de prueba A. Registrar oferta de una empresa ficticia y crear el proceso.
2. Cambiar a `SENT`, luego `INTERVIEW`, con comentario y fecha. Recargar y mostrar que estado e historial persisten en SQL Server.
3. Ingresar con cuenta de prueba B y comprobar que no puede consultar el ID de A; mostrar respuesta controlada, sin datos ajenos.
4. Como ADMIN, mostrar gestión de acceso sin consultar las candidaturas privadas.
5. Cerrar con el siguiente incremento: agenda real y métricas definidas. Si no está implementado, enseñarlo como diseño y no como funcionalidad.

Registrar evidencia del entorno antes de grabar. Usar nombres y correos ficticios. Evitar mostrar `.env`, contraseñas o sesiones en pantalla.
