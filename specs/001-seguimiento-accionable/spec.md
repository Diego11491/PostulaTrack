# Especificación 001 · Seguimiento accionable

**Estado:** propuesta; requiere validación de reglas y usuarios. **Producto:** PostulaTrack. **Resultado:** el postulante identifica y completa su próxima acción sin consultar varias herramientas. [Plan](plan.md) · [Tareas](tasks.md).

## Historia y alcance

Como postulante con varios procesos, quiero vincular una acción con su candidatura, ver su vencimiento y marcarla completada para no perder entrevistas ni seguimientos. El primer incremento es una agenda **dentro de la aplicación**, no correos, SMS ni notificaciones automáticas. ADMIN no accede a acciones personales.

### Incluye

- Crear una acción asociada a una postulación propia: título, tipo, fecha/hora, notas opcionales.
- Listar por próximas, vencidas y completadas; filtro por proceso; marcar completada y reprogramar con historial mínimo o auditoría según decisión de producto.
- Mostrar resumen coherente en Inicio, detalle y Agenda desde `app.Activities`.
- Estados vacíos, errores y accesibilidad en móvil y escritorio.
- Definir y registrar la transición desde `Applications.NextAction*` para que no haya dos fuentes contradictorias.

### Fuera del primer incremento

Envío de mensajes, integraciones con portales, extracción automática de correos, CV/archivos, evaluación de candidatos, predicción con IA y analítica institucional.

## Reglas por acordar antes de programar

1. ¿Se permite acción sin postulación? La tabla ya acepta `ApplicationId NULL`; para este incremento se propone asociarla obligatoriamente a un proceso en el flujo principal.
2. ¿Qué pasa al cerrar un proceso? Propuesta: conservar acciones y avisar al usuario; no eliminarlas en silencio.
3. ¿Se puede crear una acción en el pasado? Propuesta: permitir si se trata de registrar retrospectivamente, pero distinguirla como vencida.
4. Hora: entrada con zona del usuario, guardar UTC, mostrar con zona elegida; no convertir un día calendario ambiguo a medianoche UTC sin explicación.
5. Datos existentes en `NextAction*`: estrategia de migración o compatibilidad explícita; no duplicar tareas sin aviso.

## Criterios de aceptación

- CA-01: usuario A crea acción para proceso A y la ve en Agenda, Inicio y detalle después de recargar.
- CA-02: usuario B no lee ni modifica la acción de A, aunque conozca IDs; recibe respuesta sin filtrar datos de A.
- CA-03: si la transacción falla, la acción no aparece parcialmente; errores de negocio son legibles.
- CA-04: completar una acción la saca de pendientes sin borrar el registro; al recargar sigue completa.
- CA-05: acciones vencidas y próximas no se solapan: vencidas < ahora, próximas desde ahora hasta 7 días.
- CA-06: cambio de fecha mantiene el mismo ID y registra quién/cuándo si se acuerda auditoría; no se modifica el historial de estados de postulación.
- CA-07: una cuenta ADMIN no recibe datos de otras cuentas al visitar la API de agenda.
- CA-08: Agenda deja de renderizar fechas y nombres fijos del prototipo; con cero datos muestra una invitación a crear la primera acción.
- CA-09: cuando SQL Server no está disponible, el error no se confunde con «no hay acciones».

## Métrica de éxito

Con usuarios de prueba, medir porcentaje que identifica correctamente su siguiente acción y tiempo mediano de la tarea frente al método actual. Se acordará tamaño y muestra antes del test. No inferir mejora de una captura ni del número de registros sintéticos.
