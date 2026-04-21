import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { randomUUID } from 'crypto';
import { ContentBundleSchema } from '@lms/shared-schemas';
import { canPublishContent, extractBearerToken, validateToken } from '../middleware/validateToken';
import { uploadBundle, upsertCourseMetadata } from '../lib/storage';

async function publishHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const token = extractBearerToken(req);
  if (!token) return { status: 401, jsonBody: { error: 'Missing bearer token' } };

  let claims;
  try {
    claims = await validateToken(token);
  } catch (err) {
    context.warn('Token validation failed:', err);
    return { status: 401, jsonBody: { error: 'Invalid or expired token' } };
  }

  if (!canPublishContent(claims)) {
    return { status: 403, jsonBody: { error: 'Publisher, Admin, or ContentEditor role required' } };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { error: 'Request body must be valid JSON' } };
  }

  const RequestSchema = ContentBundleSchema.omit({ bundleId: true, publishedBy: true });
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      jsonBody: { error: 'Invalid content bundle', details: parsed.error.flatten() },
    };
  }

  const bundleId = randomUUID();
  const now = new Date().toISOString();
  const bundle = { ...parsed.data, bundleId, publishedBy: claims.oid };

  const bundleUrl = await uploadBundle(bundleId, bundle);

  // Upsert catalogue metadata so the course appears in the public catalogue
  const { metadata, courseId } = parsed.data;
  const slug = (body as Record<string, unknown>).slug as string | undefined;
  if (slug) {
    await upsertCourseMetadata({
      courseId,
      slug,
      title: metadata.title,
      description: metadata.description ?? '',
      status: 'published',
      audience: ((body as Record<string, unknown>).audience as string ?? 'all') as 'all',
      level: ((body as Record<string, unknown>).level as string ?? 'beginner') as 'beginner',
      tags: ((body as Record<string, unknown>).tags as string[]) ?? [],
      thumbnailUrl: (body as Record<string, unknown>).thumbnailUrl as string | undefined,
      bundleUrl,
      authorId: claims.oid as string,
      publishedAt: now,
      updatedAt: now,
      moduleCount: ((body as Record<string, unknown>).moduleCount as number) ?? 0,
      durationMinutes: ((body as Record<string, unknown>).durationMinutes as number) ?? 0,
    });
  }

  if (process.env.CDN_PURGE_ENDPOINT) {
    context.log(`CDN purge stub: ${process.env.CDN_PURGE_ENDPOINT}/content-bundles/${bundleId}`);
  }

  context.log(`Published bundle ${bundleId} by ${claims.oid}`);
  return { status: 201, jsonBody: { bundleId, bundleUrl } };
}

app.http('publish', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'publish',
  handler: publishHandler,
});
