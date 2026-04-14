type ApiClientOptions = { baseUrl?: string; getToken?: () => Promise<string | null> };

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

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
  role?: string;
  learningPath?: string;
  updatedOn?: string;
}

export interface CourseModuleSummary {
  itemId: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  sortOrder: number;
  isOptional: boolean;
}

export interface CourseDetail extends LearnerCourse {
  bundle: {
    metadata: { title: string; description?: string };
    blocks: any[];
  } | null;
}

export interface PathDetail {
  itemId: string;
  title: string;
  summary: string;
  difficulty?: string;
  role?: string;
  learningPath?: string;
  estimatedMinutes: number;
  tagsCsv: string;
  thumbnailUrl?: string;
  updatedOn: string;
  modules: CourseModuleSummary[];
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
    role: c.role ?? undefined,
    learningPath: c.learningPath ?? undefined,
    updatedOn: c.updatedOn ?? undefined,
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
    enrolled: c.enrolled ?? false,
    role: c.role ?? undefined,
    learningPath: c.learningPath ?? undefined,
    updatedOn: c.updatedOn ?? undefined,
  };
}

function normaliseApiCourseDetail(c: any): CourseDetail {
  return {
    ...normaliseApiCourse(c),
    bundle: c.bundle ?? null,
  };
}

async function loadMockCatalogue(): Promise<LearnerCourse[]> {
  const mock = await import('./mockData');
  return mock.mockCourses.map(normaliseMockCourse);
}

async function loadMockCourse(slug: string): Promise<CourseDetail> {
  const mock = await import('./mockData');
  const bundle = mock.getMockBundle(slug);
  const course = mock.mockCourses.find((c) => c.id === slug);
  return {
    ...normaliseMockCourse(course ?? { id: slug, title: bundle.metadata.title }),
    bundle,
  };
}

// ─── API client ───────────────────────────────────────────────────────────────

export function createApiClient(opts: ApiClientOptions = {}) {
  const { baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '', getToken } = opts;

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (getToken) {
      try {
        const token = await getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {
        // ignore token errors and attempt the request unauthenticated
      }
    }

    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers ?? {}) },
    });
    if (!res.ok) throw new ApiError(`API request failed ${res.status} ${res.statusText}`, res.status);
    return res.json();
  }

  return {
    getCatalogue: async (): Promise<LearnerCourse[]> => {
      // No API configured — fall back to bundled mock data.
      if (!baseUrl) {
        return loadMockCatalogue();
      }
      const res = await request<{ courses: any[]; total: number }>('/learner/courses');
      const courses = (res.courses ?? []).map(normaliseApiCourse);
      return courses.length > 0 ? courses : loadMockCatalogue();
    },

    getCourse: async (slug: string): Promise<CourseDetail> => {
      // No API configured — fall back to mock bundle.
      if (!baseUrl) {
        return loadMockCourse(slug);
      }
      try {
        const res = await request<any>(`/learner/courses/${slug}`);
        return normaliseApiCourseDetail(res);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return loadMockCourse(slug);
        }
        throw error;
      }
    },

    getPathDetail: async (pathId: string): Promise<PathDetail> => {
      if (!baseUrl) {
        throw new ApiError('API base URL is required', 500);
      }

      return request<PathDetail>(`/catalogue/paths/${pathId}`);
    },

    enrolCourse: async (pathId: string): Promise<{ status: string; enrolledOn: string }> => {
      if (!baseUrl) {
        throw new ApiError('API base URL is required', 500);
      }

      return request<{ status: string; enrolledOn: string }>('/enrolment', {
        method: 'POST',
        body: JSON.stringify({ pathId }),
      });
    },
  };
}
