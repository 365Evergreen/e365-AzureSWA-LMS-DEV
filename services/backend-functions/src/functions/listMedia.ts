import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { extractBearerToken, validateToken } from '../middleware/validateToken';
import { listMediaBlobs } from '../lib/storage';

async function listMediaHandler(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const token = extractBearerToken(req);
  if (!token) return { status: 401, jsonBody: { error: 'Missing bearer token' } };

  try {
    await validateToken(token);
  } catch (err) {
    context.warn('Token validation failed:', err);
    return { status: 401, jsonBody: { error: 'Invalid or expired token' } };
  }

  const items = await listMediaBlobs();
  return { status: 200, jsonBody: items };
}

app.http('listMedia', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'media',
  handler: listMediaHandler,
});
