import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { canEditContent, extractBearerToken, validateToken, type AuthClaims } from '../middleware/validateToken';
import {
  upsertCatalogueItem,
  getCatalogueItem,
  listCatalogueItems,
  patchCatalogueItem,
  addModuleToPath,
  listPathModules,
  removeModuleFromPath,
  reorderPathModules,
  addUnitToModule,
  listModuleUnits,
  removeUnitFromModule,
  reorderModuleUnits,
  uploadUnitContent,
  fetchUnitContent,
  createContentVersion,
  getLatestVersionNumber,
  getContentVersion,
  writeCatalogueBrowseEntry,
  deleteCatalogueBrowseEntry,
  listCatalogueBrowse,
  syncCourseLandingPageFromPath,
  listEnrolmentsByPath,
  upsertEnrolmentRecord,
} from '../lib/storage';
import type { CatalogueItem, PathDetail, UnitDetail } from '@lms/shared-schemas';
import { listGroupMemberUserIds } from '../lib/entra';

const INTERNAL_USERS_GROUP_ID = '848a02f0-407f-4dc1-a77c-8d314f8d0de3';

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function requireContentEditor(
  req: HttpRequest
): Promise<{ claims: AuthClaims } | { error: HttpResponseInit }> {
  const token = extractBearerToken(req);
  if (!token) return { error: { status: 401, jsonBody: { error: 'Missing bearer token' } } };
  let claims: AuthClaims;
  try {
    claims = await validateToken(token);
  } catch (err) {
    return { error: { status: 401, jsonBody: { error: 'Invalid or expired token', detail: (err as Error).message } } };
  }
  if (!canEditContent(claims)) {
    return { error: { status: 403, jsonBody: { error: 'Author, Publisher, Admin, or ContentEditor role required' } } };
  }
  return { claims };
}

// ─── Editor: list all catalogue items ────────────────────────────────────────
// GET /api/editor/catalogue?type=PATH&status=Draft

async function editorListCatalogueHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) return auth.error;

  const type = (req.query.get('type') ?? 'PATH') as CatalogueItem['itemType'];
  const status = req.query.get('status') as CatalogueItem['status'] | null;

  const items = await listCatalogueItems(type, status ?? undefined);
  context.log(`[catalogue] listed ${items.length} ${type} items`);
  return { status: 200, jsonBody: { items, total: items.length } };
}

// ─── Editor: get item with full structure ─────────────────────────────────────
// GET /api/editor/catalogue/{type}/{itemId}

async function editorGetCatalogueItemHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) return auth.error;

  const { type, itemId } = req.params as { type: string; itemId: string };
  const itemType = type.toUpperCase() as CatalogueItem['itemType'];

  const item = await getCatalogueItem(itemType, itemId);
  if (!item) return { status: 404, jsonBody: { error: 'Not found' } };

  if (itemType === 'PATH') {
    const moduleLinks = await listPathModules(itemId);
    const modules = await Promise.all(
      moduleLinks.map(async (link) => {
        const mod = await getCatalogueItem('MODULE', link.moduleId);
        if (!mod) return null;
        const unitLinks = await listModuleUnits(link.moduleId);
        const units = await Promise.all(
          unitLinks.map(async (ul) => {
            const unit = await getCatalogueItem('UNIT', ul.unitId);
            return unit ? { ...unit, sortOrder: ul.sortOrder, isOptional: ul.isOptional, unitType: ul.unitType } : null;
          })
        );
        return {
          ...mod,
          sortOrder: link.sortOrder,
          isOptional: link.isOptional,
          units: units.filter(Boolean),
        };
      })
    );
    const detail: PathDetail = { ...item, modules: modules.filter(Boolean) as PathDetail['modules'] };
    return { status: 200, jsonBody: detail };
  }

  if (itemType === 'UNIT' && item.currentVersionId) {
    const vNum = parseInt(item.currentVersionId, 10);
    const version = await getContentVersion(itemId, vNum);
    let blocks: UnitDetail['blocks'] = [];
    if (version) {
      const content = await fetchUnitContent(version.contentUri);
      blocks = (content?.blocks as UnitDetail['blocks']) ?? [];
    }
    const detail: UnitDetail = { ...item, currentVersion: version ?? undefined, blocks };
    return { status: 200, jsonBody: detail };
  }

  return { status: 200, jsonBody: item };
}

