import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { extractBearerToken, validateToken, hasRole } from '../middleware/validateToken';
import { patchSitePageMeta } from '../lib/storage';

const PatchSchema = z.object({
  contentType: z.enum(['page', 'post', 'knowledge']).default('page'),
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'deleted']).optional(),
  publishedAt: z.string().datetime().optional(),
  featuredImage: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  primaryCategoryId: z.string().optional(),
  inNav: z.boolean().optional(),
  navLabel: z.string().optional(),
  navParent: z.string().optional(),
  navOrder: z.number().optional(),
});

async function patchPageMetaHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const slug = req.params.slug;
  if (!slug) return { status: 400, body: 'slug is required' };

  const token = extractBearerToken(req);
  if (!token) return { status: 401, body: 'Unauthorized' };
  const claims = await validateToken(token);
  if (!claims) return { status: 401, body: 'Invalid token' };
  if (!hasRole(claims, 'ContentEditor') && !hasRole(claims, 'Admin')) {
    return { status: 403, body: 'Forbidden' };
  }

  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, body: 'Invalid JSON' }; }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { error: 'Invalid request', details: parsed.error.flatten() } };
  }

  if (
    parsed.data.primaryCategoryId &&
    parsed.data.categoryIds &&
    !parsed.data.categoryIds.includes(parsed.data.primaryCategoryId)
  ) {
    return { status: 400, jsonBody: { error: 'primaryCategoryId must be included in categoryIds' } };
  }

  const { contentType, ...patch } = parsed.data;
  await patchSitePageMeta(slug, contentType, patch);
  context.log(`patchPageMeta: patched ${contentType}/${slug}`);
  return { status: 204 };
}

app.http('patchPageMeta', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'pages/{slug}',
  handler: patchPageMetaHandler,
});
