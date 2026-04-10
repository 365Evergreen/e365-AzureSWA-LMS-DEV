import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { listPublishedCourses, getCourseBySlug, fetchBundle } from '../lib/storage';

async function getCatalogueHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const slug = req.params.slug;

  if (slug) {
    const course = await getCourseBySlug(slug);
    if (!course || course.status !== 'published') {
      return { status: 404, jsonBody: { error: 'Course not found' } };
    }

    // Embed the full bundle if ?bundle=true — fetched server-side from private container.
    if (req.query.get('bundle') === 'true') {
      const bundleId = course.bundleUrl.split('/').pop()?.replace('.json', '');
      const bundle = bundleId ? await fetchBundle(bundleId) : null;
      const { bundleUrl: _omit, ...safeCourse } = course;
      return {
        status: 200,
        jsonBody: { ...safeCourse, bundle },
        headers: { 'Cache-Control': 'public, max-age=60' },
      };
    }

    const { bundleUrl: _omit, ...safeCourse } = course;
    return {
      status: 200,
      jsonBody: safeCourse,
      headers: { 'Cache-Control': 'public, max-age=60' },
    };
  }

  // List all published courses — strip bundleUrl from each entry.
  const audience = req.query.get('audience');
  const level = req.query.get('level');
  const tag = req.query.get('tag');

  let courses = await listPublishedCourses();
  if (audience) courses = courses.filter((c) => c.audience === audience || c.audience === 'all');
  if (level) courses = courses.filter((c) => c.level === level);
  if (tag) courses = courses.filter((c) => c.tags.includes(tag));

  const safeCourses = courses.map(({ bundleUrl: _omit, ...c }) => c);

  context.log(`Catalogue: returning ${safeCourses.length} courses`);
  return {
    status: 200,
    jsonBody: { courses: safeCourses, total: safeCourses.length },
    headers: { 'Cache-Control': 'public, max-age=30' },
  };
}

app.http('getCatalogue', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'catalogue/{slug?}',
  handler: getCatalogueHandler,
});