// ─── Create learning path ─────────────────────────────────────────────────────
// POST /api/catalogue/paths

const CreatePathSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().optional().default(''),
  difficulty: z.enum(['Foundation', 'Beginner', 'Intermediate', 'Advanced']).optional(),
  role: z.string().optional().default(''),
  learningPath: z.string().optional().default(''),
  estimatedMinutes: z.number().int().nonnegative().optional().default(0),
  isMandatory: z.boolean().optional().default(false),
  visibility: z.enum(['Public', 'Enrolled']).optional().default('Public'),
  thumbnailUrl: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  language: z.string().optional().default('en'),
});

async function createPathHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) return auth.error;
  const { claims } = auth;

  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, jsonBody: { error: 'Invalid JSON' } }; }

  const parsed = CreatePathSchema.safeParse(body);
  if (!parsed.success) return { status: 400, jsonBody: { error: 'Validation failed', details: parsed.error.flatten() } };

  const now = new Date().toISOString();
  const item: CatalogueItem = {
    itemId: randomUUID(),
    itemType: 'PATH',
    slug: parsed.data.slug,
    title: parsed.data.title,
    summary: parsed.data.summary,
    language: parsed.data.language,
    difficulty: parsed.data.difficulty,
    role: parsed.data.role,
    learningPath: parsed.data.learningPath,
    estimatedMinutes: parsed.data.estimatedMinutes,
    isMandatory: parsed.data.isMandatory,
    visibility: parsed.data.visibility,
    status: 'Draft',
    thumbnailUrl: parsed.data.thumbnailUrl,
    tagsCsv: parsed.data.tags.join(','),
    createdOn: now,
    updatedOn: now,
    authorId: claims.oid as string || '',
    tenantId: 'default',
  };

  await upsertCatalogueItem(item);
  await syncCourseLandingPageFromPath(item);
  if (item.isMandatory) {
    await syncMandatoryEnrolments(item.itemId, item.tenantId, context);
  }
  context.log(`[catalogue] created PATH ${item.itemId} "${item.title}"`);
  return { status: 201, jsonBody: item };
}

// ─── Patch catalogue item metadata ───────────────────────────────────────────
// PATCH /api/catalogue/items/{type}/{itemId}

const PatchItemSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  summary: z.string().optional(),
  difficulty: z.enum(['Foundation', 'Beginner', 'Intermediate', 'Advanced']).optional(),
  role: z.string().optional(),
  learningPath: z.string().optional(),
  estimatedMinutes: z.number().int().nonnegative().optional(),
  isMandatory: z.boolean().optional(),
  visibility: z.enum(['Public', 'Enrolled']).optional(),
  thumbnailUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  language: z.string().optional(),
  status: z.enum(['Draft', 'Published', 'Archived']).optional(),
  unitType: z.enum(['Lesson', 'Video', 'Assessment', 'Interactive']).optional(),
});

async function patchCatalogueItemHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) return auth.error;

  const { type, itemId } = req.params as { type: string; itemId: string };
  const itemType = type.toUpperCase() as CatalogueItem['itemType'];

  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, jsonBody: { error: 'Invalid JSON' } }; }

  const parsed = PatchItemSchema.safeParse(body);
  if (!parsed.success) return { status: 400, jsonBody: { error: 'Validation failed', details: parsed.error.flatten() } };

  const patch: Partial<CatalogueItem> = { ...parsed.data };
  if (parsed.data.tags !== undefined) {
    (patch as Record<string, unknown>).tagsCsv = parsed.data.tags.join(',');
    delete (patch as Record<string, unknown>).tags;
  }

  await patchCatalogueItem(itemType, itemId, patch);
  if (itemType === 'PATH') {
    const updated = await getCatalogueItem(itemType, itemId);
    if (updated) {
      await syncCourseLandingPageFromPath(updated);
      if (updated.isMandatory) {
        await syncMandatoryEnrolments(updated.itemId, updated.tenantId, context);
      }
    }
  }
  context.log(`[catalogue] patched ${itemType} ${itemId}`);
  return { status: 200, jsonBody: { ok: true } };
}

