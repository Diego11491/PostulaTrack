# Seguridad y pruebas de PostulaTrack

La imagen de clase representa el **Modelo V**: cada nivel de especificación tiene pruebas correspondientes. En seguridad probablemente la palabra buscada fue **SAST** (análisis estático de seguridad), no SAP (sistema empresarial). Confirmarlo con la profesora si mencionó una herramienta concreta.

| Lado de diseño | Evidencia de prueba | Estado actual |
|---|---|---|
| Problema e historias + criterios | Pruebas de aceptación con usuarios y SQL Server | Pendiente. |
| Arquitectura y límites web/API/SQL | Prueba del recorrido completo y usuario A/B | Pendiente. |
| Diseño de módulos y contratos | Integración de API y base | Pendiente. |
| Funciones puras y adaptador Jooble | `npm test` con respuestas simuladas, errores, caché y validación | Código de prueba añadido; verificar ejecución. |

## Controles complementarios

- **SAST** revisa patrones de seguridad en el código. `.github/workflows/codeql.yml` analiza JavaScript/TypeScript **solo si el repo es público**; en privado el job queda omitido para no romper CI sin licencia. Un repositorio privado con GitHub Code Security habilitado puede adaptar esa condición. Verificar una ejecución verde y triage de resultados antes de afirmar cobertura. [Condiciones de CodeQL](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/configure-code-scanning/configure-code-scanning).
- **SCA** analiza dependencias: el CI existente ejecuta `npm audit --omit=dev`; este comando no analiza toda la lógica del código y no equivale a SAST.
- La auditoría del ZIP original detectó una alerta crítica en `next` 16.3.5 (`GHSA-vcvr-r3jv-pc5j`). Este patch actualiza `next` y el lockfile a versión corregida; validar `npm audit --omit=dev` después de aplicar. [Aviso de GitHub](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j).
- **Pruebas de seguridad funcional:** sesión vencida, IDs ajenos, rol ADMIN, CSRF/Origin, rate limit, cabeceras, enlace de oferta malicioso, proveedor caído y clave ausente.
- **Revisión manual** de manejo de PII, logs y despliegue HTTPS con el estándar OWASP ASVS como guía, sin afirmar certificación. [ASVS](https://owasp.org/projects/asvs).

## Puertas antes de publicación

1. Ejecutar pruebas aisladas, typecheck y build; registrar fecha y salida.
2. Ejecutar pruebas de integración con SQL Server real en CI o ambiente de prueba controlado. El test del adaptador no valida SQL Server.
3. En dos cuentas, probar que ningún endpoint devuelve oportunidades, acciones o postulaciones de la otra cuenta. ADMIN no debe tener acceso al contenido laboral privado.
4. Activar SAST según elegibilidad del repositorio y triage de alertas. Confirmar que secretos no entran en Git, logs, error HTTP o variables públicas del frontend.
5. Revisar backups y restauración si se desplegará fuera del equipo local.
