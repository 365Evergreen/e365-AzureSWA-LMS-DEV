import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalInstance } from '../auth/msalConfig';
import { apiBase } from './apiBase';

export type SiteContentType = 'page' | 'post' | 'knowledge';

export interface SavePageRequest {
  slug: string;
  title: string;
  description?: string;
  templateId: string;
  contentType: SiteContentType;
  blocks: { id: string; type: string; version?: number; payload: Record<string, unknown> }[];
  status: 'draft' | 'published';
  tags?: string[];
  // Navigation (web pages only)
  inNav?: boolean;
  navLabel?: string;
  navParent?: string;
  navOrder?: number;
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
    try {
      const result = await msalInstance.acquireTokenSilent({ scopes: [scope], account });
      try {
        const payload = JSON.parse(atob(result.accessToken.split('.')[1]));
        console.debug('[pages] token claims: aud=', payload.aud, 'iss=', payload.iss, 'roles=', payload.roles);
      } catch { /* ignore decode errors */ }
      return result.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        console.warn('[pages] getToken: interaction required — opening popup');
        const result = await msalInstance.acquireTokenPopup({ scopes: [scope], account });
        return result.accessToken;
      }
      throw err;
    }
  } catch (err) {
    console.warn('[pages] getToken: failed', err);
    return null;
  }
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    console.warn('[pages] apiFetch: no token — request will be sent without Authorization header');
  }
  headers.set('Content-Type', 'application/json');
  return fetch(url, { ...init, headers });
}

export interface PageSummary {
  pageId: string;
  slug: string;
  title: string;
  description: string;
  status: 'draft' | 'published';
  contentType: 'page' | 'post' | 'knowledge';
  templateId: string;
  bundleUrl: string;
  publishedAt: string;
  updatedAt: string;
  author?: string;
  tags?: string[];
  inNav?: boolean;
  navLabel?: string;
  navParent?: string;
  navOrder?: number;
}

export interface PatchPageMetaRequest {
  contentType: SiteContentType;
  title?: string;
  description?: string;
  status?: 'draft' | 'published';
  inNav?: boolean;
  navLabel?: string;
  navParent?: string;
  navOrder?: number;
}

export interface EditorPageResponse {
  metadata: PageSummary;
  bundle: {
    pageId: string;
    slug: string;
    title: string;
    templateId: string;
    blocks: Array<{ id: string; type: string; version?: number; payload: Record<string, unknown> }>;
    savedAt: string;
  } | null;
}

export async function loadEditorPage(slug: string, contentType: SiteContentType = 'page'): Promise<EditorPageResponse> {
  const base = apiBase();
  const res = await apiFetch(`${base}/api/editor/pages/${encodeURIComponent(slug)}?contentType=${contentType}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`loadEditorPage ${res.status}: ${body}`);
  }
  return res.json() as Promise<EditorPageResponse>;
}

export async function listPages(contentType: SiteContentType = 'page'): Promise<PageSummary[]> {
  const base = apiBase();
  const res = await apiFetch(`${base}/api/editor/pages?contentType=${contentType}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`listPages ${res.status}: ${body}`);
  }
  return res.json() as Promise<PageSummary[]>;
}

export async function patchPageMeta(slug: string, patch: PatchPageMetaRequest): Promise<void> {
  const base = apiBase();
  const res = await apiFetch(`${base}/api/pages/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.text().catch(() => '');
    throw new Error(`patchPageMeta ${res.status}: ${body}`);
  }
}

export async function savePage(request: SavePageRequest): Promise<SavePageResponse> {
  const base = apiBase();
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
