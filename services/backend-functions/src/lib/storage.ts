import { BlobServiceClient } from '@azure/storage-blob';
import { TableClient } from '@azure/data-tables';
import type { ProgressRecord, CourseEnrolment } from '@lms/shared-schemas';

function connectionString(): string {
  const cs = process.env.STORAGE_CONNECTION_STRING;
  if (!cs) throw new Error('STORAGE_CONNECTION_STRING is not configured');
  return cs;
}

// ─── Blob Storage ─────────────────────────────────────────────────────────────

export async function uploadBundle(bundleId: string, content: unknown): Promise<void> {
  const client = BlobServiceClient.fromConnectionString(connectionString());
  const container = client.getContainerClient('content-bundles');
  await container.createIfNotExists();
  const blob = container.getBlockBlobClient(`${bundleId}.json`);
  const json = JSON.stringify(content);
  await blob.upload(json, Buffer.byteLength(json), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });
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
