import {
  PublicClientApplication,
  type Configuration,
  type AccountInfo,
  type SilentRequest,
} from '@azure/msal-browser';
import { useEffect, useState } from 'react';

// ─── App Roles ───────────────────────────────────────────────────────────────

export type AppRole = 'ContentEditor' | 'Learner';

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
    ['ContentEditor', 'Learner'].includes(r as string),
  );
}

// ─── useAuth hook ─────────────────────────────────────────────────────────────

export function useAuth(msalInstance: PublicClientApplication): {
  user: AuthUser | null;
  isLoading: boolean;
  getAccessToken: (scopes: string[]) => Promise<string | null>;
} {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await msalInstance.initialize();

        // Process the redirect response (auth code) returned by Entra after loginRedirect.
        const result = await msalInstance.handleRedirectPromise();
        if (result?.account) {
          msalInstance.setActiveAccount(result.account);
        }

        let account = msalInstance.getActiveAccount();

        // If no cached account, attempt SSO silent using the existing Entra browser session.
        // This signs in the user automatically if they are already authenticated with Microsoft
        // (e.g. logged into Microsoft 365 in the same browser) without any redirect or popup.
        if (!account) {
          try {
            const ssoResult = await msalInstance.ssoSilent({ scopes: ['User.Read'] });
            if (ssoResult?.account) {
              msalInstance.setActiveAccount(ssoResult.account);
              account = ssoResult.account;
            }
          } catch {
            // No existing Entra session — user will need to sign in manually.
          }
        }

        if (!cancelled && account) {
          setUser({ account, roles: parseRoles(account) });
        }
      } catch (error) {
        console.error('[auth] failed to initialise MSAL', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [msalInstance]);

  async function getAccessToken(scopes: string[]): Promise<string | null> {
    return acquireToken(msalInstance, { scopes });
  }

  return { user, isLoading, getAccessToken };
}

export { type Configuration, type AccountInfo, type SilentRequest };
