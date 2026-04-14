import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { extractBearerToken, validateToken } from '../middleware/validateToken';
import {
  fetchUnitContent,
  getCatalogueItem,
  getContentVersion,
  listCatalogueBrowse,
  listEnrolmentsByUser,
  listModuleUnits,
  listPathModules,
} from '../lib/storage';
import type { CatalogueItem } from '@lms/shared-schemas';

type LearnerListCourse = {
  courseId: string;
  slug: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  thumbnailUrl?: string;
  moduleCount: number;
  durationMinutes: number;
  progress: number;
  enrolled: boolean;
  role?: string;
  learningPath?: string;
  updatedOn: string;
};

function toLegacyLevel(difficulty?: CatalogueItem['difficulty']): LearnerListCourse['level'] {
  switch (difficulty) {
    case 'Advanced':
      return 'advanced';
    case 'Intermediate':
      return 'intermediate';
    case 'Foundation':
      return 'beginner';
    default:
      return 'beginner';
  }
}

async function listPublishedPaths(): Promise<CatalogueItem[]> {
  return listCatalogueBrowse('PATH', 'Published');
}

async function getPublishedPathBySlug(slug: string): Promise<CatalogueItem | null> {
  const paths = await listPublishedPaths();
  const match = paths.find((path) => path.slug === slug);
  if (!match) return null;
  return getCatalogueItem('PATH', match.itemId);
}

async function listActiveEnrolments(userId: string): Promise<Set<string>> {
  const enrolments = await listEnrolmentsByUser(userId);
  return new Set(
    enrolments
      .filter((enrolment) => enrolment.status !== 'Withdrawn')
      .map((enrolment) => enrolment.pathId)
  );
}

async function toLearnerCourse(path: CatalogueItem, enrolledPathIds: Set<string>): Promise<LearnerListCourse> {
  const modules = await listPathModules(path.itemId);
  return {
    courseId: path.itemId,
    slug: path.slug,
    title: path.title,
    description: path.summary ?? '',
    level: toLegacyLevel(path.difficulty),
    tags: path.tagsCsv ? path.tagsCsv.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    thumbnailUrl: path.thumbnailUrl,
    moduleCount: modules.length,
    durationMinutes: path.estimatedMinutes ?? 0,
    progress: 0,
    enrolled: enrolledPathIds.has(path.itemId),
    role: path.role || undefined,
    learningPath: path.learningPath || undefined,
    updatedOn: path.updatedOn,
  };
}

async function buildPathBundle(path: CatalogueItem) {
  const moduleLinks = await listPathModules(path.itemId);
  const blocks: unknown[] = [];

  for (const moduleLink of moduleLinks) {
    const module = await getCatalogueItem('MODULE', moduleLink.moduleId);
    if (!module) continue;

    blocks.push({
      id: `${module.itemId}-heading`,
      type: 'heading',
      version: 1,
      payload: { text: module.title, level: 2 },
    });

    const unitLinks = await listModuleUnits(module.itemId);
    for (const unitLink of unitLinks) {
      const unit = await getCatalogueItem('UNIT', unitLink.unitId);
      if (!unit) continue;

      blocks.push({
        id: `${unit.itemId}-heading`,
        type: 'heading',
        version: 1,
        payload: { text: unit.title, level: 3 },
      });

      if (!unit.currentVersionId) continue;

      const versionNumber = parseInt(unit.currentVersionId, 10);
      if (!Number.isFinite(versionNumber)) continue;

      const version = await getContentVersion(unit.itemId, versionNumber);
      if (!version) continue;

      const content = await fetchUnitContent(version.contentUri);
      if (content?.blocks?.length) {
        blocks.push(...content.blocks);
      }
    }
  }

  return {
    bundleId: path.itemId,
    courseId: path.itemId,
    platformVersion: '2.0.0',
    publishedAt: path.updatedOn,
    publishedBy: path.authorId,
    metadata: {
      title: path.title,
      description: path.summary ?? '',
      audienceRoles: ['Learner' as const],
    },
    blocks,
  };
}

async function requireLearner(req: HttpRequest) {
  const token = extractBearerToken(req);
  if (!token) return { error: { status: 401, jsonBody: { error: 'Missing bearer token' } } };
  let claims;
  try {
    claims = await validateToken(token);
  } catch {
    return { error: { status: 401, jsonBody: { error: 'Invalid or expired token' } } };
  }
  return { claims };
}

// ─── GET /api/learner/courses ─────────────────────────────────────────────────
// Returns published course list without bundleUrl. Requires any valid org token.

async function listLearnerCoursesHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireLearner(req);
  if ('error' in auth) return auth.error;
  const { claims } = auth;

  const paths = await listPublishedPaths();
  const enrolledPathIds = await listActiveEnrolments(claims.oid as string);
  const courses = await Promise.all(paths.map((path) => toLearnerCourse(path, enrolledPathIds)));

  context.log(`[learner/courses] returning ${courses.length} published paths`);
  return {
    status: 200,
    jsonBody: { courses, total: courses.length },
    headers: { 'Cache-Control': 'private, max-age=30' },
  };
}

// ─── GET /api/learner/courses/{slug} ──────────────────────────────────────────
// Returns course metadata + full content bundle. Requires valid JWT.
// When ?enrolled=true is passed the handler also verifies the user is enrolled
// (used for paywalled / restricted content; omit for free-access content).

async function getLearnerCourseHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireLearner(req);
  if ('error' in auth) return auth.error;
  const { claims } = auth;

  const slug = req.params.slug;
  if (!slug) return { status: 400, jsonBody: { error: 'slug is required' } };

  const path = await getPublishedPathBySlug(slug);
  if (!path || path.status !== 'Published') {
    return { status: 404, jsonBody: { error: 'Course not found' } };
  }

  const enrolledPathIds = await listActiveEnrolments(claims.oid as string);
  const checkEnrolment = req.query.get('enrolled') === 'true';
  if (checkEnrolment) {
    if (!enrolledPathIds.has(path.itemId)) {
      return { status: 403, jsonBody: { error: 'Enrolment required to access this content' } };
    }
  }

  const bundle = await buildPathBundle(path);
  const course = await toLearnerCourse(path, enrolledPathIds);

  if (!bundle.blocks.length) {
    context.warn(`[learner/courses] missing bundle for course ${slug}`);
    return { status: 404, jsonBody: { error: 'Course content not available' } };
  }

  context.log(`[learner/courses] served ${slug} to ${claims.oid}`);
  return {
    status: 200,
    jsonBody: { ...course, bundle },
    headers: { 'Cache-Control': 'private, max-age=60' },
  };
}

app.http('listLearnerCourses', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'learner/courses',
  handler: listLearnerCoursesHandler,
});

app.http('getLearnerCourse', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'learner/courses/{slug}',
  handler: getLearnerCourseHandler,
});
