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
  const tenantId = process.env.ENTRA_TENANT_ID ?? '';
  // Accept both v1 and v2 access tokens — the issued version depends on the
  // API app registration's accessTokenAcceptedVersion manifest setting.
  const audience = [`api://${clientId}`, clientId].filter(Boolean);
  const issuer = [
    `https://login.microsoftonline.com/${tenantId}/v2.0`,
    `https://sts.windows.net/${tenantId}/`,
  ];

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        audience,
        issuer,
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
