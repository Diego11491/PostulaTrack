# Fuente de verdad y contrato de datos

## Dueños de la información

| Dato | Fuente de verdad actual | Derivado o vista | Regla |
|---|---|---|---|
| Identidad, roles, sesión | `sec.Users`, `sec.UserRoles`, `sec.Sessions` | Cookie opaca; hash en SQL | El cliente nunca decide su rol o propietario. |
| Empresa y oportunidad | `app.Companies`, `app.Opportunities` | Lista de oportunidades | Cada registro pertenece a `OwnerUserId`. |
| Estado actual del proceso | `app.Applications.CurrentStatusId` | Columna del tablero | Se cambia junto con historial en la misma transacción. |
| Secuencia de cambios | `app.ApplicationStatusHistory` | Cronología y futuros indicadores | Una fila por transición registrada; no reescribir la historia desde la UI. |
| Acción futura | `app.Applications.NextAction*` y esquema `app.Activities` | Agenda (futura) | Definir una sola fuente operativa antes de conectar la pantalla. |
| Seguridad administrativa | `audit.AuditLog` | Vista de auditoría para ADMIN | Registrar quién cambió qué; no guardar secretos en DetailsJson. |

`app.ChangeApplicationStatus` lee el registro con bloqueo, actualiza estado actual, inserta historial y auditoría en una transacción. La API filtra acceso por usuario autenticado; el navegador consume lecturas y muestra datos, sin guardar un segundo estado autoritativo. La pantalla de Empresas que usa `demo-data.ts` y la Agenda con fechas fijas son prototipos: sus valores no pertenecen al SQL Server.

## Invariantes a mantener

1. Una postulación activa corresponde como máximo a una oportunidad activa por propietario (índice único filtrado).
2. Una lectura de postulación requiere `OwnerUserId` y relaciones de oportunidad y empresa del mismo propietario.
3. Un cambio exitoso actualiza `CurrentStatusId`, añade una fila de historial y la auditoría juntos. Si falla, ningún cambio queda confirmado.
4. El estado que muestra el tablero debe coincidir con la última transición por `HistoryId`; si no coincide, se investiga y no se «arregla» desde la interfaz.
5. Las fechas de persistencia son UTC; convertir a zona local solo para mostrar. Definir claramente el día local al agrupar cohortes.

## Riesgos detectados en la revisión

- La API no fuerza todavía una máquina de transiciones; puede saltar entre estados, volver desde uno terminal o pasar a uno incoherente. Definir reglas de dominio con la profesora antes de imponerlas.
- `app.Activities` y `NextAction*` pueden divergir. En el siguiente incremento, escoger `app.Activities` como origen de agenda y definir migración o convivencia explícita para los campos legados.
- El esquema inicial usa claves simples; ejecutar `003_owner_integrity.sql` y verificar sus cuatro claves compuestas antes de afirmar que SQL Server impide mezclar propietarios. Requiere respaldo y prueba de acceso cruzado.
- No hay paginación ni backup/restauración demostrados. Documentar límites y verificarlos antes de alegar «gran escala».

## Verificación de reconciliación propuesta

Consultar procesos no eliminados cuyo `CurrentStatusId` difiere del `NewStatusId` de su última fila de historial; el resultado esperado es 0. Añadir caso de rollback de la transición y caso de acceso cruzado con dos usuarios en una futura prueba de integración. Los ejemplos con datos sintéticos son adecuados para clase; no subir datos personales de estudiantes.
