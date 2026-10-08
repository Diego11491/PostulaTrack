# Roles e integraciones: decisión para PostulaTrack

Este archivo distingue capacidades implementadas de propuestas. La fuente de verdad de perfiles, oportunidades y postulaciones privadas es PostgreSQL; Express aplica las reglas de acceso. Una API externa no sustituye estas reglas ni hace la interfaz visualmente mejor por sí sola.

## Roles

| Rol | Estado | Acceso |
| --- | --- | --- |
| USER (postulante) | Implementado; el registro público crea este rol | Perfil, oportunidades guardadas, postulaciones e historial propios. Consulta ofertas públicas del catálogo y busca en Jooble si hay clave. |
| ADMIN | Implementado; solo se crea mediante bootstrap controlado | Administra cuentas y publica ofertas del catálogo. No recibe acceso automático al historial privado de otros usuarios. Nunca se asigna desde el registro público. |
| RECRUITER (reclutador) | Implementado mediante `003_recruitment.sql` y asignación por ADMIN | Publica ofertas de su organización y consulta solo nombre y correo de candidaturas enviadas expresamente a sus vacantes. No ve el seguimiento privado del postulante. |

ADMIN registra la organización después de comprobarla y asigna una cuenta USER existente a ella; la sesión anterior se revoca y el reclutador vuelve a iniciar sesión. La candidatura **compartida** es distinta del seguimiento privado: se limita al nombre y correo, se envía con confirmación expresa y se retira desde la cuenta del postulante. El historial, perfil detallado y otras oportunidades no se comparten. La entrega de CV, verificación automática de correos y comunicación transaccional quedan para otra fase; la administración comprueba la identidad de la empresa y del reclutador antes de asignar el rol. Las ofertas anteriores del catálogo ADMIN siguen sin organización y no aceptan candidaturas internas.

## Integraciones por etapa

| Servicio | Estado y propósito | Frontera y condición |
| --- | --- | --- |
| Jooble Perú REST API | Integración opcional existente para descubrir empleos. | Clave solo en Express. La cuota gratuita documentada es 500 peticiones **totales** por clave; caché y búsqueda explícita. La oferta externa no se guarda sin acción del usuario. [Jooble](https://help.jooble.org/en/support/solutions/articles/60001448238-rest-api-documentation). |
| Supabase PostgreSQL | Esquema y conexión en uso: el registro de USER y el cambio de contraseña ya funcionan en la interfaz local. | Solo Express conoce `DATABASE_URL`; Data API no es necesaria para este acceso. Aún falta reproducir la configuración TLS y probar el aislamiento entre dos usuarios. |
| Supabase Auth / Google | Propuesta para acceso con Google, verificación y recuperación de cuenta. | Es diferente de Data API. Se debe vincular de forma segura la identidad externa con `sec.users` y definir una sola fuente de verdad de sesión; nunca confiar en correo aportado por el navegador. [Supabase Auth](https://supabase.com/docs/guides/auth/social-login/auth-google). |
| Supabase Storage | Propuesta para CV y documentos. | Bucket privado, validación de tipo/tamaño y lectura autorizada por propietario mediante Express; enlaces temporales cuando haya una candidatura compartida. [Storage](https://supabase.com/docs/guides/storage/security/access-control). |
| Proveedor de correo, por ejemplo Resend | Propuesta para recuperación o avisos de agenda. | Se decide junto con el flujo de Auth para no duplicar correos. Envío desde servidor y cuotas revisadas al integrarlo. [Resend](https://resend.com/pricing?product=transactional). |
| Groq API | Propuesta para chatbot de ayuda y borradores, no decisiones automáticas sobre candidatos. | Clave en servidor, contexto mínimo con consentimiento, límites por usuario, revisión humana y prueba de inyección de instrucciones; límites del plan sujetos a revisión. [Groq](https://console.groq.com/docs/rate-limits). |
| Modelo ML propio | Propuesto para ordenar ofertas por afinidad con el perfil. | No necesita API de un tercero. Separar inferencia del CRUD, etiquetar ejemplos y evaluar precision@5 frente a reglas simples; mostrar factores de recomendación y permitir ignorarla. |
| Calendario externo | Diferido hasta que se solicite sincronización real. | Primero agenda propia y exportación `.ics`; conectar Google Calendar solo con autorización del usuario y permisos acotados. |

El diseño visual (espaciado, iconos, estados de carga, accesibilidad y navegación) se resuelve en la web. Las integraciones agregan funciones concretas; no se habilitan solo para decorar la aplicación.

La campana de la cabecera muestra avisos derivados de fechas límite próximas y acciones pendientes del usuario. Su contador indica **pendientes**, no mensajes sin leer. Se actualiza al abrirla y no envía correos ni notificaciones push; estas funciones requerirían sus propios datos de entrega y preferencias.

## Orden de trabajo y evidencia

1. Corregir menú lateral y respuesta visible de navegación; verificar tamaño amplio, colapsado y móvil.
2. Documentar la configuración TLS de Supabase y probar cierre de sesión y aislamiento de datos entre dos usuarios.
3. Elegir y completar una estrategia de identidad antes del despliegue público: sesiones actuales con recuperación propia, o integración controlada con Supabase Auth. Mantener RBAC en Express.
4. Ejecutar `003_recruitment.sql`, crear dos organizaciones de prueba, asignar reclutadores y verificar que una empresa no acceda a ofertas o candidaturas de la otra.
5. Añadir Storage, envío externo de avisos, ML y chatbot por incrementos con pruebas de autorización, rendimiento y calidad.

Este documento se actualiza al cerrar cada fase; no debe presentarse una propuesta como funcionalidad terminada.
