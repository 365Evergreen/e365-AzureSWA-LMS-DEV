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
    if (!account) return null;
    const result = await msalInstance.acquireTokenSilent({ scopes: [scope], account });
    return result.accessToken;
  } catch {
    // Silent acquisition failed (expired, no cache). The AuthGuard will redirect
    // to login on the next render cycle; return null so the API call fails gracefully.
    return null;
  }
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
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
