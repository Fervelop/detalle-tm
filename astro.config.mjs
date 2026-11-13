// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

// La tienda se sirve desde Cloudflare Pages con render en el servidor,
// así los cambios hechos en el panel se ven al instante sin volver a publicar.
export default defineConfig({
  site: 'https://detalle-tm.pages.dev',
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: 'passthrough',
  }),
  integrations: [react()],
  trailingSlash: 'never',
});
