import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getSitePageBySlug, fetchSiteBundle, listSitePages } from '../lib/storage';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function getPagesHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: CORS_HEADERS };
  }

  const rawType = req.query.get('type') ?? 'page';
  const contentType = (['page', 'post', 'knowledge'] as const).includes(rawType as never)
    ? (rawType as 'page' | 'post' | 'knowledge')
    : 'page';

  try {
    const pages = await listSitePages(contentType);
    return {
      status: 200,
      jsonBody: { pages, total: pages.length },
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=60' },
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
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: CORS_HEADERS };
  }

  const slug = req.params.slug;
  if (!slug) return { status: 400, jsonBody: { error: 'slug is required' } };

  const rawType = req.query.get('type') ?? 'page';
  const contentType = (['page', 'post', 'knowledge'] as const).includes(rawType as never)
    ? (rawType as 'page' | 'post' | 'knowledge')
    : 'page';

  try {
    const meta = await getSitePageBySlug(slug, contentType);
    if (!meta || meta.status !== 'published') {
      return { status: 404, jsonBody: { error: 'Page not found' }, headers: CORS_HEADERS };
    }

    const bundle = await fetchSiteBundle(meta.pageId);
    if (!bundle) {
      context.warn(`Bundle missing for page ${slug} (pageId: ${meta.pageId})`);
      return { status: 404, jsonBody: { error: 'Content bundle not found' }, headers: CORS_HEADERS };
    }

    return {
      status: 200,
      jsonBody: { metadata: meta, bundle },
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=60' },
    };
  } catch (err) {
    context.error('getPage error:', err);
    return { status: 500, jsonBody: { error: 'Failed to load page' } };
  }
}

app.http('listPublicPages', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'pages',
  handler: getPagesHandler,
});

app.http('getPage', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'pages/{slug}',
  handler: getPageHandler,
});
