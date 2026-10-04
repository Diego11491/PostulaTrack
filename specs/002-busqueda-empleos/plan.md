# Plan · Descubrir empleos

1. Mantener host Jooble Perú fijo y clave solo en API; validar el contrato de búsqueda.
2. Probar adaptador con simulaciones, respuestas maliciosas y errores; sin consumir cuota.
3. Conectar una pantalla de búsqueda a la API; distinguir buscar, abrir y guardar; solo guardar por intención explícita.
4. Con clave autorizada, realizar un smoke limitado y guardar evidencia redactada sin clave.
5. Antes de escala pública, revisar términos regionales, deduplicación al guardar, cuotas compartidas entre instancias y fecha de expiración.

La integración no crea postulaciones ni sustituye los flujos manuales. Se puede desactivar quitando la clave sin afectar el núcleo.
