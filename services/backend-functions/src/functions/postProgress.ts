import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ProgressRecordSchema } from '@lms/shared-schemas';
import { extractBearerToken, validateToken, hasRole } from '../middleware/validateToken';
import { upsertProgressRecord } from '../lib/storage';

async function postProgressHandler(
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

  if (!hasRole(claims, 'Learner')) {
    return { status: 403, jsonBody: { error: 'Learner role required' } };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { error: 'Request body must be valid JSON' } };
  }

  const parsed = ProgressRecordSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      jsonBody: { error: 'Invalid progress record', details: parsed.error.flatten() },
    };
  }

  // Learners may only write their own progress
  if (parsed.data.userId !== claims.oid) {
    return { status: 403, jsonBody: { error: 'Access denied' } };
  }

  await upsertProgressRecord(parsed.data);

  context.log(`Progress upserted for user ${claims.oid}, course ${parsed.data.courseId}`);
  return { status: 204 };
}

app.http('postProgress', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'progress',
  handler: postProgressHandler,
});
