import { HttpRequest } from '@azure/functions';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

export interface AuthClaims {
  oid: string;
  sub: string;
  name?: string;
  preferred_username?: string;
  roles?: string[];
  tid: string;
}

const jwksClient = jwksRsa({
  jwksUri: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  cacheMaxEntries: 5,
  cacheMaxAge: 600_000,
});

function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key?.getPublicKey());
  });
}

export function extractBearerToken(req: HttpRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export function validateToken(token: string): Promise<AuthClaims> {
  const clientId = process.env.ENTRA_CLIENT_ID ?? '';
  // Entra v2 access tokens carry aud as the Application ID URI (api://CLIENT_ID)
  // Accept both the bare GUID and the api:// prefixed URI to handle both cases.
  const audience = [`api://${clientId}`, clientId].filter(Boolean);

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        audience,
        issuer: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/v2.0`,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded as AuthClaims);
      }
    );
  });
}

export function hasRole(claims: AuthClaims, role: string): boolean {
  return claims.roles?.includes(role) ?? false;
}
