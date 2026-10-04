# Especificación 003 · Asistente de seguimiento con LLM

**Estado:** diseño, no implementado. Objetivo de negocio: ayudar a un postulante a preparar la próxima acción de un proceso que ya sigue; no prometer que una IA conseguirá empleo o verificará empresas.

## Primer caso de uso propuesto

En el detalle de una postulación, el usuario pulsa «Preparar seguimiento». La API recupera únicamente su oferta, estado, historial y próxima acción; el LLM propone un borrador de correo o checklist, con referencias a esos datos, y avisa qué información falta. El usuario revisa, edita y decide copiarlo. El modelo no envía mensajes, no cambia estado y no guarda una respuesta como hecho comprobado.

## Seguridad y gobierno

- Autorización por propietario antes de leer contexto. Minimizar y redactar correo, teléfono y otros datos personales; nunca mandar contraseña, cookie, token ni datos de otra cuenta.
- Tratar descripción de oferta y extractos externos como datos no confiables. Instrucciones insertadas en esos textos no modifican reglas ni autorizaciones.
- Configurar modelo/proveedor y presupuesto tras revisar tratamiento de datos; clave exclusivamente en servidor, máximo de tokens, timeout y tasa de solicitudes.
- Responder «no hay datos suficientes» cuando falte contexto. Mostrar fuente interna y fecha; identificar el texto como borrador generado.
- Conservar consentimiento y política de retención; no guardar prompts completos o respuestas con PII en logs.

## Evaluación antes de demo

Preparar al menos 20 casos sintéticos: con y sin próxima acción, historial contradictorio, oferta maliciosa que da instrucciones, texto personal y cuentas diferentes. Revisar utilidad con rúbrica humana, tasa de afirmaciones no sustentadas (objetivo 0 en datos críticos), filtración entre usuarios (0), costo por solicitud y latencia. Comparar con una plantilla determinista sin LLM: si el LLM no añade utilidad medible, mantener la plantilla.

## Puertas

Primero cerrar autorización y agenda de la especificación 001; después elegir proveedor, probar con datos sintéticos y registrar evidencia. Esta especificación no incluye asistentes autónomos, ranking secreto de candidatos ni recomendaciones que dependan de datos de empleo no verificados. [Plan](plan.md) · [Tareas](tasks.md).
