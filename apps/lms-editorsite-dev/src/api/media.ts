import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalInstance } from '../auth/msalConfig';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

async function getToken(): Promise<string | null> {
  const scope = import.meta.env.VITE_API_SCOPE ?? 'User.Read';
  try {
    await msalInstance.initialize();
    const account = msalInstance.getActiveAccount();
    if (!account) {
      console.warn('[media] getToken: no active account');
      return null;
    }
    try {
      const result = await msalInstance.acquireTokenSilent({ scopes: [scope], account });
      try {
        const payload = JSON.parse(atob(result.accessToken.split('.')[1]));
        console.debug('[media] token claims: aud=', payload.aud, 'iss=', payload.iss, 'exp=', new Date(payload.exp * 1000).toISOString());
      } catch { /* ignore */ }
      return result.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        console.warn('[media] getToken: interaction required — opening popup');
        const result = await msalInstance.acquireTokenPopup({ scopes: [scope], account });
        return result.accessToken;
      }
      throw err;
    }
  } catch (err) {
    console.warn('[media] getToken: failed', err);
    return null;
  }
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    console.warn('[media] apiFetch: no token — request will be sent without Authorization header');
  }
  return fetch(url, { ...init, headers });
}

export async function listMedia(): Promise<MediaItem[]> {
  const res = await apiFetch('/api/media');
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`listMedia ${res.status}: ${body}`);
  }
  return res.json() as Promise<MediaItem[]>;
}

export async function uploadMedia(file: File): Promise<MediaItem> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiFetch('/api/media/upload', { method: 'POST', body: formData });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`uploadMedia ${res.status}: ${body}`);
  }
  return res.json() as Promise<MediaItem>;
}
