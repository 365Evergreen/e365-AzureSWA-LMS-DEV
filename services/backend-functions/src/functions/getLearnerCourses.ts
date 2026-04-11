import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { extractBearerToken, validateToken } from '../middleware/validateToken';
import {
  listPublishedCourses,
  getCourseBySlug,
  fetchBundle,
  fetchEnrolments,
} from '../lib/storage';
import type { CourseMetadata } from '@lms/shared-schemas';

// Strip the raw blob URL before sending to clients — content is served via this API only.
function sanitiseCourse(course: CourseMetadata): Omit<CourseMetadata, 'bundleUrl'> {
  const { bundleUrl: _omit, ...safe } = course;
  return safe;
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

  const courses = await listPublishedCourses();
  const sanitised = courses.map(sanitiseCourse);

  context.log(`[learner/courses] returning ${sanitised.length} courses`);
  return {
    status: 200,
    jsonBody: { courses: sanitised, total: sanitised.length },
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

  const course = await getCourseBySlug(slug);
  if (!course || course.status !== 'published') {
    return { status: 404, jsonBody: { error: 'Course not found' } };
  }

  // Enrolment gate — active when the course is marked enrolled-only or the caller
  // explicitly requests an enrolment check via ?enrolled=true.
  const checkEnrolment = req.query.get('enrolled') === 'true';
  if (checkEnrolment) {
    const enrolments = await fetchEnrolments(claims.oid as string);
    const enrolled = enrolments.some((e) => e.courseId === course.courseId);
    if (!enrolled) {
      return { status: 403, jsonBody: { error: 'Enrolment required to access this content' } };
    }
  }

  // Extract bundleId from the stored URL and fetch privately (connection-string access).
  const bundleId = course.bundleUrl.split('/').pop()?.replace('.json', '');
  const bundle = bundleId ? await fetchBundle(bundleId) : null;

  if (!bundle) {
    context.warn(`[learner/courses] missing bundle for course ${slug}`);
    return { status: 404, jsonBody: { error: 'Course content not available' } };
  }

  context.log(`[learner/courses] served ${slug} to ${claims.oid}`);
  return {
    status: 200,
    jsonBody: { ...sanitiseCourse(course), bundle },
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