async function syncMandatoryEnrolments(
  pathId: string,
  tenantId: string,
  context: InvocationContext,
): Promise<void> {
  const [memberIds, existingEnrolments] = await Promise.all([
    listGroupMemberUserIds(INTERNAL_USERS_GROUP_ID),
    listEnrolmentsByPath(pathId),
  ]);

  const existingByUserId = new Map(existingEnrolments.map((enrolment) => [enrolment.userId, enrolment]));
  const assignedOn = new Date().toISOString();

  for (const userId of memberIds) {
    const existing = existingByUserId.get(userId);
    if (existing && existing.status !== 'Withdrawn') {
      continue;
    }

    await upsertEnrolmentRecord({
      userId,
      pathId,
      assignedOn,
      status: 'Assigned',
      source: 'Assigned',
      tenantId: tenantId || 'default',
    });
  }

  context.log(`[catalogue] synced ${memberIds.length} mandatory enrolments for PATH ${pathId}`);
}

// ─── Soft-delete (archive) ────────────────────────────────────────────────────
// DELETE /api/catalogue/items/{type}/{itemId}

async function archiveCatalogueItemHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) return auth.error;

  const { type, itemId } = req.params as { type: string; itemId: string };
  const itemType = type.toUpperCase() as CatalogueItem['itemType'];

  const item = await getCatalogueItem(itemType, itemId);
  if (!item) return { status: 404, jsonBody: { error: 'Not found' } };

  await patchCatalogueItem(itemType, itemId, { status: 'Archived' });
  await deleteCatalogueBrowseEntry({ ...item, status: item.status });
  context.log(`[catalogue] archived ${itemType} ${itemId}`);
  return { status: 200, jsonBody: { ok: true } };
}

// ─── Add module to path ───────────────────────────────────────────────────────
// POST /api/catalogue/paths/{pathId}/modules

const AddModuleSchema = z.object({
  title: z.string().min(1),
  isOptional: z.boolean().optional().default(false),
});

async function addModuleHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) return auth.error;
  const { claims } = auth;

  const { pathId } = req.params as { pathId: string };

  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, jsonBody: { error: 'Invalid JSON' } }; }

  const parsed = AddModuleSchema.safeParse(body);
  if (!parsed.success) return { status: 400, jsonBody: { error: 'Validation failed', details: parsed.error.flatten() } };

  const now = new Date().toISOString();
  const moduleItem: CatalogueItem = {
    itemId: randomUUID(),
    itemType: 'MODULE',
    slug: `module-${Date.now()}`,
    title: parsed.data.title,
    summary: '',
    language: 'en',
    estimatedMinutes: 0,
    visibility: 'Public',
    status: 'Draft',
    tagsCsv: '',
    createdOn: now,
    updatedOn: now,
    authorId: claims.oid as string || '',
    tenantId: 'default',
  };

  await upsertCatalogueItem(moduleItem);

  const existing = await listPathModules(pathId);
  const sortOrder = existing.length === 0 ? 10 : (Math.max(...existing.map(m => m.sortOrder)) + 10);

  await addModuleToPath({ pathId, moduleId: moduleItem.itemId, sortOrder, isOptional: parsed.data.isOptional });

  context.log(`[catalogue] added MODULE ${moduleItem.itemId} to PATH ${pathId}`);
  return { status: 201, jsonBody: { module: moduleItem, sortOrder } };
}

// ─── Reorder modules in path ──────────────────────────────────────────────────
// PUT /api/catalogue/paths/{pathId}/modules/order

async function reorderModulesHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) return auth.error;

  const { pathId } = req.params as { pathId: string };
  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, jsonBody: { error: 'Invalid JSON' } }; }

  const parsed = z.object({ moduleIds: z.array(z.string().uuid()) }).safeParse(body);
  if (!parsed.success) return { status: 400, jsonBody: { error: 'moduleIds array required' } };

  await reorderPathModules(pathId, parsed.data.moduleIds);
  context.log(`[catalogue] reordered modules in PATH ${pathId}`);
  return { status: 200, jsonBody: { ok: true } };
}

