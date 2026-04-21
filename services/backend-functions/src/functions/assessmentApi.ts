import { randomUUID } from 'crypto';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import {
  canEditContent,
  extractBearerToken,
  hasAnyRole,
  validateToken,
  type AuthClaims,
} from '../middleware/validateToken';
import {
  createAssessmentOutcome,
  createDefaultModuleAssessment,
  createLearnerAssessmentAnswers,
  getCatalogueItem,
  getLatestAssessmentOutcome,
  getModuleAssessmentDetail,
  replaceModuleAssessment,
} from '../lib/storage';
import type {
  AssessmentDetail,
  AssessmentOutcome,
  LearnerAssessmentAnswer,
} from '@lms/shared-schemas';

async function requireContentEditor(
  req: HttpRequest,
): Promise<{ claims: AuthClaims } | { error: HttpResponseInit }> {
  const token = extractBearerToken(req);
  if (!token) {
    return { error: { status: 401, jsonBody: { error: 'Missing bearer token' } } };
  }

  let claims: AuthClaims;
  try {
    claims = await validateToken(token);
  } catch (err) {
    return {
      error: {
        status: 401,
        jsonBody: { error: 'Invalid or expired token', detail: (err as Error).message },
      },
    };
  }

  if (!canEditContent(claims)) {
    return {
      error: {
        status: 403,
        jsonBody: { error: 'Author, Publisher, Admin, or ContentEditor role required' },
      },
    };
  }

  return { claims };
}

async function requireLearner(
  req: HttpRequest,
): Promise<{ claims: AuthClaims } | { error: HttpResponseInit }> {
  const token = extractBearerToken(req);
  if (!token) {
    return { error: { status: 401, jsonBody: { error: 'Missing bearer token' } } };
  }

  let claims: AuthClaims;
  try {
    claims = await validateToken(token);
  } catch {
    return { error: { status: 401, jsonBody: { error: 'Invalid or expired token' } } };
  }

  if (!hasAnyRole(claims, ['Learner', 'Admin'])) {
    return { error: { status: 403, jsonBody: { error: 'Learner or Admin role required' } } };
  }

  return { claims };
}

const AssessmentOptionInputSchema = z.object({
  optionId: z.string().uuid().optional(),
  label: z.string().min(1),
  isCorrect: z.boolean(),
  sortOrder: z.number().int().nonnegative().optional(),
});

const AssessmentQuestionInputSchema = z.object({
  questionId: z.string().uuid().optional(),
  prompt: z.string().min(1),
  explanation: z.string().optional().default(''),
  allowsMultiple: z.boolean().optional().default(false),
  sortOrder: z.number().int().nonnegative().optional(),
  options: z.array(AssessmentOptionInputSchema).min(2),
});

const UpsertModuleAssessmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().default(''),
  passingPercent: z.number().min(0).max(100).optional().default(70),
  questions: z.array(AssessmentQuestionInputSchema).default([]),
});

const SubmitAssessmentAttemptSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedOptionIds: z.array(z.string().uuid()).default([]),
    }),
  ).default([]),
});

function toLearnerAssessment(detail: AssessmentDetail) {
  return {
    assessmentId: detail.assessmentId,
    moduleId: detail.moduleId,
    title: detail.title,
    description: detail.description,
    passingPercent: detail.passingPercent,
    questionCount: detail.questionCount,
    questions: detail.questions.map((question) => ({
      questionId: question.questionId,
      assessmentId: question.assessmentId,
      prompt: question.prompt,
      explanation: question.explanation,
      allowsMultiple: question.allowsMultiple,
      sortOrder: question.sortOrder,
      options: question.options.map((option) => ({
        optionId: option.optionId,
        assessmentId: option.assessmentId,
        questionId: option.questionId,
        label: option.label,
        sortOrder: option.sortOrder,
      })),
    })),
  };
}

