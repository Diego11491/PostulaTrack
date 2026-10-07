> **Nota de versión (2026-10-07):** este documento describe decisiones o evidencias de la etapa SQL Server. Para la arquitectura, instalación y estado vigentes usa `README.md`, `docs/01-arquitectura.md`, `docs/07-ESTADO-Y-EVIDENCIA.md` y `docs/16-PLAN-FUENTE-DE-VERDAD.md`. No ejecutes scripts SQL Server en PostgreSQL.

# Roles y permisos

## USER

Es el postulante. Puede administrar únicamente su perfil, empresas, oportunidades y postulaciones. Todas las consultas de dominio incluyen su `UserId` como propietario.

## ADMIN

Atiende incidencias de acceso, lista cuentas, las activa o desactiva y revisa auditoría administrativa. No puede consultar automáticamente el contenido privado de oportunidades o postulaciones de otros usuarios.

## Principio aplicado

El sistema sigue mínimo privilegio. Ser administrador no equivale a ser propietario de los datos laborales. Si en una versión futura se necesita soporte sobre contenido privado, deberá existir consentimiento, motivo, caducidad del acceso y registro de auditoría específico.

## Rol RECRUITER propuesto, todavía no implementado

Un reclutador cambia el alcance del producto: pasaría de seguimiento privado de candidaturas a publicar vacantes y recibir postulaciones. Antes de agregarlo a `roleSchema`, se necesitan organizaciones verificadas, pertenencia del reclutador a una organización, ofertas propias, consentimiento explícito del candidato para compartir CV y datos, y consultas que filtren por organización y vacante. Un reclutador no debe leer las postulaciones privadas del usuario ni obtener acceso por tener solo el rol. Registrar decisiones, accesos y cambios de estado con actor y fecha. Primero prototipar el flujo con usuarios; después diseñar migraciones y pruebas de aislamiento entre dos organizaciones.
