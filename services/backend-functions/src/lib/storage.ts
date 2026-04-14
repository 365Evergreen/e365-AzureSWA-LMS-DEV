// Last deployed: 2026-04-10
import { BlobServiceClient } from '@azure/storage-blob';
import { TableClient, TableEntity } from '@azure/data-tables';
import { randomUUID } from 'crypto';
import type { BlogCategory, ProgressRecord, CourseEnrolment, CourseMetadata } from '@lms/shared-schemas';

function connectionString(): string {
  const cs = process.env.STORAGE_CONNECTION_STRING;
  if (!cs) throw new Error('STORAGE_CONNECTION_STRING is not configured');
  return cs;
}

// ─── Blob Storage ─────────────────────────────────────────────────────────────

export async function uploadBundle(bundleId: string, content: unknown): Promise<string> {
  const client = BlobServiceClient.fromConnectionString(connectionString());
  const container = client.getContainerClient('content-bundles');
  await container.createIfNotExists(); // private — served via backend only
  const blob = container.getBlockBlobClient(`${bundleId}.json`);
  const json = JSON.stringify(content);
  await blob.upload(json, Buffer.byteLength(json), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });
  return blob.url;
}

export async function fetchBundle(bundleId: string): Promise<unknown | null> {
  const client = BlobServiceClient.fromConnectionString(connectionString());
  const blob = client
    .getContainerClient('content-bundles')
    .getBlockBlobClient(`${bundleId}.json`);
  try {
    const download = await blob.download();
    const chunks: Buffer[] = [];
    for await (const chunk of download.readableStreamBody as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
  } catch {
    return null;
  }
}

// ─── Courses Table ────────────────────────────────────────────────────────────

const CATALOGUE_PK = 'catalogue';

function coursesTable(): TableClient {
  return TableClient.fromConnectionString(connectionString(), 'courses');
}

export async function upsertCourseMetadata(meta: CourseMetadata): Promise<void> {
  const client = coursesTable();
  await client.createTable().catch(() => {});
  await client.upsertEntity(
    {
      partitionKey: CATALOGUE_PK,
      rowKey: meta.slug,
      courseId: meta.courseId,
      title: meta.title,
      description: meta.description,
      status: meta.status,
      audience: meta.audience,
      level: meta.level,
      tags: meta.tags.join(','),
      thumbnailUrl: meta.thumbnailUrl ?? '',
      bundleUrl: meta.bundleUrl,
      authorId: meta.authorId,
      publishedAt: meta.publishedAt,
      updatedAt: meta.updatedAt,
      moduleCount: meta.moduleCount,
      durationMinutes: meta.durationMinutes,
    },
    'Replace'
  );
}

export async function listPublishedCourses(): Promise<CourseMetadata[]> {
  const client = coursesTable();
  await client.createTable().catch(() => {});
  const results: CourseMetadata[] = [];
  const entities = client.listEntities<Record<string, unknown>>({
    queryOptions: {
      filter: `PartitionKey eq '${CATALOGUE_PK}' and status eq 'published'`,
    },
  });
  for await (const e of entities) {
    results.push(entityToCourseMetadata(e));
  }
  return results.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export async function getCourseBySlug(slug: string): Promise<CourseMetadata | null> {
  const client = coursesTable();
  try {
    const e = await client.getEntity<Record<string, unknown>>(CATALOGUE_PK, slug);
    return entityToCourseMetadata(e);
  } catch {
    return null;
  }
}

function entityToCourseMetadata(e: Record<string, unknown>): CourseMetadata {
  return {
    courseId: e.courseId as string,
    slug: e.rowKey as string,
    title: e.title as string,
    description: e.description as string,
    status: e.status as CourseMetadata['status'],
    audience: e.audience as CourseMetadata['audience'],
    level: e.level as CourseMetadata['level'],
    tags: ((e.tags as string) || '').split(',').filter(Boolean),
    thumbnailUrl: (e.thumbnailUrl as string) || undefined,
    bundleUrl: e.bundleUrl as string,
    authorId: e.authorId as string,
    publishedAt: e.publishedAt as string,
    updatedAt: e.updatedAt as string,
    moduleCount: e.moduleCount as number,
    durationMinutes: e.durationMinutes as number,
  };
}

// ─── Progress Table ───────────────────────────────────────────────────────────

function progressTable(): TableClient {
  return TableClient.fromConnectionString(connectionString(), 'progress');
}

export async function upsertProgressRecord(record: ProgressRecord): Promise<void> {
  const client = progressTable();
  await client.createTable().catch(() => {});
  await client.upsertEntity(
    {
      partitionKey: record.userId,
      rowKey: record.courseId,
      bundleId: record.bundleId,
      completedBlockIds: JSON.stringify(record.completedBlockIds),
      lastAccessedAt: record.lastAccessedAt,
      completedAt: record.completedAt ?? null,
    },
    'Merge'
  );
}

export async function fetchProgressRecord(
  userId: string,
  courseId: string
): Promise<ProgressRecord | null> {
  const client = progressTable();
  try {
    const entity = await client.getEntity(userId, courseId);
    return {
      userId: entity.partitionKey as string,
      courseId: entity.rowKey as string,
      bundleId: entity.bundleId as string,
      completedBlockIds: JSON.parse((entity.completedBlockIds as string) ?? '[]'),
      lastAccessedAt: entity.lastAccessedAt as string,
      completedAt: (entity.completedAt as string) ?? undefined,
    };
  } catch {
    return null;
  }
}

// ─── Enrolment Table ──────────────────────────────────────────────────────────

function enrolmentTable(): TableClient {
  return TableClient.fromConnectionString(connectionString(), 'enrolments');
}

export async function fetchEnrolments(userId: string): Promise<CourseEnrolment[]> {
  const client = enrolmentTable();
  await client.createTable().catch(() => {});
  const results: CourseEnrolment[] = [];
  const entities = client.listEntities<{
    partitionKey: string;
    rowKey: string;
    tenantId: string;
    enrolledAt: string;
    expiresAt?: string;
  }>({
    queryOptions: { filter: `PartitionKey eq '${userId}'` },
  });
  for await (const e of entities) {
    results.push({
      enrolmentId: e.rowKey,
      userId: e.partitionKey,
      courseId: e.rowKey,
      tenantId: e.tenantId,
      enrolledAt: e.enrolledAt,
      expiresAt: e.expiresAt,
    });
  }
  return results;
}

// ─── Site Content (Pages / Posts) ────────────────────────────────────────────

const SITE_CONTENT_CONTAINER = 'site-content';
const SITE_CONTENT_TABLE = 'sitecontent';

export interface SitePageMetadata {
  pageId: string;
  slug: string;
  title: string;
  description: string;
  status: 'draft' | 'published';
  contentType: 'page' | 'post' | 'knowledge';
  templateId: string;
  bundleUrl: string;
  publishedAt: string;
  updatedAt: string;
  author?: string;
  tags?: string[];
  featuredImage?: string;
  categoryIds?: string[];
  primaryCategoryId?: string;
  inNav?: boolean;
  navLabel?: string;
  navParent?: string;
  navOrder?: number;
  linkedCourseId?: string;
  linkedCourseSlug?: string;
  linkedCourseTitle?: string;
}

function siteContentTable(): TableClient {
  return TableClient.fromConnectionString(connectionString(), SITE_CONTENT_TABLE);
}

export async function uploadSiteBundle(pageId: string, content: unknown): Promise<string> {
  const client = BlobServiceClient.fromConnectionString(connectionString());
  const container = client.getContainerClient(SITE_CONTENT_CONTAINER);
  await container.createIfNotExists({ access: 'blob' });
  const blob = container.getBlockBlobClient(`${pageId}.json`);
  const json = JSON.stringify(content);
  await blob.upload(json, Buffer.byteLength(json), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });
  return blob.url;
}

export async function fetchSiteBundle(pageId: string): Promise<unknown | null> {
  const client = BlobServiceClient.fromConnectionString(connectionString());
  const blob = client
    .getContainerClient(SITE_CONTENT_CONTAINER)
    .getBlockBlobClient(`${pageId}.json`);
  try {
    const download = await blob.download();
    const chunks: Buffer[] = [];
    for await (const chunk of download.readableStreamBody as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
  } catch {
    return null;
  }
}

export async function upsertSitePageMetadata(meta: SitePageMetadata): Promise<void> {
  const client = siteContentTable();
  await client.createTable().catch(() => {});
  await client.upsertEntity(
    {
      partitionKey: meta.contentType,
      rowKey: meta.slug,
      pageId: meta.pageId,
      title: meta.title,
      description: meta.description,
      status: meta.status,
      templateId: meta.templateId,
      bundleUrl: meta.bundleUrl,
      publishedAt: meta.publishedAt,
      updatedAt: meta.updatedAt,
      author: meta.author ?? '',
      tags: (meta.tags ?? []).join(','),
      featuredImage: meta.featuredImage ?? '',
      categoryIds: (meta.categoryIds ?? []).join(','),
      primaryCategoryId: meta.primaryCategoryId ?? '',
      inNav: meta.inNav ?? false,
      navLabel: meta.navLabel ?? '',
      navParent: meta.navParent ?? '',
      navOrder: meta.navOrder ?? 0,
      linkedCourseId: meta.linkedCourseId ?? '',
      linkedCourseSlug: meta.linkedCourseSlug ?? '',
      linkedCourseTitle: meta.linkedCourseTitle ?? '',
    },
    'Replace'
  );
}

export async function getSitePageBySlug(
  slug: string,
  contentType: 'page' | 'post' | 'knowledge' = 'page'
): Promise<SitePageMetadata | null> {
  const client = siteContentTable();
  await client.createTable().catch(() => {});
  try {
    const e = await client.getEntity<Record<string, unknown>>(contentType, slug);
    return entityToSitePageMetadata(e);
  } catch {
    return null;
  }
}

export async function listSitePages(contentType: 'page' | 'post' | 'knowledge' = 'page'): Promise<SitePageMetadata[]> {
  const client = siteContentTable();
  await client.createTable().catch(() => {});
  const results: SitePageMetadata[] = [];
  const entities = client.listEntities<Record<string, unknown>>({
    queryOptions: {
      filter: `PartitionKey eq '${contentType}' and status eq 'published'`,
    },
  });
  for await (const e of entities) {
    results.push(entityToSitePageMetadata(e));
  }
  return results.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function entityToSitePageMetadata(e: Record<string, unknown>): SitePageMetadata {
  return {
    pageId: e.pageId as string,
    slug: e.rowKey as string,
    title: e.title as string,
    description: e.description as string,
    status: e.status as SitePageMetadata['status'],
    contentType: e.partitionKey as SitePageMetadata['contentType'],
    templateId: e.templateId as string,
    bundleUrl: e.bundleUrl as string,
    publishedAt: e.publishedAt as string,
    updatedAt: e.updatedAt as string,
    author: (e.author as string) || undefined,
    tags: ((e.tags as string) || '').split(',').filter(Boolean),
    featuredImage: (e.featuredImage as string) || undefined,
    categoryIds: ((e.categoryIds as string) || '').split(',').filter(Boolean),
    primaryCategoryId: (e.primaryCategoryId as string) || undefined,
    inNav: (e.inNav as boolean) ?? false,
    navLabel: (e.navLabel as string) || undefined,
    navParent: (e.navParent as string) || undefined,
    navOrder: (e.navOrder as number) ?? 0,
    linkedCourseId: (e.linkedCourseId as string) || undefined,
    linkedCourseSlug: (e.linkedCourseSlug as string) || undefined,
    linkedCourseTitle: (e.linkedCourseTitle as string) || undefined,
  };
}

export async function listAllSitePages(
  contentType: 'page' | 'post' | 'knowledge' = 'page'
): Promise<SitePageMetadata[]> {
  const client = siteContentTable();
  await client.createTable().catch(() => {});
  const results: SitePageMetadata[] = [];
  const entities = client.listEntities<Record<string, unknown>>({
    queryOptions: { filter: `PartitionKey eq '${contentType}'` },
  });
  for await (const e of entities) {
    results.push(entityToSitePageMetadata(e));
  }
  return results.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function patchSitePageMeta(
  slug: string,
  contentType: 'page' | 'post' | 'knowledge',
  patch: Partial<Pick<SitePageMetadata, 'title' | 'description' | 'status' | 'publishedAt' | 'featuredImage' | 'categoryIds' | 'primaryCategoryId' | 'inNav' | 'navLabel' | 'navParent' | 'navOrder'>>
): Promise<void> {
  const client = siteContentTable();
  await client.createTable().catch(() => {});
  const hasCategoryIds = Object.prototype.hasOwnProperty.call(patch, 'categoryIds');
  const hasPrimaryCategoryId = Object.prototype.hasOwnProperty.call(patch, 'primaryCategoryId');
  const hasPublishedAt = Object.prototype.hasOwnProperty.call(patch, 'publishedAt');
  const hasFeaturedImage = Object.prototype.hasOwnProperty.call(patch, 'featuredImage');
  const update: TableEntity<Record<string, unknown>> = {
    partitionKey: contentType,
    rowKey: slug,
    updatedAt: new Date().toISOString(),
    ...patch,
    ...(hasPublishedAt ? { publishedAt: patch.publishedAt ?? '' } : {}),
    ...(hasFeaturedImage ? { featuredImage: patch.featuredImage ?? '' } : {}),
    ...(hasCategoryIds ? { categoryIds: (patch.categoryIds ?? []).join(',') } : {}),
    ...(hasPrimaryCategoryId ? { primaryCategoryId: patch.primaryCategoryId ?? '' } : {}),
    ...(patch.status === 'published' && !hasPublishedAt ? { publishedAt: new Date().toISOString() } : {}),
  };
  await client.updateEntity(update, 'Merge');
}

export async function listNavItems(): Promise<SitePageMetadata[]> {
  const client = siteContentTable();
  await client.createTable().catch(() => {});
  const results: SitePageMetadata[] = [];
  const entities = client.listEntities<Record<string, unknown>>({
    queryOptions: {
      filter: `PartitionKey eq 'page' and inNav eq true and status eq 'published'`,
    },
  });
  for await (const e of entities) {
    results.push(entityToSitePageMetadata(e));
  }
  return results;
}

const SIGNUP_REQUESTS_TABLE = 'SignupRequests';

export interface SignupRequestFieldValue {
  id: string;
  label: string;
  type: string;
  value: string;
  required?: boolean;
}

export interface SignupRequestRecord {
  requestId: string;
  submittedAt: string;
  status: 'Pending' | 'Invited' | 'Accepted' | 'Failed';
  pagePath: string;
  formTitle?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fields: SignupRequestFieldValue[];
  invitedAt?: string;
  invitedUserId?: string;
  inviteRedeemUrl?: string;
  acceptedAt?: string;
  errorMessage?: string;
}

function signupRequestsTable(): TableClient {
  return TableClient.fromConnectionString(connectionString(), SIGNUP_REQUESTS_TABLE);
}

export async function createSignupRequest(record: SignupRequestRecord): Promise<void> {
  const client = signupRequestsTable();
  await ensureTable(client);
  await client.upsertEntity(
    {
      partitionKey: 'SIGNUP',
      rowKey: record.requestId,
      submittedAt: record.submittedAt,
      status: record.status,
      pagePath: record.pagePath,
      formTitle: record.formTitle ?? '',
      email: record.email,
      firstName: record.firstName ?? '',
      lastName: record.lastName ?? '',
      invitedAt: record.invitedAt ?? '',
      invitedUserId: record.invitedUserId ?? '',
      inviteRedeemUrl: record.inviteRedeemUrl ?? '',
      acceptedAt: record.acceptedAt ?? '',
      errorMessage: record.errorMessage ?? '',
      fieldsJson: JSON.stringify(record.fields),
    },
    'Replace',
  );
}

export async function updateSignupRequest(
  requestId: string,
  patch: Partial<Pick<SignupRequestRecord, 'status' | 'invitedAt' | 'invitedUserId' | 'inviteRedeemUrl' | 'acceptedAt' | 'errorMessage'>>,
): Promise<void> {
  const client = signupRequestsTable();
  await ensureTable(client);
  await client.updateEntity(
    {
      partitionKey: 'SIGNUP',
      rowKey: requestId,
      ...(Object.prototype.hasOwnProperty.call(patch, 'status') ? { status: patch.status } : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, 'invitedAt') ? { invitedAt: patch.invitedAt ?? '' } : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, 'invitedUserId') ? { invitedUserId: patch.invitedUserId ?? '' } : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, 'inviteRedeemUrl') ? { inviteRedeemUrl: patch.inviteRedeemUrl ?? '' } : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, 'acceptedAt') ? { acceptedAt: patch.acceptedAt ?? '' } : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, 'errorMessage') ? { errorMessage: patch.errorMessage ?? '' } : {}),
    },
    'Merge',
  );
}