function normalizeAssessmentDetail(
  moduleId: string,
  authorId: string,
  input: z.infer<typeof UpsertModuleAssessmentSchema>,
  existing: AssessmentDetail | null,
): AssessmentDetail {
  const now = new Date().toISOString();
  const assessmentId = existing?.assessmentId ?? randomUUID();
  const title = input.title?.trim() || existing?.title || 'Module assessment';

  const questions = input.questions.map((question, questionIndex) => {
    const questionId = question.questionId ?? randomUUID();
    const correctCount = question.options.filter((option) => option.isCorrect).length;

    if (!question.allowsMultiple && correctCount !== 1) {
      throw new Error(`Question ${questionIndex + 1} must have exactly one correct answer.`);
    }
    if (question.allowsMultiple && correctCount < 2) {
      throw new Error(`Question ${questionIndex + 1} must have at least two correct answers.`);
    }

    return {
      questionId,
      assessmentId,
      prompt: question.prompt.trim(),
      explanation: question.explanation.trim(),
      allowsMultiple: question.allowsMultiple,
      sortOrder: question.sortOrder ?? (questionIndex + 1) * 10,
      options: question.options.map((option, optionIndex) => ({
        optionId: option.optionId ?? randomUUID(),
        assessmentId,
        questionId,
        label: option.label.trim(),
        sortOrder: option.sortOrder ?? (optionIndex + 1) * 10,
        isCorrect: option.isCorrect,
      })),
    };
  });

  return {
    assessmentId,
    moduleId,
    title,
    description: input.description.trim(),
    passingPercent: input.passingPercent,
    questionCount: questions.length,
    createdOn: existing?.createdOn ?? now,
    updatedOn: now,
    authorId: existing?.authorId ?? authorId,
    questions,
  };
}

async function ensureModuleAssessment(
  moduleId: string,
  authorId: string,
): Promise<AssessmentDetail> {
  const existing = await getModuleAssessmentDetail(moduleId);
  if (existing) {
    return existing;
  }

  await createDefaultModuleAssessment(moduleId, authorId);
  const created = await getModuleAssessmentDetail(moduleId);
  if (!created) {
    throw new Error('Failed to create module assessment');
  }
  return created;
}

async function getEditorModuleAssessmentHandler(
  req: HttpRequest,
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) {
    return auth.error;
  }

  const { moduleId } = req.params as { moduleId: string };
  const module = await getCatalogueItem('MODULE', moduleId);
  if (!module) {
    return { status: 404, jsonBody: { error: 'Module not found' } };
  }

  const detail = await ensureModuleAssessment(moduleId, auth.claims.oid);
  return { status: 200, jsonBody: detail };
}

async function putModuleAssessmentHandler(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireContentEditor(req);
  if ('error' in auth) {
    return auth.error;
  }

  const { moduleId } = req.params as { moduleId: string };
  const module = await getCatalogueItem('MODULE', moduleId);
  if (!module) {
    return { status: 404, jsonBody: { error: 'Module not found' } };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { error: 'Invalid JSON' } };
  }

  const parsed = UpsertModuleAssessmentSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      jsonBody: { error: 'Validation failed', details: parsed.error.flatten() },
    };
  }

  try {
    const existing = await getModuleAssessmentDetail(moduleId);
    const detail = normalizeAssessmentDetail(moduleId, auth.claims.oid, parsed.data, existing);
    await replaceModuleAssessment(detail);
    context.log(`[assessment] saved assessment ${detail.assessmentId} for MODULE ${moduleId}`);
    return { status: 200, jsonBody: detail };
  } catch (err) {
    return {
      status: 400,
      jsonBody: { error: err instanceof Error ? err.message : 'Failed to save assessment' },
    };
  }
}

async function getLearnerModuleAssessmentHandler(
  req: HttpRequest,
): Promise<HttpResponseInit> {
  const auth = await requireLearner(req);
  if ('error' in auth) {
    return auth.error;
  }

  const { moduleId } = req.params as { moduleId: string };
  const module = await getCatalogueItem('MODULE', moduleId);
  if (!module || module.status !== 'Published') {
    return { status: 404, jsonBody: { error: 'Module assessment not found' } };
  }

  const detail = await getModuleAssessmentDetail(moduleId);
  if (!detail || detail.questions.length === 0) {
    return { status: 404, jsonBody: { error: 'Assessment not configured' } };
  }

  return { status: 200, jsonBody: toLearnerAssessment(detail) };
}

