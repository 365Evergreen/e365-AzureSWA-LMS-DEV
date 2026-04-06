import { createMsalInstance } from '@lms/shared-auth';

export const msalInstance = createMsalInstance({
  auth: {
    clientId: process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID ?? 'dev-client-id',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_ENTRA_TENANT_ID ?? 'common'}`,
    redirectUri:
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  },
  cache: { cacheLocation: 'sessionStorage' },
});
