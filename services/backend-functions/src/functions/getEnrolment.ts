import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { extractBearerToken, validateToken, hasRole } from '../middleware/validateToken';
import { fetchEnrolments } from '../lib/storage';

async function getEnrolmentHandler(
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

  const { userId } = req.params;

  // Any authenticated user may read their own enrolments; Admins can read any
  if (!hasRole(claims, 'Admin') && claims.oid !== userId) {
    return { status: 403, jsonBody: { error: 'Access denied' } };
  }

  const enrolments = await fetchEnrolments(userId);

  context.log(`Fetched ${enrolments.length} enrolment(s) for user ${userId}`);
  return { status: 200, jsonBody: enrolments };
}

app.http('getEnrolment', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'enrolment/{userId}',
  handler: getEnrolmentHandler,
});
