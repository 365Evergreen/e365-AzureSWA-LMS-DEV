import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { extractBearerToken, validateToken, hasRole } from '../middleware/validateToken';
import { uploadMediaBlob } from '../lib/storage';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/ogg',
]);

async function uploadMediaHandler(
  req: HttpRequest,
  context: InvocationContext,
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

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return { status: 400, jsonBody: { error: 'Request must be multipart/form-data' } };
  }

  const file = formData.get('file') as File | null;
  if (!file) return { status: 400, jsonBody: { error: 'Missing file field' } };

  if (!ALLOWED_TYPES.has(file.type)) {
    return { status: 415, jsonBody: { error: `Unsupported media type: ${file.type}` } };
  }

  const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
  if (file.size > MAX_BYTES) {
    return { status: 413, jsonBody: { error: 'File exceeds 50 MB limit' } };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const item = await uploadMediaBlob(file.name, buffer, file.type);
  context.log(`Media uploaded: ${item.id} (${file.type}, ${file.size}B) by ${claims.oid}`);
  return { status: 201, jsonBody: item };
}

app.http('uploadMedia', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'media/upload',
  handler: uploadMediaHandler,
});
