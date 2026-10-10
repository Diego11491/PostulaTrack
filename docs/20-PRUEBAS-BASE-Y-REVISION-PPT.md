# PostulaTrack: revisión de presentación y pruebas de la versión base

Revisión del 9 de octubre de 2026. Se revisó el PDF de 11 páginas enviado por el equipo y la imagen del Modelo V. La base de código es `PostulaTrack-main(2).zip`, ANTES de los parches 08-12 de empresas, documentos, afinidad y chatbot. Este cambio solo agrega pruebas y documentación; no habilita esos módulos.

## 1. Revisión de las diapositivas

| Página | Evaluación | Ajuste concreto |
|---|---|---|
| 1. Portada | Título e integrantes corresponden al proyecto. | Añadir curso, docente y fecha si los exige la entrega. |
| 2. Integración BD | API Express, consultas pg, pool y transacciones corresponden al código. | Separar el modelo de datos y la explicación de conexión. El código del pool está pequeño. Llamar al esquema dibujado “modelo lógico simplificado” si se mantienen nombres traducidos y solo tablas del núcleo. |
| 3. Seguridad | Controles coherentes; la imagen solo evidencia un rechazo de login. | Añadir CSRF. Aclarar `RECRUITER` como nombre del rol técnico. Relacionar cada control con prueba/captura. Hash bcrypt no demuestra por sí solo toda la seguridad. |
| 4. Sprint III | Registro/consulta coherentes con la versión base. | Vincular HU y criterio de aceptación reales de Jira; mostrar el registro persistido o proceso creado. No dar por terminada la pantalla Empresas: sigue con ejemplos en esta versión. |
| 5. Sprint IV | Cambio de estado e historial existen. | Mostrar el detalle del historial con estado anterior/nuevo, fecha y responsable, en lugar de solo el tablero. |
| 6. Retrospectiva | Acciones razonables y pendientes reconocidos. | Confirmar que describen lo que ocurrió al equipo. Se escribe “¿Qué salió bien?” y “¿Qué no salió bien?”. |
| 7. Validación | Distingue parcialmente cumplido y pendiente, lo cual es adecuado. | No se puede comprobar “5 cumplidos / 4 parciales / 1 pendiente” sin los diez requisitos y sus criterios. Añadir trazabilidad RF/HU → caso → evidencia → estado. “Mantenibilidad cumplida” necesita criterio y comprobación; arquitectura modular sola no basta. |
| 8. Arquitecturas | El flujo Next.js → Express → PostgreSQL es correcto. | Usar una diapositiva completa para arquitectura lógica y otra para despliegue, o un único diagrama grande de despliegue. No repetir dos imágenes pequeñas. |
| 9. Resultados | No corresponde a una entrega real aún. | Eliminar Lorem ipsum, evaluación trimestral y barras de plantilla. Sustituir por resultados de pruebas medidos, fecha, entorno y alcance. |
| 10. Conclusiones | Los textos de redes de apoyo, empoderamiento financiero y alianzas no reflejan resultados medidos de PostulaTrack. | Reemplazar por persistencia, trazabilidad, separación por roles y limitaciones verificadas. |
| 11. Cierre | Conserva identidad y contactos de plantilla. | Sustituir Estudio Shonos / unsitiogenial por el equipo y el proyecto. La foto decorativa es opcional. |

Las páginas 2-8 pueden conservar su estilo beige/rosado. La prioridad es texto legible, evidencias relacionadas con un criterio y resultados reales.

## 2. Qué significa el Modelo V para esta entrega

La imagen relaciona requisitos con aceptación, diseño funcional con sistema, diseño técnico con integración y componentes con pruebas de componentes. Úsenla para establecer de dónde nace cada prueba. No implica abandonar los sprints: la correspondencia entre requisito y prueba puede mantenerse dentro de cada sprint.

“Nivel” indica qué parte o alcance se comprueba; “técnica” indica cómo se diseñan los casos. Caja negra observa el comportamiento especificado; caja blanca analiza la estructura interna. No son dos niveles nuevos del Modelo V. Referencia de terminología: [ISTQB CTFL v4.0.1](https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/), apartados 2.2 y 4.1. La referencia no convierte esta entrega en una certificación.

| Nivel de la imagen | En PostulaTrack | Evidencia disponible o pendiente |
|---|---|---|
| Componentes / unitarias | Contratos de perfil/búsqueda, reglas Origin/CSRF/RBAC, manejo de errores. | Pruebas automáticas de funciones y reglas aisladas. Mostrar código de la rama y salida del caso. |
| Integración | Repositorios + transacciones + esquema PostgreSQL; API + sesiones + roles. | PGlite + Express local verificados. La conexión de red/TLS con Supabase se evidencia aparte. |
| Sistema | Navegador → Vercel → Render → Supabase, flujo completo y errores visibles. | Pendiente ejecutar y registrar el flujo en navegador sobre la versión desplegada. Los tests de API no verifican la interfaz. |
| Aceptación | Una persona realiza la tarea esperada de una HU y evalúa su criterio. | Pendiente registrar participante, HU, criterio, resultado y conformidad del equipo/usuario. |

