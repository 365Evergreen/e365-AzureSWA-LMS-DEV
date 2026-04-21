import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { acceptSignupRequestByInvitedUserId } from '../lib/storage';
import { extractBearerToken, validateToken } from '../middleware/validateToken';

async function acceptSignupRequestHandler(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const token = extractBearerToken(req);
  if (!token) {
    return { status: 401, jsonBody: { error: 'Missing bearer token' } };
  }

  let claims;
  try {
    claims = await validateToken(token);
  } catch (error) {
    context.warn('acceptSignupRequest: token validation failed', error);
    return { status: 401, jsonBody: { error: 'Invalid or expired token' } };
  }

  const updated = await acceptSignupRequestByInvitedUserId(claims.oid);
  context.log(`acceptSignupRequest: ${updated ? 'updated' : 'no-match'} for ${claims.oid}`);
  return { status: 204 };
}

app.http('acceptSignupRequest', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'signup-requests/accept',
  handler: acceptSignupRequestHandler,
});
