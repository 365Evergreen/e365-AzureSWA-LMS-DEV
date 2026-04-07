import { msalInstance } from '../auth/msalConfig';

export interface SavePageRequest {
  slug: string;
  title: string;
  description?: string;
  templateId: string;
  contentType: 'page' | 'post';
  blocks: { id: string; type: string; version?: number; payload: Record<string, unknown> }[];
  status: 'draft' | 'published';
  tags?: string[];
}

export interface SavePageResponse {
  pageId: string;
  slug: string;
  bundleUrl: string;
  status: 'draft' | 'published';
}

async function getToken(): Promise<string | null> {
  const scope = import.meta.env.VITE_API_SCOPE ?? 'User.Read';
  try {
    await msalInstance.initialize();
    const account = msalInstance.getActiveAccount();
    if (!account) {
      console.warn('[pages] getToken: no active account');
      return null;
    }
    const result = await msalInstance.acquireTokenSilent({ scopes: [scope], account });
    return result.accessToken;
  } catch (err) {
    console.warn('[pages] getToken: silent acquisition failed', err);
    return null;
  }
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');
  return fetch(url, { ...init, headers });
}

export async function savePage(request: SavePageRequest): Promise<SavePageResponse> {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  const res = await apiFetch(`${base}/api/pages`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`savePage ${res.status}: ${body}`);
  }
  return res.json() as Promise<SavePageResponse>;
}