// ─── Remove module from path ──────────────────────────────────────────────────
// DELETE /api/catalogue/paths/{pathId}/modules/{moduleId}

async function removeModuleHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) return auth.error;

  const { pathId, moduleId } = req.params as { pathId: string; moduleId: string };
  await removeModuleFromPath(pathId, moduleId);
  return { status: 200, jsonBody: { ok: true } };
}

// ─── Add unit to module ───────────────────────────────────────────────────────
// POST /api/catalogue/modules/{moduleId}/units

const AddUnitSchema = z.object({
  title: z.string().min(1),
  unitType: z.enum(['Lesson', 'Video', 'Assessment', 'Interactive']).optional().default('Lesson'),
  isOptional: z.boolean().optional().default(false),
  estimatedMinutes: z.number().int().nonnegative().optional().default(0),
});

async function addUnitHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) return auth.error;
  const { claims } = auth;

  const { moduleId } = req.params as { moduleId: string };

  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, jsonBody: { error: 'Invalid JSON' } }; }

  const parsed = AddUnitSchema.safeParse(body);
  if (!parsed.success) return { status: 400, jsonBody: { error: 'Validation failed', details: parsed.error.flatten() } };

  const now = new Date().toISOString();
  const unitItem: CatalogueItem = {
    itemId: randomUUID(),
    itemType: 'UNIT',
    slug: `unit-${Date.now()}`,
    title: parsed.data.title,
    summary: '',
    language: 'en',
    estimatedMinutes: parsed.data.estimatedMinutes,
    visibility: 'Public',
    status: 'Draft',
    tagsCsv: '',
    unitType: parsed.data.unitType,
    createdOn: now,
    updatedOn: now,
    authorId: claims.oid as string || '',
    tenantId: 'default',
  };

  await upsertCatalogueItem(unitItem);

  const existing = await listModuleUnits(moduleId);
  const sortOrder = existing.length === 0 ? 10 : (Math.max(...existing.map(u => u.sortOrder)) + 10);

  await addUnitToModule({
    moduleId,
    unitId: unitItem.itemId,
    sortOrder,
    isOptional: parsed.data.isOptional,
    unitType: parsed.data.unitType,
  });

  context.log(`[catalogue] added UNIT ${unitItem.itemId} to MODULE ${moduleId}`);
  return { status: 201, jsonBody: { unit: unitItem, sortOrder } };
}

// ─── Reorder units in module ──────────────────────────────────────────────────
// PUT /api/catalogue/modules/{moduleId}/units/order

async function reorderUnitsHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) return auth.error;

  const { moduleId } = req.params as { moduleId: string };
  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, jsonBody: { error: 'Invalid JSON' } }; }

  const parsed = z.object({ unitIds: z.array(z.string().uuid()) }).safeParse(body);
  if (!parsed.success) return { status: 400, jsonBody: { error: 'unitIds array required' } };

  await reorderModuleUnits(moduleId, parsed.data.unitIds);
  return { status: 200, jsonBody: { ok: true } };
}

// ─── Remove unit from module ──────────────────────────────────────────────────
// DELETE /api/catalogue/modules/{moduleId}/units/{unitId}

async function removeUnitHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) return auth.error;

  const { moduleId, unitId } = req.params as { moduleId: string; unitId: string };
  await removeUnitFromModule(moduleId, unitId);
  return { status: 200, jsonBody: { ok: true } };
}

// ─── Save unit content (creates ContentVersion) ───────────────────────────────
// POST /api/catalogue/units/{unitId}/content

const SaveUnitContentSchema = z.object({
  blocks: z.array(z.object({
    id: z.string(),
    type: z.string(),
    version: z.number().optional().default(1),
    payload: z.record(z.unknown()),
  })),
  changeLog: z.string().optional().default(''),
});

