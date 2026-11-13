import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Cloudflare Access pone un JWT firmado en la cabecera Cf-Access-Jwt-Assertion
 * de cada petición que pasa su login. Aquí se verifica la firma, la audiencia
 * y que el correo esté en la lista de administradores, para que conocer la URL
 * del panel no sea suficiente.
 */
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwks(teamDomain: string) {
  let set = jwksCache.get(teamDomain);
  if (!set) {
    set = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
    jwksCache.set(teamDomain, set);
  }
  return set;
}

export const allowedEmails = (raw: string) =>
  raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export async function verifyAdmin(request: Request, env: Env): Promise<{ email: string } | null> {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  const team = (env.ACCESS_TEAM_DOMAIN || '').replace(/\/$/, '');
  if (!token || !team.startsWith('https://') || !env.ACCESS_AUD || env.ACCESS_AUD === 'REEMPLAZAR') return null;
  try {
    const { payload } = await jwtVerify(token, jwks(team), { issuer: team, audience: env.ACCESS_AUD });
    const email = String(payload.email ?? '').toLowerCase();
    if (!email || !allowedEmails(env.ADMIN_EMAILS || '').includes(email)) return null;
    return { email };
  } catch {
    return null;
  }
}
