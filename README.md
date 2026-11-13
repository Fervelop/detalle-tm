# Detalle TM — tienda web

Tienda de catálogo de **Detalle TM** (detalles, decoraciones y floristería en Bogotá). El cliente arma un carrito, llena sus datos de entrega y envía la cotización por WhatsApp al 310 854 0601. Cada cotización queda registrada en el panel admin.

- **Tecnología:** Astro 5 + islas React, en Cloudflare Pages (render en el servidor), base de datos D1, fotos en R2 y panel protegido con Cloudflare Access.
- **Diseño:** dirección "Globo" (Fredoka + Nunito, formas redondas como globos). Los colores, las tipografías, el radio de los bordes y la proporción de las fotos salen de la tabla `settings` y se podrán editar desde el panel.

## Estado

| Fase | Contenido | Estado |
| --- | --- | --- |
| 1. Base | Proyecto, esquema D1, datos iniciales, protección del panel | Hecha |
| 2. Tienda | Inicio, catálogo con búsqueda y filtros, categorías, ocasiones, ficha de producto | Hecha (sin fotos reales) |
| 3. Carrito y WhatsApp | Carrito, formulario obligatorio, registro de cotización, mensaje a WhatsApp | Hecha |
| 4. Panel admin | Productos, fotos, categorías, ocasiones, adicionales, cotizaciones | Pendiente (hoy solo hay un resumen) |
| 5. Personalización | Apariencia, banners, páginas, galería, configuración, precios | Pendiente |
| 6. Lanzamiento | Productos reales, SEO, GA4, pruebas en celulares | Pendiente |

## Trabajar en local

Requiere Node 20 o superior.

```bash
npm install
npm run db:migrate:local      # crea las tablas en una D1 local
npm run db:seed:local         # categorías, ocasiones, adicionales, productos y ajustes iniciales
cp .dev.vars.example .dev.vars # opcional: entrar al panel sin Cloudflare Access
npm run dev                   # http://localhost:4321
```

`npm run preview` compila y sirve el sitio igual que en Cloudflare (`http://localhost:8788`).

## Publicar en Cloudflare (una sola vez)

Necesitas una cuenta de Cloudflare y `npx wrangler login`.

1. **Base de datos D1**
   ```bash
   npx wrangler d1 create detalle-tm
   ```
   Copia el `database_id` que aparece en `wrangler.toml` (donde dice `REEMPLAZAR-con-el-id-de-d1`). Luego:
   ```bash
   npm run db:migrate:remote
   npm run db:seed:remote
   ```
2. **Fotos en R2**
   ```bash
   npx wrangler r2 bucket create detalle-tm-imagenes
   ```
3. **Proyecto de Pages conectado a GitHub**
   En el panel de Cloudflare: *Workers & Pages → Create → Pages → Connect to Git*, elige `Fervelop/detalle-tm`.
   - Framework preset: *Astro* · Build command: `npm run build` · Output: `dist`
   - Nombre del proyecto: `detalle-tm` (así la URL será `https://detalle-tm.pages.dev`)
   - Las conexiones a D1 y R2 se toman de `wrangler.toml`.
   Cada push a `main` publica la tienda; cada rama genera un enlace de vista previa.
4. **Acceso al panel con Cloudflare Access** (plan gratuito de Zero Trust)
   - *Zero Trust → Settings → Authentication → Login methods*: agrega **GitHub** y **Google**.
   - *Zero Trust → Access → Applications → Add → Self-hosted*:
     - Dominio: `detalle-tm.pages.dev`, rutas `admin*` y `api/admin*` (dos destinos en la misma aplicación).
     - Política *Allow*: correos `detallestm.shaddai@gmail.com` y el correo principal de la cuenta de GitHub **Fervelop**.
     - Duración de sesión: 24 horas.
   - Copia el **Application Audience (AUD) Tag** y tu dominio de equipo (`https://<equipo>.cloudflareaccess.com`) en `wrangler.toml` (`ACCESS_AUD` y `ACCESS_TEAM_DOMAIN`). Agrega el correo de GitHub a `ADMIN_EMAILS`.

   El sitio valida además en cada petición el token que entrega Access (`src/middleware.ts`), así que conocer la URL del panel no basta para entrar.

## Estructura

```text
db/
  schema.ts            Esquema Drizzle (productos, categorías, ocasiones, fotos, opciones, adicionales, cotizaciones, ajustes…)
  migrations/          SQL generado con `npm run db:generate`
  seed.sql             Datos iniciales
src/
  layouts/Layout.astro Cabecera, pie, tema desde ajustes, SEO y GA4
  pages/               Tienda, carrito, páginas de texto, /admin, /api, /img (fotos de R2), sitemap y robots
  components/          Tarjetas, globos de ocasiones y listados
  components/islands/  Carrito, ficha de producto, galería (React)
  lib/                 Catálogo, ajustes, reglas del formulario, mensaje de WhatsApp, verificación de Access
  middleware.ts        Protege /admin y /api/admin
  styles/global.css    Estilos "Globo"
```

## Reglas importantes

- **Precios:** ocultos al lanzar (`settings.prices.showGlobal = false`). Cada producto puede heredar, mostrar u ocultar su precio. Si un precio está oculto, no se envía al navegador.
- **Datos obligatorios:** nombre, celular (10 dígitos que empiezan por 3), dirección, barrio y ciudad (solo Bogotá). Se validan en el navegador y otra vez en el servidor. La lista se configura en `settings.checkout`.
- **WhatsApp:** el enlace deja el mensaje escrito, pero el cliente debe tocar Enviar. Por eso la cotización se guarda antes con un consecutivo (`DTM-0001`…).
- **Fotos:** proporción fija (4:5 por defecto) con `object-fit: cover` y punto focal por foto, para que ninguna imagen empuje el contenido ni genere scroll.
