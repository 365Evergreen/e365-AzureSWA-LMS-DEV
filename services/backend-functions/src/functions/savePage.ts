import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { extractBearerToken, validateToken, hasRole } from '../middleware/validateToken';
import { uploadSiteBundle, upsertSitePageMetadata } from '../lib/storage';

const BlockSchema = z.object({
  id: z.string(),
  type: z.string(),
  version: z.number().optional().default(1),
  payload: z.record(z.unknown()),
});

const SavePageSchema = z.object({
  slug: z.string().min(1, 'slug is required'),
  title: z.string().min(1, 'title is required'),
  description: z.string().optional().default(''),
  templateId: z.string().min(1, 'templateId is required'),
  contentType: z.enum(['page', 'post', 'knowledge']),
  blocks: z.array(BlockSchema),
  status: z.enum(['draft', 'published']),
  publishedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional().default([]),
  featuredImage: z.string().optional().default(''),
  categoryIds: z.array(z.string()).optional().default([]),
  primaryCategoryId: z.string().optional(),
  inNav: z.boolean().optional().default(false),
  navLabel: z.string().optional().default(''),
  navParent: z.string().optional().default(''),
  navOrder: z.number().optional().default(0),
  linkedCourseId: z.string().optional().default(''),
  linkedCourseSlug: z.string().optional().default(''),
  linkedCourseTitle: z.string().optional().default(''),
});

async function savePageHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const token = extractBearerToken(req);
  if (!token) return { status: 401, jsonBody: { error: 'Missing bearer token' } };

  let claims;
  try {
    claims = await validateToken(token);
  } catch (err) {
    context.warn('Token validation failed:', (err as Error).message ?? err);
    return { status: 401, jsonBody: { error: 'Invalid or expired token', detail: (err as Error).message } };
  }

  if (!hasRole(claims, 'ContentEditor')) {
    return { status: 403, jsonBody: { error: 'ContentEditor role required' } };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { error: 'Request body must be valid JSON' } };
  }

  const parsed = SavePageSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      jsonBody: { error: 'Invalid request', details: parsed.error.flatten() },
    };
  }

  const { slug, title, description, templateId, contentType, blocks, status, publishedAt, tags, featuredImage,
          categoryIds, primaryCategoryId, inNav, navLabel, navParent, navOrder,
          linkedCourseId, linkedCourseSlug, linkedCourseTitle } = parsed.data;
  if (primaryCategoryId && !categoryIds.includes(primaryCategoryId)) {
    return { status: 400, jsonBody: { error: 'primaryCategoryId must be included in categoryIds' } };
  }
  const pageId = `${contentType}-${slug}`;
  const now = new Date().toISOString();
  const effectivePublishedAt = publishedAt || (status === 'published' ? now : '');

  const bundle = { pageId, slug, title, templateId, blocks, savedAt: now };
  const bundleUrl = await uploadSiteBundle(pageId, bundle);

  await upsertSitePageMetadata({
    pageId,
    slug,
    title,
    description,
    status,
    contentType,
    templateId,
    bundleUrl,
    featuredImage: featuredImage || undefined,
    categoryIds,
    primaryCategoryId: primaryCategoryId || undefined,
    publishedAt: effectivePublishedAt,
    updatedAt: now,
    author: claims.oid as string | undefined,
    tags,
    inNav,
    navLabel: navLabel || title,
    navParent,
    navOrder,
    linkedCourseId: linkedCourseId || undefined,
    linkedCourseSlug: linkedCourseSlug || undefined,
    linkedCourseTitle: linkedCourseTitle || undefined,
  });

  context.log(`Saved ${contentType} "${slug}" (${pageId}) by ${claims.oid} — status: ${status}`);
  return { status: 200, jsonBody: { pageId, slug, bundleUrl, status } };
}

app.http('savePage', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'pages',
  handler: savePageHandler,
});