## 3. Resultado real de la revisión técnica

Se ejecutó la versión base en una copia aislada. Antes de este parche:

- 12 bloques de caja blanca correctos.
- 1 flujo HTTP integrado correcto, con múltiples escenarios y aserciones.
- 0 fallos.

El parche incorpora ocho escenarios HTTP adicionales y dos pruebas internas/de integración. Después:

- Caja blanca: 14 bloques correctos.
- Caja negra: Node informa 10 bloques correctos: el flujo original, ocho escenarios nuevos y el contenedor que agrupa los ocho. Son nueve pruebas hoja en el grupo HTTP, no diez casos independientes.
- Total: 23 pruebas hoja y un contenedor, 0 fallos. No equivale a 100 % de cobertura de código.
- `npm run typecheck`: correcto en contratos, API y web.

Los logs originales están en `docs/evidencias-base/`. Estos resultados son locales con PGlite; no prueban automáticamente Vercel, Render, Supabase remoto, navegador, usabilidad ni restauración de backups. No usar el resultado anterior de 31 bloques, porque incluía módulos nuevos que ahora se han dejado pendientes.

### Casos añadidos de caja negra

| Caso | Entrada/condición | Resultado observado automáticamente |
|---|---|---|
| CN-08 | Contraseña incorrecta o correo desconocido. | 401, mismo mensaje, sin cookie nueva. |
| CN-09 | Registro débil, correo inválido y correo repetido. | 400, 400 y 409. |
| CN-10 | Teléfono y año inválidos en PUT del perfil. | 400 y datos anteriores conservados. |
| CN-11 | Sin sesión; otra cuenta lee o cambia un proceso ajeno. | 401; 404; el estado del dueño permanece intacto. |
| CN-12 | Origen externo o CSRF ausente al cambiar estado. | 403 y estado intacto. |
| CN-13 | Estado inventado, cambio válido, repetición y ID negativo. | 400, 200, 409 sin historial extra, 400. |
| CN-14 | Contraseña actual errónea, confirmación distinta, cambio válido. | 400, 400, 200; otras sesiones revocadas; nueva clave funciona. |
| CN-15 | Cierre de sesión y reutilización de la cookie. | 204 y después 401. |

Los fixtures preparan usuarios y una base temporal; las aserciones de estos casos observan las respuestas HTTP. Ese alcance permite demostrar comportamiento de API, no comportamiento visual.

### Casos añadidos de caja blanca / integración

| Caso | Punto interno conocido | Resultado observado |
|---|---|---|
| CB-06 | Se inyecta un fallo antes de INSERT del historial, después de UPDATE del estado, dentro de la transacción. | Rollback conserva estado, historial y auditoría previos. Luego se permite un cambio válido. |
| CB-07 | `findByEmail` recibe texto con intento de SQL. | No devuelve una cuenta ni altera la tabla; búsqueda normal posterior funciona. |

CB-06 es una prueba de integración guiada por estructura interna, no una prueba unitaria aislada. CB-07 comprueba esa consulta parametrizada concreta; no es una auditoría exhaustiva de todas las rutas. El rollback de una transacción no demuestra restauración de una base a partir de backups.

## 4. Aplicar SOLO este parche y obtener tus capturas

Desde la raíz del repositorio, usando la ruta donde descargaste el `.patch`:

```powershell
git status --short
git apply --check .\PostulaTrack_Pruebas_Base.patch
if ($LASTEXITCODE -ne 0) { throw "El parche no coincide con esta versión del proyecto" }
git apply .\PostulaTrack_Pruebas_Base.patch
npm ci --include=dev
npm run typecheck
```

El parche parte del ZIP anterior a 08-12. No depende de aquellos parches. Si ya se aplicó 12, la modificación de los scripts de pruebas puede entrar en conflicto: no forzar ni reemplazar esos scripts a ciegas. Tampoco cambia tablas ni las variables de Render/Vercel.

Después captura y conserva la salida en tu equipo:

```powershell
New-Item -ItemType Directory -Force .\evidencias
Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git rev-parse --short HEAD
git diff --stat
npm run test:whitebox 2>&1 | Tee-Object .\evidencias\caja-blanca.txt
npm run test:blackbox 2>&1 | Tee-Object .\evidencias\caja-negra.txt
```

Si el parche aún no está en un commit, indica “base + parche de pruebas” y conserva `git diff`; el hash base no identifica por sí solo los cambios locales. Las pruebas levantan su API en un puerto temporal y fuerzan una conexión de prueba embebida; no necesitan modificar tu Supabase.

Capturas mínimas sugeridas, nombradas según el caso:

1. Consola caja blanca con CB-06/CB-07, resumen y 0 fallos; fecha/versión documentadas.
2. Código de la rama de autorización/CSRF más la aserción que comprueba permitido/rechazado. Son evidencia de caso, no un reporte de cobertura.
3. Código de la transacción y prueba del fallo controlado CB-06; señalar estado/historial conservados.
4. Consola caja negra con CN-08 a CN-15 y resumen sin fallos.
5. Navegador con login erróneo; ficha con dato de prueba, esperado y observado.
6. Navegador con proceso antes y después del cambio, más historial legible.
7. Dos cuentas de prueba demostrando aislamiento, sin exponer cookies ni contraseñas.
8. Prueba de aceptación firmada/confirmada por quien ejecuta la tarea; no sustituirla por un log de Node.

