import type { APIRoute } from 'astro';

/** Sirve las fotos guardadas en R2. Las claves no cambian (cada subida crea una nueva), así que se cachean un año. */
export const GET: APIRoute = async ({ params, locals, request }) => {
  const key = params.key;
  if (!key || key.includes('..')) return new Response('No encontrado', { status: 404 });

  const obj = await locals.runtime.env.IMAGES.get(key, { onlyIf: request.headers });
  if (!obj) return new Response('No encontrado', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('ETag', obj.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  // Petición condicional que coincide: el navegador ya tiene la imagen.
  if (!('body' in obj) || !obj.body) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
};