async function saveUnitContentHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) return auth.error;
  const { claims } = auth;

  const { unitId } = req.params as { unitId: string };

  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, jsonBody: { error: 'Invalid JSON' } }; }

  const parsed = SaveUnitContentSchema.safeParse(body);
  if (!parsed.success) return { status: 400, jsonBody: { error: 'Validation failed', details: parsed.error.flatten() } };

  const now = new Date().toISOString();
  const contentUri = await uploadUnitContent(unitId, parsed.data.blocks);
  const prevVersion = await getLatestVersionNumber(unitId);
  const nextVersion = prevVersion + 1;

  await createContentVersion({
    itemId: unitId,
    versionNumber: nextVersion,
    publishedOn: now,
    publishedByUserId: claims.oid as string || '',
    contentUri,
    changeLog: parsed.data.changeLog,
  });

  // Update unit's currentVersionId
  await patchCatalogueItem('UNIT', unitId, { currentVersionId: String(nextVersion), updatedOn: now });

  context.log(`[catalogue] saved content v${nextVersion} for UNIT ${unitId}`);
  return { status: 200, jsonBody: { versionNumber: nextVersion, contentUri } };
}

// ─── Publish catalogue item ───────────────────────────────────────────────────
// POST /api/catalogue/items/{type}/{itemId}/publish

async function publishCatalogueItemHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) return auth.error;

  const { type, itemId } = req.params as { type: string; itemId: string };
  const itemType = type.toUpperCase() as CatalogueItem['itemType'];

  const item = await getCatalogueItem(itemType, itemId);
  if (!item) return { status: 404, jsonBody: { error: 'Not found' } };

  const now = new Date().toISOString();

  // If previously published, remove old browse entry first
  if (item.status === 'Published') {
    await deleteCatalogueBrowseEntry(item);
  }

  const updated: CatalogueItem = { ...item, status: 'Published', updatedOn: now };
  await upsertCatalogueItem(updated);
  await writeCatalogueBrowseEntry(updated);

  context.log(`[catalogue] published ${itemType} ${itemId}`);
  return { status: 200, jsonBody: { ok: true, status: 'Published' } };
}

// ─── Public: browse published paths ───────────────────────────────────────────
// GET /api/catalogue/browse?type=PATH

async function publicBrowseCatalogueHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const type = (req.query.get('type') ?? 'PATH') as CatalogueItem['itemType'];
  const items = await listCatalogueBrowse(type, 'Published');
  context.log(`[catalogue] public browse: ${items.length} ${type} items`);
  return {
    status: 200,
    jsonBody: { items, total: items.length },
    headers: {
      'Cache-Control': 'public, max-age=30',
      'Access-Control-Allow-Origin': '*',
    },
  };
}

// ─── Public: get path with module list ────────────────────────────────────────
// GET /api/catalogue/paths/{pathId}

async function publicGetPathHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const { pathId } = req.params as { pathId: string };

  const path = await getCatalogueItem('PATH', pathId);
  if (!path || path.status !== 'Published') {
    return { status: 404, jsonBody: { error: 'Not found' } };
  }

  const moduleLinks = await listPathModules(pathId);
  const modules = await Promise.all(
    moduleLinks.map(async (link) => {
      const mod = await getCatalogueItem('MODULE', link.moduleId);
      if (!mod) return null;

      const unitLinks = await listModuleUnits(link.moduleId);
      const units = await Promise.all(
        unitLinks.map(async (unitLink) => {
          const unit = await getCatalogueItem('UNIT', unitLink.unitId);
          return unit
            ? { ...unit, sortOrder: unitLink.sortOrder, isOptional: unitLink.isOptional, unitType: unitLink.unitType }
            : null;
        })
      );

      return {
        ...mod,
        sortOrder: link.sortOrder,
        isOptional: link.isOptional,
        units: units.filter(Boolean),
      };
    })
  );

  return {
    status: 200,
    jsonBody: { ...path, modules: modules.filter(Boolean) },
    headers: { 'Cache-Control': 'public, max-age=60', 'Access-Control-Allow-Origin': '*' },
  };
}

// ─── Public: get module with unit list ────────────────────────────────────────
// GET /api/catalogue/paths/{pathId}/modules/{moduleId}

