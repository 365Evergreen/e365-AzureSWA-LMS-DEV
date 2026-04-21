import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { canEditContent, extractBearerToken, validateToken } from '../middleware/validateToken';
import { getSitePageBySlug, fetchSiteBundle } from '../lib/storage';

async function getEditorPageHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const slug = req.params.slug;
  if (!slug) return { status: 400, body: 'slug is required' };

  const token = extractBearerToken(req);
  if (!token) return { status: 401, body: 'Unauthorized' };
  const claims = await validateToken(token);
  if (!claims) return { status: 401, body: 'Invalid token' };
  if (!canEditContent(claims)) {
    return { status: 403, body: 'Forbidden' };
  }

  const rawType = req.query.get('contentType') ?? 'page';
  const contentType = (['page', 'post', 'knowledge'] as const).includes(rawType as never)
    ? (rawType as 'page' | 'post' | 'knowledge')
    : 'page';

  const meta = await getSitePageBySlug(slug, contentType);
  if (!meta) {
    return { status: 404, jsonBody: { error: 'Page not found' } };
  }

  // Load the bundle (blocks + layout) regardless of published status
  const bundle = await fetchSiteBundle(meta.pageId);

  context.log(`getEditorPage: loaded ${contentType}/${slug} (${meta.status})`);
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata: meta, bundle }),
  };
}

app.http('getEditorPage', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'editor/pages/{slug}',
  handler: getEditorPageHandler,
});
