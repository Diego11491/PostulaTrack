# Despliegue inicial: Vercel + Render + Supabase

La web Next.js corre en Vercel; la API Express corre como servicio Node en Render; PostgreSQL sigue en Supabase. El navegador llama a `/api/*` en el mismo origen de Vercel. `apps/web/next.config.ts` reescribe esas rutas hacia Render con `API_INTERNAL_URL`; la URL y credenciales de PostgreSQL permanecen exclusivamente en la API.

## Antes de empezar

- Fusionar la rama con `render.yaml` en `main` y confirmar que el esquema `database/postgres/001_schema.sql` y `003_recruitment.sql` está aplicado en Supabase. `002_verify.sql` comprueba el esquema.
- Tener acceso a GitHub, Vercel, Render y al proyecto Supabase. Usar la cadena **Session pooler** que muestra **Connect** para este proyecto; copiar host, usuario y puerto tal como aparecen allí.
- Descargar el certificado raíz CA de **Supabase → Database Settings → SSL Configuration** para el mismo proyecto. Conservarlo fuera del repositorio. En Render se cargará como archivo privado.
- Nunca subir `.env`, contraseñas ni `DATABASE_URL` a Git o a las variables de Vercel. No establecer `NODE_TLS_REJECT_UNAUTHORIZED=0` ni `DATABASE_SSL=false`.

## 1. Publicar web en Vercel

1. Importar `Diego11491/PostulaTrack` desde GitHub. Elegir `main` y **Root Directory** `apps/web`; seleccionar el framework **Next.js**.
2. En **Build Command** indicar:

   ```sh
   npm run build --workspace @postulatrack/contracts && npm run build --workspace @postulatrack/web
   ```

   Dejar la instalación predeterminada de npm para que use el `package-lock.json` del monorepo. No añadir `DATABASE_URL` a Vercel.
3. Hacer el primer deploy y anotar su dominio de **producción** `https://<web>.vercel.app`. La portada podrá abrirse, pero las funciones `/api/*` todavía esperan la API.

## 2. Publicar API en Render

1. En Render seleccionar **New → Blueprint**, vincular el mismo repositorio y `main`. Render leerá `render.yaml` para crear `postulatrack-api` como servicio **Web** gratuito. Los comandos se ejecutan desde la raíz del monorepo. También se puede crear manualmente un servicio Node con los mismos campos del YAML.
2. Cuando Render solicite variables marcadas `sync: false`, pegar `DATABASE_URL` **solo en Render** y `WEB_ORIGIN=https://<web>.vercel.app` (dominio exacto, sin barra final). Mantener las otras variables del YAML. Dejar `PORT` y `API_PORT` sin definir: la API usa el `PORT` asignado por Render.
3. En **Environment → Secret Files**, agregar el contenido del CA de Supabase como archivo `supabase-ca.crt`; definir la variable `DATABASE_CA_CERT_FILE=/etc/secrets/supabase-ca.crt` y guardar/redeployar. El código verifica cadena y nombre de host con `rejectUnauthorized: true`. La primera compilación puede ocurrir antes de cargar el CA; finalizar este paso antes de probar login o `/ready`.
4. Registrar la URL pública `https://<api>.onrender.com`. Abrir `/health` y comprobar HTTP 200; luego `/ready` y comprobar HTTP 200 con conexión a PostgreSQL. Si `/ready` devuelve 503, revisar el log del servicio, el CA, la cadena Session pooler y las migraciones. `/ready` tiene límite de peticiones; configurar el monitor automático con `/health`.

## 3. Conectar y comprobar

1. En Vercel, **Settings → Environment Variables**, crear `API_INTERNAL_URL=https://<api>.onrender.com` para **Production** (sin `/api` ni barra final). Redeployar la web: las rewrites de Next.js se fijan durante la compilación.
2. Comprobar `https://<api>.onrender.com/health` y `/ready` en Render. Después probar registro, inicio de sesión, perfil, ofertas, postulaciones y cierre de sesión **en el dominio de Vercel**, con una cuenta de prueba. Verificar en las herramientas de red que el navegador usa `/api/*` del mismo origen y no conoce `DATABASE_URL`.
3. Probar una ruta protegida sin sesión (401) y una acción con rol inadecuado (403). Revisar `/ready` y los logs de Render; registrar fecha, commit y capturas para la evidencia del curso. No mostrar secretos ni datos personales en capturas.

## Consideraciones

- El plan gratuito de Render suspende el servicio tras un período de inactividad; la primera petición al despertar puede tardar. Para una demostración, abrir la API unos minutos antes. La web y la base pueden estar activas mientras la API despierta.
- Si cambia el dominio de Vercel, actualizar `WEB_ORIGIN` en Render. Si cambia el de Render, actualizar `API_INTERNAL_URL` en Vercel y volver a desplegar.
- Este despliegue usa un solo dominio Vercel de producción en `WEB_ORIGIN`. Las previews de Vercel requieren una estrategia de dominios y cookies propia antes de probar autenticación.
- Si no aparece **Secret Files** en el plan o cuenta, usar el mecanismo de CA confiable de Node en la instancia o elegir un proveedor que permita archivos privados. No sustituir el CA por una excepción TLS.
