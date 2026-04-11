import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { extractBearerToken, validateToken, hasRole } from '../middleware/validateToken';
import { listAllSitePages } from '../lib/storage';

async function adminListPagesHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('adminListPages called');

  const token = extractBearerToken(req);
  if (!token) return { status: 401, body: 'Unauthorized' };
  const claims = await validateToken(token);
  if (!claims) return { status: 401, body: 'Invalid token' };
  if (!hasRole(claims, 'ContentEditor') && !hasRole(claims, 'Admin')) {
    return { status: 403, body: 'Forbidden' };
  }

  const rawType = req.query.get('contentType') ?? 'page';
  const contentType = (['page', 'post', 'knowledge'] as const).includes(rawType as never)
    ? (rawType as 'page' | 'post' | 'knowledge')
    : 'page';

  const pages = await listAllSitePages(contentType);
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pages),
  };
}

app.http('adminListPages', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'editor/pages',
  handler: adminListPagesHandler,
});
