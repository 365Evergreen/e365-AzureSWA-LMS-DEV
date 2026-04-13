import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { sendSignupConfirmationEmail } from '../lib/email';
import { createSignupRequest, type SignupRequestFieldValue } from '../lib/storage';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SignupFieldSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  type: z.string().trim().min(1),
  value: z.string().trim(),
  required: z.boolean().optional(),
});

const SubmitSignupRequestSchema = z.object({
  pagePath: z.string().trim().min(1).default('/sign-up'),
  formTitle: z.string().trim().optional(),
  fields: z.array(SignupFieldSchema).min(1, 'At least one field is required'),
});

async function signupRequestsHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: CORS_HEADERS };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { error: 'Request body must be valid JSON' }, headers: CORS_HEADERS };
  }

  const parsed = SubmitSignupRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      jsonBody: { error: 'Invalid request', details: parsed.error.flatten() },
      headers: CORS_HEADERS,
    };
  }

  const fields = parsed.data.fields.map((field) => ({
    ...field,
    value: field.value.trim(),
  }));

  const missingRequired = fields.find((field) => field.required && !field.value);
  if (missingRequired) {
    return {
      status: 400,
      jsonBody: { error: `${missingRequired.label} is required` },
      headers: CORS_HEADERS,
    };
  }

  const email = findFieldValue(fields, (field) =>
    field.type.toLowerCase() === 'email' || field.id.toLowerCase().includes('email'),
  );
  if (!email || !isValidEmail(email)) {
    return {
      status: 400,
      jsonBody: { error: 'A valid email address is required' },
      headers: CORS_HEADERS,
    };
  }

  const firstName = findFieldValue(fields, (field) => field.id.toLowerCase() === 'first-name' || field.id.toLowerCase() === 'firstname');
  const lastName = findFieldValue(fields, (field) => field.id.toLowerCase() === 'last-name' || field.id.toLowerCase() === 'lastname');
  const requestId = randomUUID();
  const submittedAt = new Date().toISOString();

  await createSignupRequest({
    requestId,
    submittedAt,
    status: 'Pending',
    pagePath: parsed.data.pagePath,
    formTitle: parsed.data.formTitle,
    email,
    firstName,
    lastName,
    fields: fields as SignupRequestFieldValue[],
  });

  await sendSignupConfirmationEmail({ to: email, firstName });

  context.log(`signupRequests: stored request ${requestId} for ${email}`);
  return {
    status: 201,
    jsonBody: {
      requestId,
      message: 'Thanks — your request has been received. Please check your email for confirmation.',
    },
    headers: CORS_HEADERS,
  };
}

function findFieldValue(
  fields: Array<z.infer<typeof SignupFieldSchema>>,
  predicate: (field: z.infer<typeof SignupFieldSchema>) => boolean,
): string | undefined {
  return fields.find(predicate)?.value;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

app.http('signupRequests', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'signup-requests',
  handler: signupRequestsHandler,
});
