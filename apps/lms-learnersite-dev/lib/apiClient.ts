type ApiClientOptions = { baseUrl?: string; getToken?: () => Promise<string | null> };

// ─── Public types ─────────────────────────────────────────────────────────────

export interface LearnerCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  durationMinutes: number;
  moduleCount: number;
  tags: string[];
  progress: number;
  enrolled: boolean;
}

export interface CourseDetail extends LearnerCourse {
  bundle: {
    metadata: { title: string; description?: string };
    blocks: any[];
  } | null;
}

// ─── Normalisers ──────────────────────────────────────────────────────────────

function normaliseMockCourse(c: any): LearnerCourse {
  return {
    id: c.id ?? c.courseId,
    slug: c.id ?? c.slug,
    title: c.title,
    description: c.description ?? '',
    thumbnailUrl: c.thumbnailUrl,
    level: c.level ?? 'beginner',
    durationMinutes: c.durationMinutes ?? 30,
    moduleCount: c.moduleCount ?? 1,
    tags: c.tags ?? [],
    progress: c.progress ?? 0,
    enrolled: c.enrolled ?? true,
  };
}

function normaliseApiCourse(c: any): LearnerCourse {
  return {
    id: c.courseId,
    slug: c.slug,
    title: c.title,
    description: c.description ?? '',
    thumbnailUrl: c.thumbnailUrl,
    level: c.level ?? 'beginner',
    durationMinutes: c.durationMinutes ?? 0,
    moduleCount: c.moduleCount ?? 0,
    tags: Array.isArray(c.tags) ? c.tags : [],
    progress: c.progress ?? 0,
    enrolled: c.enrolled ?? true,
  };
}

function normaliseApiCourseDetail(c: any): CourseDetail {
  return {
    ...normaliseApiCourse(c),
    bundle: c.bundle ?? null,
  };
}

// ─── API client ───────────────────────────────────────────────────────────────

export function createApiClient(opts: ApiClientOptions = {}) {
  const { baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '', getToken } = opts;

  async function request<T>(path: string): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (getToken) {
      try {
        const token = await getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {
        // ignore token errors and attempt the request unauthenticated
      }
    }

    const res = await fetch(`${baseUrl}${path}`, { headers });
    if (!res.ok) throw new Error(`API request failed ${res.status} ${res.statusText}`);
    return res.json();
  }

  return {
    getCatalogue: async (): Promise<LearnerCourse[]> => {
      // No API configured — fall back to bundled mock data.
      if (!baseUrl) {
        const mock = await import('./mockData');
        return mock.mockCourses.map(normaliseMockCourse);
      }
      const res = await request<{ courses: any[]; total: number }>('/learner/courses');
      return (res.courses ?? []).map(normaliseApiCourse);
    },

    getCourse: async (slug: string): Promise<CourseDetail> => {
      // No API configured — fall back to mock bundle.
      if (!baseUrl) {
        const mock = await import('./mockData');
        const bundle = mock.getMockBundle(slug);
        const course = mock.mockCourses.find((c) => c.id === slug);
        return {
          ...normaliseMockCourse(course ?? { id: slug, title: bundle.metadata.title }),
          bundle,
        };
      }
      const res = await request<any>(`/learner/courses/${slug}`);
      return normaliseApiCourseDetail(res);
    },
  };
}
