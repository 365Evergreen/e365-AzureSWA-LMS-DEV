import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { extractBearerToken, validateToken, hasRole } from '../middleware/validateToken';
import { fetchProgressRecord } from '../lib/storage';

async function getProgressHandler(
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

  if (!hasRole(claims, 'Learner') && !hasRole(claims, 'Admin')) {
    return { status: 403, jsonBody: { error: 'Learner or Admin role required' } };
  }

  const { userId, courseId } = req.params;

  // Learners may only read their own progress; Admins can read any
  if (!hasRole(claims, 'Admin') && claims.oid !== userId) {
    return { status: 403, jsonBody: { error: 'Access denied' } };
  }

  const record = await fetchProgressRecord(userId, courseId);
  if (!record) {
    return { status: 404, jsonBody: { error: 'Progress record not found' } };
  }

  return { status: 200, jsonBody: record };
}

app.http('getProgress', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'progress/{userId}/{courseId}',
  handler: getProgressHandler,
});
