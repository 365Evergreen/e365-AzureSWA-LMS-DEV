import { HttpRequest } from '@azure/functions';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { getBackendApiClientId, getEntraTenantId } from '../lib/config';

export interface AuthClaims {
  oid: string;
  sub: string;
  name?: string;
  preferred_username?: string;
  roles?: string[];
  tid: string;
}

const jwksClient = jwksRsa({
  jwksUri: `https://login.microsoftonline.com/${getEntraTenantId()}/discovery/v2.0/keys`,
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
  const clientId = getBackendApiClientId();
  const tenantId = getEntraTenantId();
  // Accept both v1 and v2 access tokens — the issued version depends on the
  // API app registration's accessTokenAcceptedVersion manifest setting.
  const audience = [`api://${clientId}`, clientId] as [string, string];
  const issuer = [
    `https://login.microsoftonline.com/${tenantId}/v2.0`,
    `https://sts.windows.net/${tenantId}/`,
  ] as [string, string];

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        audience,
        issuer,
        algorithms: ['RS256'],
      },
      (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
        if (err) return reject(err);
        resolve(decoded as AuthClaims);
      }
    );
  });
}

export function hasRole(claims: AuthClaims, role: string): boolean {
  return claims.roles?.includes(role) ?? false;
}

export function hasAnyRole(claims: AuthClaims, roles: readonly string[]): boolean {
  return roles.some((role) => hasRole(claims, role));
}

export function canEditContent(claims: AuthClaims): boolean {
  return hasAnyRole(claims, ['ContentEditor', 'Author', 'Publisher', 'Admin']);
}

export function canPublishContent(claims: AuthClaims): boolean {
  return hasAnyRole(claims, ['ContentEditor', 'Publisher', 'Admin']);
}
