import { z } from 'zod';

// ─── Block ────────────────────────────────────────────────────────────────────

export const BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  version: z.number().int().positive(),
  payload: z.record(z.unknown()),
});

export type Block = z.infer<typeof BlockSchema>;

// ─── Content Bundle ───────────────────────────────────────────────────────────

export const ContentBundleSchema = z.object({
  bundleId: z.string().uuid(),
  courseId: z.string().uuid(),
  platformVersion: z.string(),
  publishedAt: z.string().datetime(),
  publishedBy: z.string(),
  blocks: z.array(BlockSchema),
  metadata: z.object({
    title: z.string(),
    description: z.string().optional(),
    audienceRoles: z.array(z.enum(['Author', 'Publisher', 'Admin', 'Learner'])),
  }),
});

export type ContentBundle = z.infer<typeof ContentBundleSchema>;

// ─── Course Enrolment ─────────────────────────────────────────────────────────

export const CourseEnrolmentSchema = z.object({
  enrolmentId: z.string().uuid(),
  userId: z.string(),
  courseId: z.string().uuid(),
  tenantId: z.string(),
  enrolledAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});

export type CourseEnrolment = z.infer<typeof CourseEnrolmentSchema>;

// ─── Progress Record ──────────────────────────────────────────────────────────

export const ProgressRecordSchema = z.object({
  userId: z.string(),
  courseId: z.string().uuid(),
  bundleId: z.string().uuid(),
  completedBlockIds: z.array(z.string().uuid()),
  lastAccessedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

export type ProgressRecord = z.infer<typeof ProgressRecordSchema>;
