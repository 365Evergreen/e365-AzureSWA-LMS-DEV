import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { listPublishedCourses, getCourseBySlug, fetchBundle } from '../lib/storage';

async function getCatalogueHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const slug = req.params.slug;

  if (slug) {
    const course = await getCourseBySlug(slug);
    if (!course) return { status: 404, jsonBody: { error: 'Course not found' } };

    if (course.status !== 'published') {
      return { status: 404, jsonBody: { error: 'Course not found' } };
    }

    // Optionally embed the full bundle if ?bundle=true
    if (req.query.get('bundle') === 'true') {
      const bundleId = course.bundleUrl.split('/').pop()?.replace('.json', '');
      const bundle = bundleId ? await fetchBundle(bundleId) : null;
      return {
        status: 200,
        jsonBody: { ...course, bundle },
        headers: { 'Cache-Control': 'public, max-age=60' },
      };
    }

    return {
      status: 200,
      jsonBody: course,
      headers: { 'Cache-Control': 'public, max-age=60' },
    };
  }

  // List all published courses
  const audience = req.query.get('audience');
  const level = req.query.get('level');
  const tag = req.query.get('tag');

  let courses = await listPublishedCourses();

  if (audience) courses = courses.filter((c) => c.audience === audience || c.audience === 'all');
  if (level) courses = courses.filter((c) => c.level === level);
  if (tag) courses = courses.filter((c) => c.tags.includes(tag));

  context.log(`Catalogue: returning ${courses.length} courses`);
  return {
    status: 200,
    jsonBody: { courses, total: courses.length },
    headers: { 'Cache-Control': 'public, max-age=30' },
  };
}

app.http('getCatalogue', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'catalogue/{slug?}',
  handler: getCatalogueHandler,
});