export async function acceptSignupRequestByInvitedUserId(invitedUserId: string): Promise<boolean> {
  const client = signupRequestsTable();
  await ensureTable(client);

  const matches: Array<{ rowKey: string; submittedAt: string; status: string }> = [];
  for await (const entity of client.listEntities<Record<string, unknown>>({
    queryOptions: { filter: `PartitionKey eq 'SIGNUP' and invitedUserId eq '${invitedUserId}'` },
  })) {
    matches.push({
      rowKey: entity.rowKey as string,
      submittedAt: (entity.submittedAt as string) || '',
      status: (entity.status as string) || '',
    });
  }

  const target = matches
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .find((entry) => entry.status === 'Invited' || entry.status === 'Accepted');

  if (!target) {
    return false;
  }

  await client.updateEntity(
    {
      partitionKey: 'SIGNUP',
      rowKey: target.rowKey,
      status: 'Accepted',
      acceptedAt: new Date().toISOString(),
      errorMessage: '',
    },
    'Merge',
  );

  return true;
}

const BLOG_CATEGORY_TABLE = 'blogCategories';

function blogCategoryTable(): TableClient {
  return TableClient.fromConnectionString(connectionString(), BLOG_CATEGORY_TABLE);
}

function entityToBlogCategory(entity: Record<string, unknown>): BlogCategory {
  return {
    categoryId: entity.rowKey as string,
    taxonomy: entity.partitionKey as 'post',
    name: entity.name as string,
    slug: entity.slug as string,
    parentId: (entity.parentId as string) || undefined,
    path: entity.path as string,
    depth: entity.depth as number,
    sortOrder: (entity.sortOrder as number) ?? 0,
    status: (entity.status as BlogCategory['status']) ?? 'active',
    createdAt: entity.createdAt as string,
    updatedAt: entity.updatedAt as string,
  };
}

