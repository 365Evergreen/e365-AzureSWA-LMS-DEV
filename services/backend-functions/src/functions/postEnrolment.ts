import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { extractBearerToken, validateToken } from '../middleware/validateToken';
import { getCatalogueItem, upsertEnrolmentRecord } from '../lib/storage';

const enrolmentRequestSchema = z.object({
  pathId: z.string().uuid(),
});

async function postEnrolmentHandler(
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

  const body = await req.json();
  const parsed = enrolmentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      jsonBody: { error: 'Invalid enrolment request', details: parsed.error.flatten() },
    };
  }

  const path = await getCatalogueItem('PATH', parsed.data.pathId);
  if (!path || path.status !== 'Published') {
    return { status: 404, jsonBody: { error: 'Course not found' } };
  }

  const now = new Date().toISOString();
  await upsertEnrolmentRecord({
    userId: claims.oid as string,
    pathId: parsed.data.pathId,
    enrolledOn: now,
    status: 'Active',
    source: 'Self',
    tenantId: (claims.tid as string) || 'default',
  });

  context.log(`[enrolment] user ${claims.oid} enrolled in path ${parsed.data.pathId}`);
  return {
    status: 200,
    jsonBody: {
      userId: claims.oid,
      pathId: parsed.data.pathId,
      status: 'Active',
      enrolledOn: now,
    },
  };
}

app.http('postEnrolment', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'enrolment',
  handler: postEnrolmentHandler,
});
