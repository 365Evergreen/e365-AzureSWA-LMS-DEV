import { BlobServiceClient } from '@azure/storage-blob';
import { TableClient } from '@azure/data-tables';
import { randomUUID } from 'crypto';
import type { ProgressRecord, CourseEnrolment, CourseMetadata } from '@lms/shared-schemas';

function connectionString(): string {
  const cs = process.env.STORAGE_CONNECTION_STRING;
  if (!cs) throw new Error('STORAGE_CONNECTION_STRING is not configured');
  return cs;
}

// ─── Blob Storage ─────────────────────────────────────────────────────────────

export async function uploadBundle(bundleId: string, content: unknown): Promise<string> {
  const client = BlobServiceClient.fromConnectionString(connectionString());
  const container = client.getContainerClient('content-bundles');
  await container.createIfNotExists({ access: 'blob' });
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
  inNav?: boolean;
  navLabel?: string;
  navParent?: string;
  navOrder?: number;
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
      inNav: meta.inNav ?? false,
      navLabel: meta.navLabel ?? '',
      navParent: meta.navParent ?? '',
      navOrder: meta.navOrder ?? 0,
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
    inNav: (e.inNav as boolean) ?? false,
    navLabel: (e.navLabel as string) || undefined,
    navParent: (e.navParent as string) || undefined,
    navOrder: (e.navOrder as number) ?? 0,
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
  patch: Partial<Pick<SitePageMetadata, 'title' | 'description' | 'status' | 'inNav' | 'navLabel' | 'navParent' | 'navOrder'>>
): Promise<void> {
  const client = siteContentTable();
  await client.createTable().catch(() => {});
  const update: Record<string, unknown> = {
    partitionKey: contentType,
    rowKey: slug,
    updatedAt: new Date().toISOString(),
    ...patch,
    ...(patch.status === 'published' ? { publishedAt: new Date().toISOString() } : {}),
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