export async function getBlogCategory(categoryId: string, taxonomy: 'post' = 'post'): Promise<BlogCategory | null> {
  const client = blogCategoryTable();
  await client.createTable().catch(() => {});
  try {
    const entity = await client.getEntity<Record<string, unknown>>(taxonomy, categoryId);
    return entityToBlogCategory(entity);
  } catch {
    return null;
  }
}

export async function listBlogCategories(taxonomy: 'post' = 'post'): Promise<BlogCategory[]> {
  const client = blogCategoryTable();
  await client.createTable().catch(() => {});
  const categories: BlogCategory[] = [];
  const entities = client.listEntities<Record<string, unknown>>({
    queryOptions: {
      filter: `PartitionKey eq '${taxonomy}' and status eq 'active'`,
    },
  });
  for await (const entity of entities) {
    categories.push(entityToBlogCategory(entity));
  }
  return categories.sort(
    (a, b) =>
      a.path.localeCompare(b.path) ||
      a.sortOrder - b.sortOrder ||
      a.name.localeCompare(b.name)
  );
}

export async function createBlogCategory(input: {
  taxonomy?: 'post';
  name: string;
  slug: string;
  parentId?: string;
  sortOrder?: number;
}): Promise<BlogCategory> {
  const taxonomy = input.taxonomy ?? 'post';
  const client = blogCategoryTable();
  await client.createTable().catch(() => {});

  let parent: BlogCategory | null = null;
  if (input.parentId) {
    parent = await getBlogCategory(input.parentId, taxonomy);
    if (!parent) {
      throw new Error('Parent category not found');
    }
  }

  const path = parent ? `${parent.path}/${input.slug}` : input.slug;
  const existing = await listBlogCategories(taxonomy);
  if (existing.some((category) => category.path === path)) {
    throw new Error('A category with this path already exists');
  }

  const now = new Date().toISOString();
  const category: BlogCategory = {
    categoryId: randomUUID(),
    taxonomy,
    name: input.name,
    slug: input.slug,
    parentId: parent?.categoryId,
    path,
    depth: parent ? parent.depth + 1 : 0,
    sortOrder: input.sortOrder ?? 0,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  await client.upsertEntity(
    {
      partitionKey: taxonomy,
      rowKey: category.categoryId,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId ?? '',
      path: category.path,
      depth: category.depth,
      sortOrder: category.sortOrder,
      status: category.status,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    },
    'Replace'
  );

  return category;
}


const MEDIA_CONTAINER = 'media';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export async function uploadMediaBlob(
  filename: string,
  data: Buffer,
  contentType: string,
): Promise<MediaItem> {
  const client = BlobServiceClient.fromConnectionString(connectionString());
  const container = client.getContainerClient(MEDIA_CONTAINER);
  await container.createIfNotExists({ access: 'blob' });
  const id = randomUUID();
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const blobName = `${id}-${safeFilename}`;
  const blob = container.getBlockBlobClient(blobName);
  const uploadedAt = new Date().toISOString();
  await blob.upload(data, data.length, {
    blobHTTPHeaders: { blobContentType: contentType },
    metadata: { originalname: safeFilename, uploadedat: uploadedAt },
  });
  return { id, name: filename, url: blob.url, contentType, size: data.length, uploadedAt };
}

export async function listMediaBlobs(): Promise<MediaItem[]> {
  const client = BlobServiceClient.fromConnectionString(connectionString());
  const container = client.getContainerClient(MEDIA_CONTAINER);
  await container.createIfNotExists({ access: 'blob' });
  const items: MediaItem[] = [];
  for await (const blob of container.listBlobsFlat({ includeMetadata: true })) {
    const dashIdx = blob.name.indexOf('-');
    const id = dashIdx !== -1 ? blob.name.substring(0, dashIdx) : blob.name;
    items.push({
      id,
      name: blob.metadata?.originalname ?? blob.name,
      url: container.getBlockBlobClient(blob.name).url,
      contentType: blob.properties.contentType ?? 'application/octet-stream',
      size: blob.properties.contentLength ?? 0,
      uploadedAt: blob.metadata?.uploadedat ?? blob.properties.createdOn?.toISOString() ?? '',
    });
  }
  return items.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
}

// =============================================================================
// CATALOGUE — PATH / MODULE / UNIT (new hierarchy model)
// Design reference: apps/lms-editorsite-dev/docs/courses/implementation-plan.md
// =============================================================================

import type {
  CatalogueItem,
  ContentVersion,
  PathModuleLink,
  ModuleUnitLink,
  EnrolmentRecord,
  ProgressState,
  ProgressEvent,
} from '@lms/shared-schemas';

const CATALOGUE_TABLE = 'CatalogueItems';
const CONTENT_VERSIONS_TABLE = 'ContentVersions';
const PATH_MODULES_TABLE = 'PathModules';
const MODULE_UNITS_TABLE = 'ModuleUnits';
const ENROLMENTS_TABLE = 'Enrolments';
const ENROLMENTS_BY_ITEM_TABLE = 'EnrolmentsByItem';
const PROGRESS_TABLE = 'Progress';
const PROGRESS_EVENTS_TABLE = 'ProgressEvents';
const CATALOGUE_BROWSE_TABLE = 'CatalogueBrowse';
const UNIT_CONTENT_CONTAINER = 'unit-content';

function catalogueTable(): TableClient {
  return TableClient.fromConnectionString(connectionString(), CATALOGUE_TABLE);
}
function contentVersionsTable(): TableClient {
  return TableClient.fromConnectionString(connectionString(), CONTENT_VERSIONS_TABLE);
}
function pathModulesTable(): TableClient {
  return TableClient.fromConnectionString(connectionString(), PATH_MODULES_TABLE);
}
function moduleUnitsTable(): TableClient {
  return TableClient.fromConnectionString(connectionString(), MODULE_UNITS_TABLE);
}
function enrolmentsTable(): TableClient {
  return TableClient.fromConnectionString(connectionString(), ENROLMENTS_TABLE);
}
function enrolmentsByItemTable(): TableClient {
  return TableClient.fromConnectionString(connectionString(), ENROLMENTS_BY_ITEM_TABLE);
}
function progressTable2(): TableClient {
  return TableClient.fromConnectionString(connectionString(), PROGRESS_TABLE);
}
function progressEventsTable(): TableClient {
  return TableClient.fromConnectionString(connectionString(), PROGRESS_EVENTS_TABLE);
}
function catalogueBrowseTable(): TableClient {
  return TableClient.fromConnectionString(connectionString(), CATALOGUE_BROWSE_TABLE);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function padSort(n: number): string {
  return String(n).padStart(6, '0');
}

async function ensureTable(client: TableClient): Promise<void> {
  await client.createTable().catch(() => {});
}

function entityToCatalogueItem(e: Record<string, unknown>): CatalogueItem {
  return {
    itemId: e.rowKey as string,
    itemType: (e.partitionKey as string).split('|')[1] as CatalogueItem['itemType'],
    slug: e.slug as string,
    title: e.title as string,
    summary: (e.summary as string) || '',
    language: (e.language as string) || 'en',
    difficulty: (e.difficulty as CatalogueItem['difficulty']) || undefined,
    role: (e.role as string) || '',
    learningPath: (e.learningPath as string) || '',
    estimatedMinutes: (e.estimatedMinutes as number) || 0,
    visibility: (e.visibility as CatalogueItem['visibility']) || 'Public',
    status: (e.status as CatalogueItem['status']) || 'Draft',
    currentVersionId: (e.currentVersionId as string) || undefined,
    thumbnailUrl: (e.thumbnailUrl as string) || undefined,
    tagsCsv: (e.tagsCsv as string) || '',
    unitType: (e.unitType as CatalogueItem['unitType']) || undefined,
    createdOn: e.createdOn as string,
    updatedOn: e.updatedOn as string,
    authorId: e.authorId as string,
    tenantId: (e.tenantId as string) || 'default',
  };
}

// ─── CatalogueItems ───────────────────────────────────────────────────────────

export async function upsertCatalogueItem(item: CatalogueItem): Promise<void> {
  const client = catalogueTable();
  await ensureTable(client);
  await client.upsertEntity(
    {
      partitionKey: `catalogue|${item.itemType}`,
      rowKey: item.itemId,
      slug: item.slug,
      title: item.title,
      summary: item.summary,
      language: item.language,
      difficulty: item.difficulty ?? '',
      role: item.role ?? '',
      learningPath: item.learningPath ?? '',
      estimatedMinutes: item.estimatedMinutes,
      visibility: item.visibility,
      status: item.status,
      currentVersionId: item.currentVersionId ?? '',
      thumbnailUrl: item.thumbnailUrl ?? '',
      tagsCsv: item.tagsCsv,
      unitType: item.unitType ?? '',
      createdOn: item.createdOn,
      updatedOn: item.updatedOn,
      authorId: item.authorId,
      tenantId: item.tenantId,
    },
    'Replace'
  );
}

export async function getCatalogueItem(
  itemType: CatalogueItem['itemType'],
  itemId: string
): Promise<CatalogueItem | null> {
  const client = catalogueTable();
  try {
    const e = await client.getEntity<Record<string, unknown>>(
      `catalogue|${itemType}`,
      itemId
    );
    return entityToCatalogueItem(e);
  } catch {
    return null;
  }
}

export async function listCatalogueItems(
  itemType: CatalogueItem['itemType'],
  statusFilter?: CatalogueItem['status']
): Promise<CatalogueItem[]> {
  const client = catalogueTable();
  await ensureTable(client);
  let filter = `PartitionKey eq 'catalogue|${itemType}'`;
  if (statusFilter) filter += ` and status eq '${statusFilter}'`;
  const results: CatalogueItem[] = [];
  for await (const e of client.listEntities<Record<string, unknown>>({ queryOptions: { filter } })) {
    results.push(entityToCatalogueItem(e));
  }
  return results.sort(
    (a, b) => new Date(b.updatedOn).getTime() - new Date(a.updatedOn).getTime()
  );
}

export async function patchCatalogueItem(
  itemType: CatalogueItem['itemType'],
  itemId: string,
  patch: Partial<Omit<CatalogueItem, 'itemId' | 'itemType' | 'createdOn'>>
): Promise<void> {
  const client = catalogueTable();
  const update: TableEntity<Record<string, unknown>> = {
    partitionKey: `catalogue|${itemType}`,
    rowKey: itemId,
    updatedOn: new Date().toISOString(),
    ...patch,
  };
  await client.updateEntity(update, 'Merge');
}

// ─── ContentVersions ──────────────────────────────────────────────────────────

export async function uploadUnitContent(
  unitId: string,
  blocks: unknown
): Promise<string> {
  const blobClient = BlobServiceClient.fromConnectionString(connectionString());
  const container = blobClient.getContainerClient(UNIT_CONTENT_CONTAINER);
  await container.createIfNotExists(); // private — served via backend only
  const blobName = `${unitId}/${randomUUID()}.json`;
  const blob = container.getBlockBlobClient(blobName);
  const json = JSON.stringify({ blocks });
  await blob.upload(json, Buffer.byteLength(json), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });
  return blob.url;
}

export async function fetchUnitContent(contentUri: string): Promise<{ blocks: unknown[] } | null> {
  const blobClient = BlobServiceClient.fromConnectionString(connectionString());
  // Parse container + blob name from URL
  const url = new URL(contentUri);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const containerName = pathParts[0];
  const blobName = pathParts.slice(1).join('/');
  const blob = blobClient.getContainerClient(containerName).getBlockBlobClient(blobName);
  try {
    const download = await blob.download();
    const chunks: Buffer[] = [];
    for await (const chunk of download.readableStreamBody as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
  } catch {
    return null;
  }
}

export async function createContentVersion(version: ContentVersion): Promise<void> {
  const client = contentVersionsTable();
  await ensureTable(client);
  await client.upsertEntity(
    {
      partitionKey: `CONTENT|${version.itemId}`,
      rowKey: padSort(version.versionNumber),
      itemId: version.itemId,
      versionNumber: version.versionNumber,
      publishedOn: version.publishedOn,
      publishedByUserId: version.publishedByUserId,
      contentUri: version.contentUri,
      changeLog: version.changeLog,
    },
    'Replace'
  );
}

export async function getLatestVersionNumber(itemId: string): Promise<number> {
  const client = contentVersionsTable();
  await ensureTable(client);
  let max = 0;
  for await (const e of client.listEntities<{ versionNumber: number }>({
    queryOptions: { filter: `PartitionKey eq 'CONTENT|${itemId}'` },
  })) {
    if ((e.versionNumber ?? 0) > max) max = e.versionNumber;
  }
  return max;
}

export async function getContentVersion(
  itemId: string,
  versionNumber: number
): Promise<ContentVersion | null> {
  const client = contentVersionsTable();
  try {
    const e = await client.getEntity<Record<string, unknown>>(
      `CONTENT|${itemId}`,
      padSort(versionNumber)
    );
    return {
      itemId: e.itemId as string,
      versionNumber: e.versionNumber as number,
      publishedOn: e.publishedOn as string,
      publishedByUserId: e.publishedByUserId as string,
      contentUri: e.contentUri as string,
      changeLog: (e.changeLog as string) || '',
    };
  } catch {
    return null;
  }
}

// ─── PathModules ──────────────────────────────────────────────────────────────

export async function addModuleToPath(link: PathModuleLink): Promise<void> {
  const client = pathModulesTable();
  await ensureTable(client);
  await client.upsertEntity(
    {
      partitionKey: `PATH|${link.pathId}`,
      rowKey: `${padSort(link.sortOrder)}|MODULE|${link.moduleId}`,
      pathId: link.pathId,
      moduleId: link.moduleId,
      sortOrder: link.sortOrder,
      isOptional: link.isOptional,
    },
    'Replace'
  );
}

export async function listPathModules(pathId: string): Promise<PathModuleLink[]> {
  const client = pathModulesTable();
  await ensureTable(client);
  const results: PathModuleLink[] = [];
  for await (const e of client.listEntities<Record<string, unknown>>({
    queryOptions: { filter: `PartitionKey eq 'PATH|${pathId}'` },
  })) {
    results.push({
      pathId: e.pathId as string,
      moduleId: e.moduleId as string,
      sortOrder: e.sortOrder as number,
      isOptional: (e.isOptional as boolean) ?? false,
    });
  }
  return results.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function removeModuleFromPath(pathId: string, moduleId: string): Promise<void> {
  const client = pathModulesTable();
  // Find and delete the row — need to scan for the correct RK since sortOrder is part of RK
  for await (const e of client.listEntities<Record<string, unknown>>({
    queryOptions: { filter: `PartitionKey eq 'PATH|${pathId}' and moduleId eq '${moduleId}'` },
  })) {
    await client.deleteEntity(`PATH|${pathId}`, e.rowKey as string);
  }
}

export async function reorderPathModules(pathId: string, orderedModuleIds: string[]): Promise<void> {
  const client = pathModulesTable();
  // Delete all existing links then re-create with new sort order
  for await (const e of client.listEntities<Record<string, unknown>>({
    queryOptions: { filter: `PartitionKey eq 'PATH|${pathId}'` },
  })) {
    await client.deleteEntity(`PATH|${pathId}`, e.rowKey as string);
  }
  for (let i = 0; i < orderedModuleIds.length; i++) {
    await client.upsertEntity(
      {
        partitionKey: `PATH|${pathId}`,
        rowKey: `${padSort((i + 1) * 10)}|MODULE|${orderedModuleIds[i]}`,
        pathId,
        moduleId: orderedModuleIds[i],
        sortOrder: (i + 1) * 10,
        isOptional: false,
      },
      'Replace'
    );
  }
}

// ─── ModuleUnits ──────────────────────────────────────────────────────────────

export async function addUnitToModule(link: ModuleUnitLink): Promise<void> {
  const client = moduleUnitsTable();
  await ensureTable(client);
  await client.upsertEntity(
    {
      partitionKey: `MODULE|${link.moduleId}`,
      rowKey: `${padSort(link.sortOrder)}|UNIT|${link.unitId}`,
      moduleId: link.moduleId,
      unitId: link.unitId,
      sortOrder: link.sortOrder,
      isOptional: link.isOptional,
      unitType: link.unitType,
    },
    'Replace'
  );
}

export async function listModuleUnits(moduleId: string): Promise<ModuleUnitLink[]> {
  const client = moduleUnitsTable();
  await ensureTable(client);
  const results: ModuleUnitLink[] = [];
  for await (const e of client.listEntities<Record<string, unknown>>({
    queryOptions: { filter: `PartitionKey eq 'MODULE|${moduleId}'` },
  })) {
    results.push({
      moduleId: e.moduleId as string,
      unitId: e.unitId as string,
      sortOrder: e.sortOrder as number,
      isOptional: (e.isOptional as boolean) ?? false,
      unitType: (e.unitType as ModuleUnitLink['unitType']) || 'Lesson',
    });
  }
  return results.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function removeUnitFromModule(moduleId: string, unitId: string): Promise<void> {
  const client = moduleUnitsTable();
  for await (const e of client.listEntities<Record<string, unknown>>({
    queryOptions: { filter: `PartitionKey eq 'MODULE|${moduleId}' and unitId eq '${unitId}'` },
  })) {
    await client.deleteEntity(`MODULE|${moduleId}`, e.rowKey as string);
  }
}

export async function reorderModuleUnits(moduleId: string, orderedUnitIds: string[]): Promise<void> {
  const client = moduleUnitsTable();
  const existing: Record<string, Record<string, unknown>> = {};
  for await (const e of client.listEntities<Record<string, unknown>>({
    queryOptions: { filter: `PartitionKey eq 'MODULE|${moduleId}'` },
  })) {
    existing[e.unitId as string] = e;
    await client.deleteEntity(`MODULE|${moduleId}`, e.rowKey as string);
  }
  for (let i = 0; i < orderedUnitIds.length; i++) {
    const id = orderedUnitIds[i];
    const prev = existing[id];
    await client.upsertEntity(
      {
        partitionKey: `MODULE|${moduleId}`,
        rowKey: `${padSort((i + 1) * 10)}|UNIT|${id}`,
        moduleId,
        unitId: id,
        sortOrder: (i + 1) * 10,
        isOptional: (prev?.isOptional as boolean) ?? false,
        unitType: (prev?.unitType as string) ?? 'Lesson',
      },
      'Replace'
    );
  }
}

// ─── Enrolments (new model) ───────────────────────────────────────────────────

export async function upsertEnrolmentRecord(record: EnrolmentRecord): Promise<void> {
  const [enrolTable, byItemTable] = [enrolmentsTable(), enrolmentsByItemTable()];
  await Promise.all([ensureTable(enrolTable), ensureTable(byItemTable)]);

  const entity = {
    partitionKey: `ENROL|USER|${record.userId}`,
    rowKey: `ITEM|${record.pathId}`,
    userId: record.userId,
    pathId: record.pathId,
    enrolledOn: record.enrolledOn,
    status: record.status,
    dueOn: record.dueOn ?? '',
    source: record.source,
    tenantId: record.tenantId,
  };
  await enrolTable.upsertEntity(entity, 'Replace');

  // Write index
  await byItemTable.upsertEntity(
    {
      partitionKey: `ENROL|ITEM|${record.pathId}`,
      rowKey: `USER|${record.userId}`,
      status: record.status,
      enrolledOn: record.enrolledOn,
      userId: record.userId,
    },
    'Replace'
  );
}

export async function listEnrolmentsByUser(userId: string): Promise<EnrolmentRecord[]> {
  const client = enrolmentsTable();
  await ensureTable(client);
  const results: EnrolmentRecord[] = [];
  for await (const e of client.listEntities<Record<string, unknown>>({
    queryOptions: { filter: `PartitionKey eq 'ENROL|USER|${userId}'` },
  })) {
    results.push({
      userId: e.userId as string,
      pathId: e.pathId as string,
      enrolledOn: e.enrolledOn as string,
      status: e.status as EnrolmentRecord['status'],
      dueOn: (e.dueOn as string) || undefined,
      source: (e.source as EnrolmentRecord['source']) || 'Self',
      tenantId: (e.tenantId as string) || 'default',
    });
  }
  return results;
}

// ─── Progress (new model) ─────────────────────────────────────────────────────

export async function upsertProgressState(state: ProgressState): Promise<void> {
  const client = progressTable2();
  await ensureTable(client);
  await client.upsertEntity(
    {
      partitionKey: `PROG|USER|${state.userId}`,
      rowKey: `${state.itemType}|${state.itemId}`,
      userId: state.userId,
      itemType: state.itemType,
      itemId: state.itemId,
      state: state.state,
      percentComplete: state.percentComplete,
      firstStartedOn: state.firstStartedOn ?? '',
      lastActivityOn: state.lastActivityOn,
      completedOn: state.completedOn ?? '',
    },
    'Merge'
  );
}

export async function getProgressState(
  userId: string,
  itemType: ProgressState['itemType'],
  itemId: string
): Promise<ProgressState | null> {
  const client = progressTable2();
  try {
    const e = await client.getEntity<Record<string, unknown>>(
      `PROG|USER|${userId}`,
      `${itemType}|${itemId}`
    );
    return {
      userId: e.userId as string,
      itemType: e.itemType as ProgressState['itemType'],
      itemId: e.itemId as string,
      state: e.state as ProgressState['state'],
      percentComplete: (e.percentComplete as number) || 0,
      firstStartedOn: (e.firstStartedOn as string) || undefined,
      lastActivityOn: e.lastActivityOn as string,
      completedOn: (e.completedOn as string) || undefined,
    };
  } catch {
    return null;
  }
}

export async function listProgressByUser(userId: string): Promise<ProgressState[]> {
  const client = progressTable2();
  await ensureTable(client);
  const results: ProgressState[] = [];
  for await (const e of client.listEntities<Record<string, unknown>>({
    queryOptions: { filter: `PartitionKey eq 'PROG|USER|${userId}'` },
  })) {
    results.push({
      userId: e.userId as string,
      itemType: e.itemType as ProgressState['itemType'],
      itemId: e.itemId as string,
      state: e.state as ProgressState['state'],
      percentComplete: (e.percentComplete as number) || 0,
      firstStartedOn: (e.firstStartedOn as string) || undefined,
      lastActivityOn: e.lastActivityOn as string,
      completedOn: (e.completedOn as string) || undefined,
    });
  }
  return results;
}

export async function appendProgressEvent(event: ProgressEvent): Promise<void> {
  const client = progressEventsTable();
  await ensureTable(client);
  const ticks = new Date(event.occurredOn).getTime();
  await client.upsertEntity(
    {
      partitionKey: `PROGEVT|USER|${event.userId}`,
      rowKey: `${ticks}|${event.eventType}|${event.unitId}`,
      userId: event.userId,
      unitId: event.unitId,
      moduleId: event.moduleId,
      pathId: event.pathId,
      eventType: event.eventType,
      occurredOn: event.occurredOn,
      device: event.device ?? '',
      evidenceUri: event.evidenceUri ?? '',
    },
    'Replace'
  );
}

// ─── CatalogueBrowse ──────────────────────────────────────────────────────────

export async function writeCatalogueBrowseEntry(item: CatalogueItem): Promise<void> {
  const client = catalogueBrowseTable();
  await ensureTable(client);
  const titleSort = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
  await client.upsertEntity(
    {
      partitionKey: `BROWSE|${item.itemType}|${item.status.toUpperCase()}`,
      rowKey: `${titleSort}|${item.itemId}`,
      itemId: item.itemId,
      itemType: item.itemType,
      title: item.title,
      summary: item.summary,
      difficulty: item.difficulty ?? '',
      role: item.role ?? '',
      learningPath: item.learningPath ?? '',
      estimatedMinutes: item.estimatedMinutes,
      thumbnailUrl: item.thumbnailUrl ?? '',
      language: item.language,
      slug: item.slug,
      tagsCsv: item.tagsCsv,
    },
    'Replace'
  );
}

export async function deleteCatalogueBrowseEntry(
  item: Pick<CatalogueItem, 'itemId' | 'itemType' | 'status' | 'title'>
): Promise<void> {
  const client = catalogueBrowseTable();
  const titleSort = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
  try {
    await client.deleteEntity(
      `BROWSE|${item.itemType}|${item.status.toUpperCase()}`,
      `${titleSort}|${item.itemId}`
    );
  } catch {
    // Already gone — safe to ignore
  }
}

export async function listCatalogueBrowse(
  itemType: CatalogueItem['itemType'],
  status: CatalogueItem['status'] = 'Published'
): Promise<CatalogueItem[]> {
  const client = catalogueBrowseTable();
  await ensureTable(client);
  const results: CatalogueItem[] = [];
  const pk = `BROWSE|${itemType}|${status.toUpperCase()}`;
  for await (const e of client.listEntities<Record<string, unknown>>({
    queryOptions: { filter: `PartitionKey eq '${pk}'` },
  })) {
    results.push({
      itemId: e.itemId as string,
      itemType: e.itemType as CatalogueItem['itemType'],
      slug: e.slug as string,
      title: e.title as string,
      summary: (e.summary as string) || '',
      language: (e.language as string) || 'en',
      difficulty: (e.difficulty as CatalogueItem['difficulty']) || undefined,
      role: (e.role as string) || '',
      learningPath: (e.learningPath as string) || '',
      estimatedMinutes: (e.estimatedMinutes as number) || 0,
      visibility: 'Public',
      status,
      thumbnailUrl: (e.thumbnailUrl as string) || undefined,
      tagsCsv: (e.tagsCsv as string) || '',
      createdOn: '',
      updatedOn: '',
      authorId: '',
      tenantId: 'default',
    });
  }
  return results;
}
