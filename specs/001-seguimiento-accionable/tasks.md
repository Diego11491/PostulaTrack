# Tareas verificables · Especificación 001

Marcar `[x]` solo con enlace a commit o evidencia; ninguna tarea del incremento se da por completada al crear esta especificación.

## Gate 0: negocio

- [ ] B01 Validar problema y flujo con usuarios; registrar método y hallazgos sin PII.
- [ ] B02 Acordar reglas de cierre, fechas y acciones sin proceso con la profesora.

## Gate 1: datos y API

- [ ] D01 Definir fuente única `app.Activities`; inventariar `NextAction*` y diseñar migración sin pérdida.
- [ ] D02 Versionar cambio de esquema/índices si resulta necesario, con script de verificación.
- [ ] A01 Añadir contratos Zod, rutas y consultas parametrizadas de crear, listar, actualizar y completar.
- [ ] A02 Verificar propietario en acción y postulación referenciada, incluido rol ADMIN.
- [ ] A03 Garantizar atomicidad de cambios que afecten acción y auditoría.

## Gate 2: producto

- [ ] U01 Conectar Agenda a API y eliminar fechas/empresas codificadas en esa pantalla.
- [ ] U02 Mostrar próximas y vencidas en Inicio, y acciones del proceso en detalle.
- [ ] U03 Añadir vacío, carga, error y confirmación visual; verificar teclado y 360 px.
- [ ] M01 Corregir indicadores de vencidas y tasa de avance con definiciones en `docs/08-NEGOCIO-Y-METRICAS.md`.

## Gate 3: evidencia

- [ ] T01 Casos de integración: crear y completar; recarga; rollback; usuario A/B; fechas y terminales.
- [ ] T02 Ejecutar `npm ci`, `npm run typecheck`, `npm run build` y pruebas con SQL Server local.
- [ ] E01 Registrar evidencia fechada y actualizar README/estado antes de presentar.
- [ ] E02 Grabar demo sin datos personales ni pantallas de prototipo presentadas como implementadas.
