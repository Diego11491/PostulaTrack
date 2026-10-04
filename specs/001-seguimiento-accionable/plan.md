# Plan de implementación · Especificación 001

## Decisiones previas

Validar con la profesora el recorrido principal y con 5 a 8 posibles usuarios el problema y el lenguaje de estados. Elegir la regla de acciones al cerrar un proceso y de fechas pasadas; documentarlas en la especificación.

## Orden de entrega

1. Contratos Zod y API de actividades. Lecturas y escrituras siempre usan `req.user.userId`; validar propiedad del proceso vinculado en la misma operación.
2. Adaptar SQL si hace falta para consultas por propietario, fecha y completado; migración versionada y reversible de datos de prueba. Diseñar explícitamente convivencia de `NextAction*` antes de tocar los registros existentes.
3. Conectar Agenda, tarjeta de Inicio y detalle a la misma fuente. Manejar carga, vacío, conflicto y fallo; no mostrar datos de demostración en la experiencia real.
4. Separar acciones vencidas de próximas y sustituir métrica `progressRate` por una métrica correctamente definida; probar con cohortes y estados terminales.
5. Verificar seguridad, consistencia y accesibilidad con dos cuentas y SQL Server; registrar resultados en `docs/07-ESTADO-Y-EVIDENCIA.md`.

## Límites técnicos

Conservar Next.js + Express + SQL Server y los contratos actuales. Evitar un segundo almacenamiento de tareas en localStorage o en archivos. No introducir Azure o notificaciones para cerrar el incremento. SQL Server es la fuente de verdad.

## Riesgos y mitigación

| Riesgo | Mitigación | Puerta de salida |
|---|---|---|
| Dos lugares para próxima acción | Elegir `Activities` y planificar migración de `NextAction*` | Inicio, detalle y Agenda muestran la misma acción. |
| Acceso cruzado por IDs | Comprobar propietario de acción y proceso en cada operación | Prueba usuario A/B negativa. |
| Fechas ambiguas | UTC en datos, zona al presentar; prueba de cambio de día | La misma acción muestra hora correcta. |
| UI bonita pero sin persistencia | Recarga y error de SQL en demo de prueba | La agenda no depende de arreglos fijos. |
