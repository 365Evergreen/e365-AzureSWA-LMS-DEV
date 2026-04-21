import { z } from 'zod';

// ─── Block ────────────────────────────────────────────────────────────────────

export const BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  version: z.number().int().positive(),
  payload: z.record(z.unknown()),
  background: z.string().optional(),
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

// ─── Course Metadata (catalogue entry — legacy flat model) ───────────────────
// Kept for backwards compatibility with the old `courses` table and existing
// getCatalogue / learner endpoints. New content uses CatalogueItem instead.

export const CourseLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const CourseAudienceSchema = z.enum(['developer', 'manager', 'designer', 'all']);
export const CourseStatusSchema = z.enum(['draft', 'published', 'archived']);

export const CourseMetadataSchema = z.object({
  courseId: z.string().uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  status: CourseStatusSchema,
  audience: CourseAudienceSchema,
  level: CourseLevelSchema,
  tags: z.array(z.string()),
  thumbnailUrl: z.string().url().optional(),
  bundleUrl: z.string().url(),
  authorId: z.string(),
  publishedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  moduleCount: z.number().int().nonnegative(),
  durationMinutes: z.number().int().nonnegative(),
});

export type CourseMetadata = z.infer<typeof CourseMetadataSchema>;

// ─── Course Enrolment (legacy) ────────────────────────────────────────────────

export const CourseEnrolmentSchema = z.object({
  enrolmentId: z.string().uuid(),
  userId: z.string(),
  courseId: z.string().uuid(),
  tenantId: z.string(),
  enrolledAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});

export type CourseEnrolment = z.infer<typeof CourseEnrolmentSchema>;

// ─── Progress Record (legacy) ─────────────────────────────────────────────────

