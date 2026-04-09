type ApiClientOptions = { baseUrl?: string; getToken?: () => Promise<string | null> };

export function createApiClient(opts: ApiClientOptions = {}) {
  const { baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '', getToken } = opts;

  async function request<T>(path: string): Promise<T> {
    // If no baseUrl is configured, fall back to the bundled mock data used by the app.
    if (!baseUrl) {
      const mock = await import('../lib/mockData');
      // catalogue should return the mockCourses array
      if (path === '/catalogue') return (mock.mockCourses as unknown) as T;
      // courses/:id should return the mock bundle
      if (path.startsWith('/courses/')) {
        const parts = path.split('/').filter(Boolean);
        const id = parts[1];
        return (mock.getMockBundle(id) as unknown) as T;
      }
      throw new Error('No API base URL configured and no mock available for ' + path);
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (getToken) {
      try {
        const token = await getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        // ignore token errors and attempt the request unauthenticated
      }
    }

    const res = await fetch(`${baseUrl}${path}`, { headers });
    if (!res.ok) throw new Error(`API request failed ${res.status} ${res.statusText}`);
    return res.json();
  }

  return {
    // catalogue returns array of mock course objects when mocking
    getCatalogue: async (): Promise<any[]> => request<any[]>('/catalogue'),
    getCourse: async (id: string): Promise<any> => request<any>(`/courses/${id}`),
  };
}
