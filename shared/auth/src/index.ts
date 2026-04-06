import {
  PublicClientApplication,
  type Configuration,
  type AccountInfo,
  type SilentRequest,
} from '@azure/msal-browser';
import { useEffect, useState } from 'react';

// ─── App Roles ───────────────────────────────────────────────────────────────

export type AppRole = 'Author' | 'Publisher' | 'Admin' | 'Learner';

export interface AuthUser {
  account: AccountInfo;
  roles: AppRole[];
}

// ─── MSAL instance factory ────────────────────────────────────────────────────

export function createMsalInstance(config: Configuration): PublicClientApplication {
  return new PublicClientApplication(config);
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function login(msalInstance: PublicClientApplication, scopes: string[]): Promise<void> {
  await msalInstance.loginRedirect({ scopes });
}

export async function logout(msalInstance: PublicClientApplication): Promise<void> {
  const account = msalInstance.getActiveAccount();
  await msalInstance.logoutRedirect({ account: account ?? undefined });
}

export async function acquireToken(
  msalInstance: PublicClientApplication,
  request: SilentRequest,
): Promise<string | null> {
  try {
    const result = await msalInstance.acquireTokenSilent(request);
    return result.accessToken;
  } catch {
    await msalInstance.acquireTokenRedirect(request);
    return null;
  }
}

function parseRoles(account: AccountInfo): AppRole[] {
  const claims = account.idTokenClaims as Record<string, unknown> | undefined;
  const raw = claims?.['roles'];
  if (!Array.isArray(raw)) return [];
  return raw.filter((r): r is AppRole =>
    ['Author', 'Publisher', 'Admin', 'Learner'].includes(r as string),
  );
}

// ─── useAuth hook ─────────────────────────────────────────────────────────────

export function useAuth(msalInstance: PublicClientApplication): {
  user: AuthUser | null;
  isLoading: boolean;
} {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    msalInstance.initialize().then(async () => {
      // Process the redirect response (auth code) returned by Entra after loginRedirect.
      // Without this, getActiveAccount() always returns null on the redirect-back load.
      const result = await msalInstance.handleRedirectPromise();
      if (result?.account) {
        msalInstance.setActiveAccount(result.account);
      }
      const account = msalInstance.getActiveAccount();
      if (account) {
        setUser({ account, roles: parseRoles(account) });
      }
      setIsLoading(false);
    });
  }, [msalInstance]);

  return { user, isLoading };
}

export { type Configuration, type AccountInfo, type SilentRequest };
