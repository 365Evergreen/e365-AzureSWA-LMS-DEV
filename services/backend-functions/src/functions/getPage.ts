import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getSitePageBySlug, fetchSiteBundle, listSitePages } from '../lib/storage';

async function getPagesHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const contentType = (req.query.get('type') ?? 'page') as 'page' | 'post';
  try {
    const pages = await listSitePages(contentType);
    return {
      status: 200,
      jsonBody: { pages, total: pages.length },
      headers: { 'Cache-Control': 'public, max-age=60' },
    };
  } catch (err) {
    context.error('listSitePages error:', err);
    return { status: 500, jsonBody: { error: 'Failed to list pages' } };
  }
}

async function getPageHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const slug = req.params.slug;
  if (!slug) return { status: 400, jsonBody: { error: 'slug is required' } };

  const contentType = (req.query.get('type') ?? 'page') as 'page' | 'post';

  try {
    const meta = await getSitePageBySlug(slug, contentType);
    if (!meta || meta.status !== 'published') {
      return { status: 404, jsonBody: { error: 'Page not found' } };
    }

    const bundle = await fetchSiteBundle(meta.pageId);
    if (!bundle) {
      context.warn(`Bundle missing for page ${slug} (pageId: ${meta.pageId})`);
      return { status: 404, jsonBody: { error: 'Content bundle not found' } };
    }

    return {
      status: 200,
      jsonBody: { metadata: meta, bundle },
      headers: { 'Cache-Control': 'public, max-age=60' },
    };
  } catch (err) {
    context.error('getPage error:', err);
    return { status: 500, jsonBody: { error: 'Failed to load page' } };
  }
}

app.http('listPages', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'pages',
  handler: getPagesHandler,
});

app.http('getPage', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'pages/{slug}',
  handler: getPageHandler,
});
