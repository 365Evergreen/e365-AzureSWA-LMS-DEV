/**
 * Returns the base URL for API calls, stripping any trailing /api segment.
 * In local dev (VITE_API_BASE_URL is empty) this returns '' so relative paths
 * are used, which Vite's dev proxy forwards to the Azure Functions host.
 */
export function apiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? ''
  if (raw) {
    return raw.replace(/\/api\/?$/, '')
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return ''
    }
  }

  return 'https://lmsendpointpublic-ggbehdbxdacaapdq.z03.azurefd.net'
}