export const ProgressRecordSchema = z.object({
  userId: z.string(),
  courseId: z.string().uuid(),
  bundleId: z.string().uuid(),
  completedBlockIds: z.array(z.string().uuid()),
  lastAccessedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

export type ProgressRecord = z.infer<typeof ProgressRecordSchema>;

// ─── Blog Category Taxonomy ─────────────────────────────────────────────────────

export const BlogCategoryStatusSchema = z.enum(['active', 'archived']);
export type BlogCategoryStatus = z.infer<typeof BlogCategoryStatusSchema>;

export const BlogCategorySchema = z.object({
  categoryId: z.string().uuid(),
  taxonomy: z.enum(['post']).default('post'),
  name: z.string().min(1),
  slug: z.string().min(1),
  parentId: z.string().uuid().optional(),
  path: z.string().min(1),
  depth: z.number().int().nonnegative(),
  sortOrder: z.number().int().nonnegative().default(0),
  status: BlogCategoryStatusSchema.default('active'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type BlogCategory = z.infer<typeof BlogCategorySchema>;

// =============================================================================
// CATALOGUE HIERARCHY — PATH → MODULE → UNIT
// Design reference: apps/lms-editorsite-dev/docs/courses/implementation-plan.md
// =============================================================================

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ItemTypeSchema = z.enum(['PATH', 'MODULE', 'UNIT', 'ASSESSMENT']);
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const ItemStatusSchema = z.enum(['Draft', 'Published', 'Archived']);
export type ItemStatus = z.infer<typeof ItemStatusSchema>;

export const DifficultySchema = z.enum(['Foundation', 'Beginner', 'Intermediate', 'Advanced']);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const UnitTypeSchema = z.enum(['Lesson', 'Video', 'Assessment', 'Interactive']);
export type UnitType = z.infer<typeof UnitTypeSchema>;

export const VisibilitySchema = z.enum(['Public', 'Enrolled']);
export type Visibility = z.infer<typeof VisibilitySchema>;

// ─── CatalogueItem — unified PATH / MODULE / UNIT entity ─────────────────────
// Table: CatalogueItems
// PK: `catalogue|{itemType}`   RK: `{itemId}` (GUID)

export const CatalogueItemSchema = z.object({
  itemId: z.string().uuid(),
  itemType: ItemTypeSchema,
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().default(''),
  language: z.string().default('en'),
  difficulty: DifficultySchema.optional(),
  role: z.string().default(''),
  learningPath: z.string().default(''),
  estimatedMinutes: z.number().int().nonnegative().default(0),
  isMandatory: z.boolean().default(false),
  visibility: VisibilitySchema.default('Public'),
  status: ItemStatusSchema.default('Draft'),
  currentVersionId: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  tagsCsv: z.string().default(''),
  unitType: UnitTypeSchema.optional(),
  createdOn: z.string().datetime(),
  updatedOn: z.string().datetime(),
  authorId: z.string(),
  tenantId: z.string().default('default'),
});

export type CatalogueItem = z.infer<typeof CatalogueItemSchema>;

// ─── ContentVersion — versioned unit content ──────────────────────────────────
// Table: ContentVersions
// PK: `CONTENT|{itemId}`   RK: `{versionNumber}` (zero-padded 6 digits)

export const ContentVersionSchema = z.object({
  itemId: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  publishedOn: z.string().datetime(),
  publishedByUserId: z.string(),
  contentUri: z.string().url(),
  changeLog: z.string().default(''),
});

export type ContentVersion = z.infer<typeof ContentVersionSchema>;

// ─── PathModuleLink — ordered PATH → MODULE association ───────────────────────
// Table: PathModules
// PK: `PATH|{pathId}`   RK: `{sortOrderPadded}|MODULE|{moduleId}`

export const PathModuleLinkSchema = z.object({
  pathId: z.string().uuid(),
  moduleId: z.string().uuid(),
  sortOrder: z.number().int().nonnegative(),
  isOptional: z.boolean().default(false),
});

export type PathModuleLink = z.infer<typeof PathModuleLinkSchema>;

// ─── ModuleUnitLink — ordered MODULE → UNIT association ───────────────────────
// Table: ModuleUnits
// PK: `MODULE|{moduleId}`   RK: `{sortOrderPadded}|UNIT|{unitId}`

export const ModuleUnitLinkSchema = z.object({
  moduleId: z.string().uuid(),
  unitId: z.string().uuid(),
  sortOrder: z.number().int().nonnegative(),
  isOptional: z.boolean().default(false),
  unitType: UnitTypeSchema.default('Lesson'),
});

export type ModuleUnitLink = z.infer<typeof ModuleUnitLinkSchema>;

// ─── EnrolmentRecord — PATH-level enrolment ───────────────────────────────────
// Table: Enrolments
// PK: `ENROL|USER|{userId}`   RK: `ITEM|{pathId}`

export const EnrolmentSourceSchema = z.enum(['Self', 'Assigned', 'AdminImport']);

export const EnrolmentRecordSchema = z.object({
  userId: z.string(),
  pathId: z.string().uuid(),
  enrolledOn: z.string().datetime().optional(),
  assignedOn: z.string().datetime().optional(),
  status: z.enum(['Assigned', 'Active', 'Completed', 'Withdrawn']),
  dueOn: z.string().datetime().optional(),
  source: EnrolmentSourceSchema.default('Self'),
  tenantId: z.string().default('default'),
});

export type EnrolmentRecord = z.infer<typeof EnrolmentRecordSchema>;

// ─── ProgressState — per-unit (+ module/path aggregate) ──────────────────────
// Table: Progress
// PK: `PROG|USER|{userId}`   RK: `{itemType}|{itemId}`

export const ProgressStateSchema = z.object({
  userId: z.string(),
  itemType: ItemTypeSchema,
  itemId: z.string().uuid(),
  state: z.enum(['NotStarted', 'InProgress', 'Completed']),
  percentComplete: z.number().min(0).max(100).default(0),
  firstStartedOn: z.string().datetime().optional(),
  lastActivityOn: z.string().datetime(),
  completedOn: z.string().datetime().optional(),
});

export type ProgressState = z.infer<typeof ProgressStateSchema>;

// ─── ProgressEvent — append-only audit trail ─────────────────────────────────
// Table: ProgressEvents
// PK: `PROGEVT|USER|{userId}`   RK: `{occurredOnTicks}|{eventType}|{unitId}`

export const ProgressEventTypeSchema = z.enum(['Start', 'Complete', 'Revisit', 'Abandon']);

export const ProgressEventSchema = z.object({
  userId: z.string(),
  unitId: z.string().uuid(),
  moduleId: z.string().uuid(),
  pathId: z.string().uuid(),
  eventType: ProgressEventTypeSchema,
  occurredOn: z.string().datetime(),
  device: z.string().optional(),
  evidenceUri: z.string().optional(),
});

export type ProgressEvent = z.infer<typeof ProgressEventSchema>;

// ─── Composite read models (API response shapes) ──────────────────────────────

export const ModuleUnitSummarySchema = CatalogueItemSchema.extend({
  sortOrder: z.number(),
  isOptional: z.boolean(),
  unitType: UnitTypeSchema,
});
export type ModuleUnitSummary = z.infer<typeof ModuleUnitSummarySchema>;

export const PathModuleSummarySchema = CatalogueItemSchema.extend({
  sortOrder: z.number(),
  isOptional: z.boolean(),
  units: z.array(ModuleUnitSummarySchema).default([]),
});
export type PathModuleSummary = z.infer<typeof PathModuleSummarySchema>;

export const PathDetailSchema = CatalogueItemSchema.extend({
  modules: z.array(PathModuleSummarySchema).default([]),
});
export type PathDetail = z.infer<typeof PathDetailSchema>;

export const UnitDetailSchema = CatalogueItemSchema.extend({
  currentVersion: ContentVersionSchema.optional(),
  blocks: z.array(BlockSchema).optional(),
});
export type UnitDetail = z.infer<typeof UnitDetailSchema>;

// ─── Module assessment model ───────────────────────────────────────────────────

export const AssessmentDefinitionSchema = z.object({
  assessmentId: z.string().uuid(),
  moduleId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().default(''),
  passingPercent: z.number().min(0).max(100).default(70),
  questionCount: z.number().int().nonnegative().default(0),
  createdOn: z.string().datetime(),
  updatedOn: z.string().datetime(),
  authorId: z.string(),
});
export type AssessmentDefinition = z.infer<typeof AssessmentDefinitionSchema>;

export const AssessmentOptionSchema = z.object({
  optionId: z.string().uuid(),
  assessmentId: z.string().uuid(),
  questionId: z.string().uuid(),
  label: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
  isCorrect: z.boolean().default(false),
});
export type AssessmentOption = z.infer<typeof AssessmentOptionSchema>;

export const AssessmentQuestionSchema = z.object({
  questionId: z.string().uuid(),
  assessmentId: z.string().uuid(),
  prompt: z.string().min(1),
  explanation: z.string().default(''),
  allowsMultiple: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative(),
  options: z.array(AssessmentOptionSchema).default([]),
});
export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;

export const AssessmentDetailSchema = AssessmentDefinitionSchema.extend({
  questions: z.array(AssessmentQuestionSchema).default([]),
});
export type AssessmentDetail = z.infer<typeof AssessmentDetailSchema>;

export const AssessmentSubmissionAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).default([]),
});
export type AssessmentSubmissionAnswer = z.infer<typeof AssessmentSubmissionAnswerSchema>;

export const AssessmentAttemptSubmissionSchema = z.object({
  answers: z.array(AssessmentSubmissionAnswerSchema).default([]),
});
export type AssessmentAttemptSubmission = z.infer<typeof AssessmentAttemptSubmissionSchema>;

export const LearnerAssessmentAnswerSchema = z.object({
  attemptId: z.string().uuid(),
  userId: z.string(),
  assessmentId: z.string().uuid(),
  moduleId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).default([]),
  isCorrect: z.boolean(),
  answeredOn: z.string().datetime(),
});
export type LearnerAssessmentAnswer = z.infer<typeof LearnerAssessmentAnswerSchema>;

export const AssessmentOutcomeSchema = z.object({
  attemptId: z.string().uuid(),
  userId: z.string(),
  assessmentId: z.string().uuid(),
  moduleId: z.string().uuid(),
  totalQuestions: z.number().int().nonnegative(),
  correctQuestions: z.number().int().nonnegative(),
  scorePercent: z.number().min(0).max(100),
  passed: z.boolean(),
  submittedOn: z.string().datetime(),
});
export type AssessmentOutcome = z.infer<typeof AssessmentOutcomeSchema>;
