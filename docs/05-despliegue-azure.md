# Despliegue futuro en Azure

**Opcional y no ejecutado en el ZIP revisado.** El MVP evaluable corre localmente con SQL Server. Elegir nube solo cuando se necesite acceso remoto, operación continua o un entorno de evaluación compartido; primero estimar costo mensual y comprobar el plan de despliegue.

## Arquitectura propuesta

```mermaid
flowchart TB
  U[Usuarios] --> FD[Front Door y WAF]
  FD --> WEB[App Service: Next.js]
  WEB --> API[App Service: Express]
  API --> SQL[(Azure SQL)]
  API --> KV[Key Vault]
  WEB --> AI[Application Insights]
  API --> AI
```

## Estrategia híbrida

Durante desarrollo, SQL Server, web y API funcionan localmente. Si se decide alojar el producto, la web, API y base pueden migrarse a servicios administrados. Una fase de pruebas puede conservar la base local, pero no se debe anunciar como despliegue de producción ni exponer SQL Server directamente a Internet.

## Pasos de migración

1. Crear Azure SQL Database y ejecutar los scripts versionados.
2. Crear una identidad administrada o credencial de mínimo privilegio.
3. Guardar secretos en Key Vault.
4. Publicar API y configurar `WEB_ORIGIN`, cifrado SQL y HTTPS.
5. Publicar Next.js con `NEXT_PUBLIC_API_URL` apuntando a la API; verificar origen, cookie `Secure`, HTTPS y comportamiento entre dominios antes de usar autenticación real.
6. Restringir red entre API y SQL mediante endpoints privados cuando el presupuesto lo permita.
7. Activar Application Insights, alertas, copias de seguridad y pruebas de restauración.

## Alta disponibilidad

La primera versión local no ofrece un SLA contractual. Si UTP contrata el servicio, el proveedor definido en el contrato operará la solución y responderá ante incumplimientos. Las penalidades se aplican al proveedor, no al usuario final, y deben relacionarse con créditos de servicio medibles, exclusiones y límites. Azure aporta redundancia, pero el SLA del producto depende de toda la cadena, no solo de la base de datos.
