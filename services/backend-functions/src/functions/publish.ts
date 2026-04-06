import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { randomUUID } from 'crypto';
import { ContentBundleSchema } from '@lms/shared-schemas';
import { extractBearerToken, validateToken, hasRole } from '../middleware/validateToken';
import { uploadBundle } from '../lib/storage';

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

  if (!hasRole(claims, 'ContentEditor')) {
    return { status: 403, jsonBody: { error: 'ContentEditor role required' } };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { error: 'Request body must be valid JSON' } };
  }

  // Accept the bundle payload without bundleId/publishedBy — both are set server-side
  const RequestSchema = ContentBundleSchema.omit({ bundleId: true, publishedBy: true });
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      jsonBody: { error: 'Invalid content bundle', details: parsed.error.flatten() },
    };
  }

  const bundleId = randomUUID();
  const bundle = {
    ...parsed.data,
    bundleId,
    publishedBy: claims.oid,
  };

  await uploadBundle(bundleId, bundle);

  if (process.env.CDN_PURGE_ENDPOINT) {
    context.log(`CDN purge stub: ${process.env.CDN_PURGE_ENDPOINT}/content-bundles/${bundleId}`);
  }

  context.log(`Published bundle ${bundleId} by ${claims.oid}`);
  return { status: 201, jsonBody: { bundleId } };
}

app.http('publish', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'publish',
  handler: publishHandler,
});
