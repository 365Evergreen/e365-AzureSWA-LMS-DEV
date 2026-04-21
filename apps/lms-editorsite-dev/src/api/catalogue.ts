import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalInstance } from '../auth/msalConfig';
import { apiBase } from './apiBase';
import type {
  CatalogueItem,
  PathDetail,
  UnitDetail,
  AssessmentDetail,
  AssessmentQuestion,
  AssessmentOption,
} from '@lms/shared-schemas';

export type {
  CatalogueItem,
  PathDetail,
  UnitDetail,
  AssessmentDetail,
  AssessmentQuestion,
  AssessmentOption,
};

// ─── Auth token helper (shared with pages.ts pattern) ────────────────────────

async function getToken(): Promise<string | null> {
  const scope = import.meta.env.VITE_API_SCOPE ?? 'User.Read';
  try {
    await msalInstance.initialize();
    const account = msalInstance.getActiveAccount();
    if (!account) return null;
    try {
      const result = await msalInstance.acquireTokenSilent({ scopes: [scope], account });
      return result.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        try {
          const result = await msalInstance.acquireTokenPopup({ scopes: [scope], account });
          return result.accessToken;
        } catch {
          // Popup also failed (e.g. AADSTS160021 — session no longer exists).
          // Fall back to a full redirect so the user is prompted to sign in again.
          await msalInstance.acquireTokenRedirect({ scopes: [scope], account });
          return null;
        }
      }
      throw err;
    }
  } catch (err) {
    console.error('[catalogue] getToken error:', err);
    return null;
  }
}

async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authenticated) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const base = apiBase();
  const res = await fetch(`${base}${url}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[catalogue] ${options.method ?? 'GET'} ${url} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Editor (authenticated) ───────────────────────────────────────────────────

export interface CatalogueListResponse {
  items: CatalogueItem[];
  total: number;
}

export async function listEditorCatalogueItems(
  type: CatalogueItem['itemType'] = 'PATH',
  status?: CatalogueItem['status']
): Promise<CatalogueListResponse> {
  const params = new URLSearchParams({ type });
  if (status) params.set('status', status);
  return apiFetch<CatalogueListResponse>(`/api/editor/catalogue?${params}`);
}

export async function loadEditorCatalogueItem(
  type: CatalogueItem['itemType'],
  itemId: string
): Promise<PathDetail | UnitDetail | CatalogueItem> {
  return apiFetch(`/api/editor/catalogue/${type.toLowerCase()}/${itemId}`);
}

// ─── Create / update path ─────────────────────────────────────────────────────

export interface CreatePathRequest {
  title: string;
  slug: string;
  summary?: string;
  difficulty?: CatalogueItem['difficulty'];
  role?: string;
  learningPath?: string;
  estimatedMinutes?: number;
  isMandatory?: boolean;
  visibility?: CatalogueItem['visibility'];
  thumbnailUrl?: string;
  tags?: string[];
  language?: string;
}

export async function createPath(data: CreatePathRequest): Promise<CatalogueItem> {
  return apiFetch<CatalogueItem>('/api/catalogue/paths', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function patchCatalogueItem(
  type: CatalogueItem['itemType'],
  itemId: string,
  patch: Partial<CreatePathRequest & { status: CatalogueItem['status']; unitType: CatalogueItem['unitType'] }>
): Promise<void> {
  await apiFetch(`/api/catalogue/items/${type.toLowerCase()}/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function publishCatalogueItem(
  type: CatalogueItem['itemType'],
  itemId: string
): Promise<void> {
  await apiFetch(`/api/catalogue/items/${type.toLowerCase()}/${itemId}/publish`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function archiveCatalogueItem(
  type: CatalogueItem['itemType'],
  itemId: string
): Promise<void> {
  await apiFetch(`/api/catalogue/items/${type.toLowerCase()}/${itemId}`, { method: 'DELETE' });
}

// ─── Modules ──────────────────────────────────────────────────────────────────

export interface AddModuleResponse {
  module: CatalogueItem;
  sortOrder: number;
}

export async function addModule(
  pathId: string,
  title: string,
  isOptional = false
): Promise<AddModuleResponse> {
  return apiFetch<AddModuleResponse>(`/api/catalogue/paths/${pathId}/modules`, {
    method: 'POST',
    body: JSON.stringify({ title, isOptional }),
  });
}

export async function reorderModules(pathId: string, moduleIds: string[]): Promise<void> {
  await apiFetch(`/api/catalogue/paths/${pathId}/modules/order`, {
    method: 'PUT',
    body: JSON.stringify({ moduleIds }),
  });
}

export async function removeModule(pathId: string, moduleId: string): Promise<void> {
  await apiFetch(`/api/catalogue/paths/${pathId}/modules/${moduleId}`, { method: 'DELETE' });
}

export interface SaveModuleAssessmentRequest {
  title?: string;
  description?: string;
  passingPercent?: number;
  questions: Array<{
    questionId?: string;
    prompt: string;
    explanation?: string;
    allowsMultiple?: boolean;
    sortOrder?: number;
    options: Array<{
      optionId?: string;
      label: string;
      isCorrect: boolean;
      sortOrder?: number;
    }>;
  }>;
}

export async function loadEditorModuleAssessment(moduleId: string): Promise<AssessmentDetail> {
  return apiFetch<AssessmentDetail>(`/api/editor/catalogue/modules/${moduleId}/assessment`);
}

export async function saveModuleAssessment(
  moduleId: string,
  data: SaveModuleAssessmentRequest,
): Promise<AssessmentDetail> {
  return apiFetch<AssessmentDetail>(`/api/catalogue/modules/${moduleId}/assessment`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Units ────────────────────────────────────────────────────────────────────

export interface AddUnitResponse {
  unit: CatalogueItem;
  sortOrder: number;
}

export async function addUnit(
  moduleId: string,
  title: string,
  unitType: CatalogueItem['unitType'] = 'Lesson',
  isOptional = false
): Promise<AddUnitResponse> {
  return apiFetch<AddUnitResponse>(`/api/catalogue/modules/${moduleId}/units`, {
    method: 'POST',
    body: JSON.stringify({ title, unitType, isOptional }),
  });
}

export async function reorderUnits(moduleId: string, unitIds: string[]): Promise<void> {
  await apiFetch(`/api/catalogue/modules/${moduleId}/units/order`, {
    method: 'PUT',
    body: JSON.stringify({ unitIds }),
  });
}

export async function removeUnit(moduleId: string, unitId: string): Promise<void> {
  await apiFetch(`/api/catalogue/modules/${moduleId}/units/${unitId}`, { method: 'DELETE' });
}

// ─── Unit content ─────────────────────────────────────────────────────────────

export interface Block {
  id: string;
  type: string;
  version?: number;
  payload: Record<string, unknown>;
  background?: string;
}

export interface SaveUnitContentResponse {
  versionNumber: number;
  contentUri: string;
}

export async function saveUnitContent(
  unitId: string,
  blocks: Block[],
  changeLog = ''
): Promise<SaveUnitContentResponse> {
  return apiFetch<SaveUnitContentResponse>(`/api/catalogue/units/${unitId}/content`, {
    method: 'POST',
    body: JSON.stringify({ blocks, changeLog }),
  });
}

// ─── Public (unauthenticated) ─────────────────────────────────────────────────

export async function browsePublishedPaths(): Promise<CatalogueListResponse> {
  return apiFetch<CatalogueListResponse>('/api/catalogue/browse?type=PATH', {}, false);
}