async function submitLearnerAssessmentAttemptHandler(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireLearner(req);
  if ('error' in auth) {
    return auth.error;
  }

  const { moduleId } = req.params as { moduleId: string };
  const module = await getCatalogueItem('MODULE', moduleId);
  if (!module || module.status !== 'Published') {
    return { status: 404, jsonBody: { error: 'Module assessment not found' } };
  }

  const detail = await getModuleAssessmentDetail(moduleId);
  if (!detail || detail.questions.length === 0) {
    return { status: 404, jsonBody: { error: 'Assessment not configured' } };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { error: 'Invalid JSON' } };
  }

  const parsed = SubmitAssessmentAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      jsonBody: { error: 'Validation failed', details: parsed.error.flatten() },
    };
  }

  const answerMap = new Map<string, string[]>();
  for (const answer of parsed.data.answers) {
    if (answerMap.has(answer.questionId)) {
      return { status: 400, jsonBody: { error: `Duplicate answer for question ${answer.questionId}` } };
    }
    answerMap.set(answer.questionId, answer.selectedOptionIds);
  }

  const attemptId = randomUUID();
  const answeredOn = new Date().toISOString();
  const storedAnswers: LearnerAssessmentAnswer[] = [];
  let correctQuestions = 0;

  for (const question of detail.questions) {
    const selectedOptionIds = answerMap.get(question.questionId) ?? [];
    const uniqueSelectedOptionIds = [...new Set(selectedOptionIds)];

    if (!question.allowsMultiple && uniqueSelectedOptionIds.length > 1) {
      return {
        status: 400,
        jsonBody: { error: `Question ${question.questionId} allows only one answer.` },
      };
    }

    const validOptionIds = new Set(question.options.map((option) => option.optionId));
    const hasInvalidOption = uniqueSelectedOptionIds.some((optionId) => !validOptionIds.has(optionId));
    if (hasInvalidOption) {
      return {
        status: 400,
        jsonBody: { error: `Question ${question.questionId} contains an invalid option selection.` },
      };
    }

    const correctOptionIds = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.optionId)
      .sort();
    const submittedOptionIds = [...uniqueSelectedOptionIds].sort();
    const isCorrect = correctOptionIds.length === submittedOptionIds.length
      && correctOptionIds.every((optionId, index) => optionId === submittedOptionIds[index]);

    if (isCorrect) {
      correctQuestions += 1;
    }

    storedAnswers.push({
      attemptId,
      userId: auth.claims.oid,
      assessmentId: detail.assessmentId,
      moduleId,
      questionId: question.questionId,
      selectedOptionIds: submittedOptionIds,
      isCorrect,
      answeredOn,
    });
  }

  const totalQuestions = detail.questions.length;
  const scorePercent = totalQuestions === 0 ? 0 : Math.round((correctQuestions / totalQuestions) * 100);
  const outcome: AssessmentOutcome = {
    attemptId,
    userId: auth.claims.oid,
    assessmentId: detail.assessmentId,
    moduleId,
    totalQuestions,
    correctQuestions,
    scorePercent,
    passed: scorePercent >= detail.passingPercent,
    submittedOn: answeredOn,
  };

  await createLearnerAssessmentAnswers(storedAnswers);
  await createAssessmentOutcome(outcome);

  context.log(`[assessment] stored learner attempt ${attemptId} for MODULE ${moduleId}`);
  return {
    status: 200,
    jsonBody: {
      outcome,
      answers: storedAnswers,
    },
  };
}

async function getLatestLearnerAssessmentOutcomeHandler(
  req: HttpRequest,
): Promise<HttpResponseInit> {
  const auth = await requireLearner(req);
  if ('error' in auth) {
    return auth.error;
  }

  const { moduleId } = req.params as { moduleId: string };
  const detail = await getModuleAssessmentDetail(moduleId);
  if (!detail) {
    return { status: 404, jsonBody: { error: 'Assessment not configured' } };
  }

  const outcome = await getLatestAssessmentOutcome(auth.claims.oid, detail.assessmentId);
  if (!outcome) {
    return { status: 404, jsonBody: { error: 'No assessment outcome found' } };
  }

  return { status: 200, jsonBody: outcome };
}

app.http('getEditorModuleAssessment', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'editor/catalogue/modules/{moduleId}/assessment',
  handler: getEditorModuleAssessmentHandler,
});

app.http('putModuleAssessment', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'catalogue/modules/{moduleId}/assessment',
  handler: putModuleAssessmentHandler,
});

app.http('getLearnerModuleAssessment', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'learner/modules/{moduleId}/assessment',
  handler: getLearnerModuleAssessmentHandler,
});

app.http('submitLearnerAssessmentAttempt', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'learner/modules/{moduleId}/assessment/attempts',
  handler: submitLearnerAssessmentAttemptHandler,
});

app.http('getLatestLearnerAssessmentOutcome', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'learner/modules/{moduleId}/assessment/outcome',
  handler: getLatestLearnerAssessmentOutcomeHandler,
});
