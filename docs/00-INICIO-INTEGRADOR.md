# PostulaTrack · alcance de Integrador II

PostulaTrack ayuda a una persona a reunir oportunidades, conservar el historial de sus postulaciones y recordar qué necesita hacer después. También ofrece un catálogo de ofertas que ADMIN puede publicar sin acceder a los procesos privados de los usuarios. Las funciones de ML para ordenar ofertas por afinidad y chatbot para preparar seguimientos forman parte del alcance exigido, **pendientes de implementación y evaluación**.

La base actual es Next.js + Express + PostgreSQL. La web consume `/api` en su mismo origen; Express posee reglas, autorización y acceso a datos. El monorepo simplifica compartir contratos y pruebas, mientras cada proceso se despliega de forma independiente. La instalación vigente está en `README.md`, el diagrama en `docs/01-arquitectura.md`, los datos en `docs/09-FUENTE-DE-VERDAD.md` y la ruta de ejecución en `docs/16-PLAN-FUENTE-DE-VERDAD.md`.

Para una demostración, primero se debe pasar la prueba completa con dos usuarios y PostgreSQL. Las pantallas de Agenda y Empresas con contenido fijo son prototipos y deben identificarse como tales. No se declaran cifras de impacto ni «certificación» de seguridad sin medición y evidencia.
