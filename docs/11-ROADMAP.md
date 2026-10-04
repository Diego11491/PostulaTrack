# Roadmap: de MVP a plataforma de seguimiento

«Gran magnitud» significa soportar más procesos y usuarios con claridad, privacidad y datos consistentes. No implica desplegar muchos servicios desde el comienzo. Cada fase añade valor verificable.

| Fase | Capacidad visible | Beneficio | Condición para presentarla como hecha |
|---|---|---|---|
| 0. Base actual | Cuenta, perfil, oportunidad, postulación, tablero e historial | No perder el recorrido de cada candidatura | Demo con SQL Server y dos usuarios; estado e historial persisten y no se cruzan. |
| 1. Siguiente acción | Agenda real vinculada a procesos, vencidas y próximas | Reducir olvidos | Cumplir `specs/001` y medir una prueba de tareas. |
| 2. Organización | Empresas reales, filtros y paginación; búsqueda externa de empleos ya preparada con clave opcional | Descubrir ofertas y navegar decenas o cientos de registros | Prueba con clave regional y API real; empresas sin arreglos de demo, consultas propias medibles. |
| 3. Preparación | CV versionado y documentos privados, vínculos a candidaturas | Saber qué versión se envió a cada empresa | Almacenamiento privado, permisos por propietario y restauración probada. |
| 4. Aprendizaje personal | Cohortes y embudo de etapas con definiciones estables | Detectar dónde se estanca la búsqueda | Métricas verificadas contra historial y muestras suficientes. |
| 5. Acceso remoto | Despliegue único con backups, monitoreo y costo acotado | Uso fuera del equipo local | Prueba de recuperación, seguridad y presupuesto real. |

## No poner todo en el MVP

Importar ofertas automáticamente puede violar condiciones de portales o crear registros duplicados; el módulo de búsqueda actual solo consulta y permite guardar por decisión explícita. «IA que recomienda empleo» exigiría datos adecuados, evaluación y explicaciones; no hay tal capacidad. Notificaciones externas requieren preferencias, consentimiento y control de entrega. La prioridad 1 es que el usuario actúe a tiempo con datos propios.

## Diseño para crecer sin cambiar de arquitectura por anticipación

- Consultas paginadas y filtros en servidor; índices y plan de ejecución revisados con volumen sintético representativo.
- Separación web/API y contratos versionados: cambios de UI no deben alterar la verdad en SQL Server.
- Operación: métricas de error, tiempos de respuesta, backup/restauración y costo por usuario activo antes de prometer escala.
- Privacidad: ADMIN gestiona acceso, no perfiles y postulaciones de todos; tableros agregados institucionales solo tras acuerdo explícito de finalidad y consentimiento.

## Decisión para la siguiente reunión con la profesora

Mostrar el flujo actual de una candidatura, el problema observado en usuarios y un prototipo de la próxima acción. Proponer la fase 1 como entrega funcional y negociar la fase 2 solo si el calendario lo permite. Nube queda opcional, sin afectar la evaluación del valor del producto.