Una pantalla de la app o una captura de código sola no basta para identificar qué se probó. Acompáñala de caso, entrada, esperado, observado y entorno.

## 5. Fichas de sistema y aceptación para ejecutar ustedes

Estas fichas son un plan pendiente, no resultados inventados. Usa cuentas de prueba y datos sintéticos.

| ID | Tarea / pasos | Resultado esperado | Evidencia | Estado |
|---|---|---|---|---|
| SIS-01 | En la web desplegada, ingresar, registrar oportunidad y crear seguimiento; recargar. | Datos propios persistidos y disponibles después de recargar. | Capturas de creación y consulta + URL/fecha/versión. | Pendiente. |
| SIS-02 | Registrar SENT en una postulación, abrir detalle y recargar. | Estado e historial consistentes; fecha y responsable visibles. | Antes/después e historial. | Pendiente. |
| SIS-03 | Abrir cuenta B en incógnito e intentar URL de un proceso de A. | Sin datos ajenos; mensaje seguro. Confirmar que A mantiene su proceso. | Capturas de ambas sesiones sin secretos. | Pendiente. |
| SIS-04 | Probar ADMIN y RR. HH. con organizaciones A/B. | Navegación por rol y ofertas/candidaturas limitadas a su organización. | Capturas + respuestas esperadas 403/404 cuando corresponda. | Pendiente. |
| ACE-01 | Una compañera registra una oportunidad y comienza su seguimiento sin ayuda. | Cumple el criterio de la HU real, sin errores bloqueantes. | Nombre del participante, HU, criterio y conformidad. | Pendiente. |
| ACE-02 | La persona encuentra un proceso y reconstruye sus avances por historial. | Identifica estados y fechas correctamente. | Ficha de aceptación y observaciones. | Pendiente. |

Para cada ficha agregar: fecha/hora, commit o versión, entorno, requisito/HU real, precondiciones, pasos, esperado, observado, aprobado/fallido, responsable y referencia de imagen/log. No asigné IDs RF ficticios: deben provenir de Jira o de su matriz real.

Para particiones de caja negra, separa entradas válidas e inválidas; para límites, usa los valores reales del contrato. Ejemplo de registro: 11 caracteres se rechazan; 12 y 128 pueden admitirse si cumplen mayúscula/minúscula/dígito; 129 se rechaza. El ejemplo es un caso por ejecutar/documentar, no una medición ya hecha de todos esos límites.

Para una tabla de decisión de propiedad:

| Sesión | Rol de postulante | Dueño del proceso | Lectura esperada |
|---|---|---|---|
| Ausente | — | — | 401. |
| Válida | Sí | Sí | 200. |
| Válida | Sí | No | 404. |
| Válida | No (ADMIN/RR. HH.) | — | 403. |

## 6. Qué agregar a la PPT

Sugerencia de secuencia que conserva el trabajo de la compañera:

1. Arquitectura de despliegue grande; el diagrama nuevo se preparó para esta versión base.
2. Modelo de datos simplificado en una diapositiva propia.
3. Estrategia de pruebas: matriz del Modelo V, niveles, técnicas y entorno.
4. Caja negra: dos casos representativos con datos y respuestas/capturas (login erróneo, proceso ajeno).
5. Caja blanca: rama de autorización y transacción con rollback; código corto y salida.
6. Sistema y aceptación: evidencias reales del navegador y ficha del participante, o estado pendiente.
7. Resultados: tabla local medida y brechas pendientes. No reutilizar el gráfico trimestral de la plantilla.
8. Conclusiones y próximos pasos relacionados con PostulaTrack.

Texto breve propuesto para resultados, válido DESPUÉS de aplicar y ejecutar el parche:

> Se verificó la versión base de PostulaTrack mediante pruebas automáticas de reglas internas e interacción HTTP con PostgreSQL embebido. Pasaron 14 bloques de caja blanca y el grupo HTTP reportó 10 bloques, incluido su contenedor, sin fallos. Se comprobaron autorización, validaciones, propiedad, estado/historial, cierre de sesión y rollback. Las pruebas de navegador y aceptación del despliegue se registran por separado.

Texto propuesto para conclusiones:

> PostulaTrack permite persistir oportunidades y mantener un historial verificable de las postulaciones. La API concentra las reglas y limita el acceso por rol y propietario. Las pruebas locales confirmaron los casos ejecutados, mientras que la validación completa del despliegue, usabilidad y rendimiento requiere evidencias adicionales. Los documentos, la afinidad y el chatbot se mantienen como incrementos pendientes.

No presentar como cumplidos ni certificados: cobertura total, seguridad absoluta, mejora del tiempo de búsqueda, rendimiento, compatibilidad o recuperación de backups sin el criterio y su resultado. Para rendimiento puede proponerse un umbral de equipo, pero debe identificarse como propuesto y medirse bajo carga definida; un tiempo de ejecución de tests no es latencia de usuarios.