async function publicGetModuleHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const { moduleId } = req.params as { pathId: string; moduleId: string };

  const mod = await getCatalogueItem('MODULE', moduleId);
  if (!mod) return { status: 404, jsonBody: { error: 'Not found' } };

  const unitLinks = await listModuleUnits(moduleId);
  const units = await Promise.all(
    unitLinks.map(async (link) => {
      const unit = await getCatalogueItem('UNIT', link.unitId);
      return unit
        ? { ...unit, sortOrder: link.sortOrder, isOptional: link.isOptional, unitType: link.unitType }
        : null;
    })
  );

  return {
    status: 200,
    jsonBody: { ...mod, units: units.filter(Boolean) },
    headers: { 'Cache-Control': 'public, max-age=60', 'Access-Control-Allow-Origin': '*' },
  };
}

// ─── Public: get unit with current content ────────────────────────────────────
// GET /api/catalogue/units/{unitId}

async function publicGetUnitHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const { unitId } = req.params as { unitId: string };

  const unit = await getCatalogueItem('UNIT', unitId);
  if (!unit) return { status: 404, jsonBody: { error: 'Not found' } };

  let blocks: unknown[] = [];
  let currentVersion = null;
  if (unit.currentVersionId) {
    const vNum = parseInt(unit.currentVersionId, 10);
    currentVersion = await getContentVersion(unitId, vNum);
    if (currentVersion) {
      const content = await fetchUnitContent(currentVersion.contentUri);
      blocks = (content?.blocks as unknown[]) ?? [];
    }
  }

  return {
    status: 200,
    jsonBody: { ...unit, currentVersion, blocks },
    headers: { 'Cache-Control': 'public, max-age=60', 'Access-Control-Allow-Origin': '*' },
  };
}

// ─── Route registrations ──────────────────────────────────────────────────────

app.http('editorListCatalogue', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'editor/catalogue',
  handler: editorListCatalogueHandler,
});

app.http('editorGetCatalogueItem', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'editor/catalogue/{type}/{itemId}',
  handler: editorGetCatalogueItemHandler,
});

app.http('createPath', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'catalogue/paths',
  handler: createPathHandler,
});

app.http('patchCatalogueItem', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'catalogue/items/{type}/{itemId}',
  handler: patchCatalogueItemHandler,
});

app.http('archiveCatalogueItem', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'catalogue/items/{type}/{itemId}',
  handler: archiveCatalogueItemHandler,
});

app.http('addModule', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'catalogue/paths/{pathId}/modules',
  handler: addModuleHandler,
});

app.http('reorderModules', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'catalogue/paths/{pathId}/modules/order',
  handler: reorderModulesHandler,
});

app.http('removeModule', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'catalogue/paths/{pathId}/modules/{moduleId}',
  handler: removeModuleHandler,
});

app.http('addUnit', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'catalogue/modules/{moduleId}/units',
  handler: addUnitHandler,
});

app.http('reorderUnits', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'catalogue/modules/{moduleId}/units/order',
  handler: reorderUnitsHandler,
});

app.http('removeUnit', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'catalogue/modules/{moduleId}/units/{unitId}',
  handler: removeUnitHandler,
});

app.http('saveUnitContent', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'catalogue/units/{unitId}/content',
  handler: saveUnitContentHandler,
});

app.http('publishCatalogueItem', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'catalogue/items/{type}/{itemId}/publish',
  handler: publishCatalogueItemHandler,
});

app.http('publicBrowseCatalogue', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'catalogue/browse',
  handler: publicBrowseCatalogueHandler,
});

app.http('publicBrowseCatalogueIndex', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'catalogue-index',
  handler: publicBrowseCatalogueHandler,
});

app.http('publicGetPath', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'catalogue/paths/{pathId}',
  handler: publicGetPathHandler,
});

app.http('publicGetModule', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'catalogue/paths/{pathId}/modules/{moduleId}',
  handler: publicGetModuleHandler,
});

app.http('publicGetUnit', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'catalogue/units/{unitId}',
  handler: publicGetUnitHandler,
});
