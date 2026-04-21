import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ManagedIdentityCredential } from '@azure/identity';
import { acceptSignupRequestByInvitedUserId } from '../lib/storage';
import { extractBearerToken, validateToken } from '../middleware/validateToken';
import { getBackendApiServicePrincipalId, getLearnerAppRoleId } from '../lib/config';

async function assignLearnerRole(userOid: string, context: InvocationContext): Promise<void> {
  const credential = new ManagedIdentityCredential();
  const tokenResponse = await credential.getToken('https://graph.microsoft.com/.default');

  const backendSpId = getBackendApiServicePrincipalId();
  const learnerRoleId = getLearnerAppRoleId();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/servicePrincipals/${backendSpId}/appRoleAssignedTo`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenResponse.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        principalId: userOid,
        resourceId: backendSpId,
        appRoleId: learnerRoleId,
      }),
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: { code?: string } };
    // 400 Permission_Duplicated means the role is already assigned — treat as success
    if (response.status === 400 && body?.error?.code === 'Permission_Duplicated') {
      context.log(`acceptSignupRequest: user ${userOid} already has Learner role`);
      return;
    }
    throw new Error(`Graph assignLearnerRole failed ${response.status}: ${JSON.stringify(body)}`);
  }

  context.log(`acceptSignupRequest: assigned Learner role to ${userOid}`);
}

async function acceptSignupRequestHandler(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const token = extractBearerToken(req);
  if (!token) {
    return { status: 401, jsonBody: { error: 'Missing bearer token' } };
  }

  let claims;
  try {
    claims = await validateToken(token);
  } catch (error) {
    context.warn('acceptSignupRequest: token validation failed', error);
    return { status: 401, jsonBody: { error: 'Invalid or expired token' } };
  }

  const updated = await acceptSignupRequestByInvitedUserId(claims.oid);
  context.log(`acceptSignupRequest: ${updated ? 'updated' : 'no-match'} for ${claims.oid}`);

  if (updated) {
    try {
      await assignLearnerRole(claims.oid, context);
    } catch (error) {
      context.error('acceptSignupRequest: failed to assign Learner role', error);
      // Signup record is already updated; return 500 so the client can retry the role assignment
      return { status: 500, jsonBody: { error: 'Signup accepted but role assignment failed' } };
    }
  }

  return { status: 204 };
}

app.http('acceptSignupRequest', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'signup-requests/accept',
  handler: acceptSignupRequestHandler,
});
