import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { createBlogCategory, listBlogCategories } from '../lib/storage';
import { canEditContent, extractBearerToken, validateToken } from '../middleware/validateToken';

const CreateCategorySchema = z.object({
  taxonomy: z.enum(['post']).optional().default('post'),
  name: z.string().trim().min(1, 'name is required'),
  slug: z.string().trim().optional().default(''),
  parentId: z.string().optional(),
  sortOrder: z.number().int().nonnegative().optional().default(0),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function categoriesHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const token = extractBearerToken(req);
  if (!token) return { status: 401, body: 'Unauthorized' };

  const claims = await validateToken(token);
  if (!claims) return { status: 401, body: 'Invalid token' };
  if (!canEditContent(claims)) {
    return { status: 403, body: 'Forbidden' };
  }

  if (req.method === 'GET') {
    const taxonomy = req.query.get('taxonomy') === 'post' ? 'post' : 'post';
    const categories = await listBlogCategories(taxonomy);
    return { status: 200, jsonBody: categories };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { error: 'Request body must be valid JSON' } };
  }

  const parsed = CreateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { error: 'Invalid request', details: parsed.error.flatten() } };
  }

  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) {
    return { status: 400, jsonBody: { error: 'Category slug cannot be empty' } };
  }

  try {
    const category = await createBlogCategory({
      taxonomy: parsed.data.taxonomy,
      name: parsed.data.name,
      slug,
      parentId: parsed.data.parentId || undefined,
      sortOrder: parsed.data.sortOrder,
    });
    context.log(`categories: created ${category.path}`);
    return { status: 201, jsonBody: category };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create category';
    const status = message.includes('already exists') ? 409 : 400;
    return { status, jsonBody: { error: message } };
  }
}

app.http('categories', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'categories',
  handler: categoriesHandler,
});
