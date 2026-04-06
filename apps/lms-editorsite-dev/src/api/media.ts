import { msalInstance } from '../auth/msalConfig';
import { acquireToken } from '@lms/shared-auth';

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
  const account = msalInstance.getActiveAccount();
  return acquireToken(msalInstance, { scopes: [scope], ...(account ? { account } : {}) });
}

export async function listMedia(): Promise<MediaItem[]> {
  const token = await getToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch('/api/media', { headers });
  if (!res.ok) throw new Error(`listMedia failed: ${res.status}`);
  return res.json() as Promise<MediaItem[]>;
}

export async function uploadMedia(file: File): Promise<MediaItem> {
  const token = await getToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/media/upload', { method: 'POST', headers, body: formData });
  if (!res.ok) throw new Error(`uploadMedia failed: ${res.status}`);
  return res.json() as Promise<MediaItem>;
}
