> **Nota de versión (2026-10-07):** este documento describe decisiones o evidencias de la etapa SQL Server. Para la arquitectura, instalación y estado vigentes usa `README.md`, `docs/01-arquitectura.md`, `docs/07-ESTADO-Y-EVIDENCIA.md` y `docs/16-PLAN-FUENTE-DE-VERDAD.md`. No ejecutes scripts SQL Server en PostgreSQL.

# Roles y permisos

## USER

Es el postulante. Puede administrar únicamente su perfil, empresas, oportunidades y postulaciones. Todas las consultas de dominio incluyen su `UserId` como propietario.

Su inicio es `/`, con búsqueda y seguimiento. Estas rutas requieren USER sin ADMIN ni RECRUITER, incluso si la cuenta reclutadora conserva USER en la base de datos.

## ADMIN

Atiende incidencias de acceso, lista cuentas, las activa o desactiva y revisa auditoría administrativa. No puede consultar automáticamente el contenido privado de oportunidades o postulaciones de otros usuarios.

Su inicio es `/admin`: menú de cuentas y empresas, ofertas publicadas y auditoría. Puede gestionar su propia cuenta y contraseña. Las rutas personales de postulante responden 403 para ADMIN; el menú no sustituye esta autorización en Express.

## Principio aplicado

El sistema sigue mínimo privilegio. Ser administrador no equivale a ser propietario de los datos laborales. Si en una versión futura se necesita soporte sobre contenido privado, deberá existir consentimiento, motivo, caducidad del acceso y registro de auditoría específico.

## RECRUITER (migración `003_recruitment.sql`)

ADMIN registra una organización tras comprobarla y asigna una cuenta USER existente; el registro público nunca concede RECRUITER. El reclutador gestiona solo las ofertas de su organización y ve nombre y correo de las candidaturas enviadas expresamente a ellas. El postulante puede retirarlas. Ni el historial ni las oportunidades personales se comparten. No se entregan CV ni se verifica el correo automáticamente en esta fase. Las dos organizaciones y el acceso indebido se comprueban en la prueba HTTP. La implementación vigente y las propuestas restantes se documentan en `docs/17-INTEGRACIONES-Y-ROLES.md`.

Su inicio es `/reclutamiento`: candidaturas propias de la organización y gestión de ofertas. Aunque la cuenta conserve USER para recuperar el acceso personal tras revocar RR. HH., no puede usar búsqueda, oportunidades ni postulaciones personales mientras sea RECRUITER. Al revocar el rol se invalidan las sesiones y el siguiente inicio de sesión vuelve al espacio de postulante.
