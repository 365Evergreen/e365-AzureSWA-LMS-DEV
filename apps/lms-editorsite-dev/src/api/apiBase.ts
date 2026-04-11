/**
 * Returns the API base URL with any trailing `/api` stripped.
 *
 * The Azure DevOps pipeline variable API_BASE_URL is set to the full Functions
 * host including `/api` (e.g. https://lms-func-dev.azurewebsites.net/api).
 * All API callers append their own /api/... paths, so we normalise here once
 * to prevent the double /api/api/ issue in production.
 */
export function apiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  return raw.replace(/\/api\/?$/, '');
}
