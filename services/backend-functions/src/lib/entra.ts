import { ManagedIdentityCredential } from '@azure/identity';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';

const graphCredential = new ManagedIdentityCredential();

export interface EntraInvitationResult {
  invitedUserId: string;
  inviteRedeemUrl?: string;
}

function requiredSetting(name: string): string {
  const value = process.env[name]?.trim() ?? '';
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

async function graphToken(): Promise<string> {
  const token = await graphCredential.getToken(GRAPH_SCOPE);
  if (!token?.token) {
    throw new Error('Could not acquire Microsoft Graph token from managed identity');
  }
  return token.token;
}

async function graphRequest<T>(path: string, init: RequestInit): Promise<T> {
  const token = await graphToken();
  const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Graph request failed (${response.status} ${response.statusText}): ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function inviteLearnerGuest(input: {
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<EntraInvitationResult> {
  const displayName = [input.firstName?.trim(), input.lastName?.trim()].filter(Boolean).join(' ') || input.email;
  const inviteRedirectUrl = requiredSetting('LEARNER_INVITE_REDIRECT_URL');

  const invitation = await graphRequest<{
    inviteRedeemUrl?: string;
    invitedUser?: { id?: string };
  }>('/invitations', {
    method: 'POST',
    body: JSON.stringify({
      invitedUserEmailAddress: input.email,
      invitedUserDisplayName: displayName,
      inviteRedirectUrl,
      sendInvitationMessage: true,
      invitedUserType: 'Guest',
    }),
  });

  const invitedUserId = invitation.invitedUser?.id;
  if (!invitedUserId) {
    throw new Error('Graph invitation response did not include an invited user ID');
  }

  return {
    invitedUserId,
    inviteRedeemUrl: invitation.inviteRedeemUrl,
  };
}

export async function assignLearnerAppRole(userId: string): Promise<void> {
  const resourceId = requiredSetting('LEARNER_RESOURCE_SP_OBJECT_ID');
  const appRoleId = requiredSetting('LEARNER_APP_ROLE_ID');

  try {
    await graphRequest<void>(`/users/${encodeURIComponent(userId)}/appRoleAssignments`, {
      method: 'POST',
      body: JSON.stringify({
        principalId: userId,
        resourceId,
        appRoleId,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Permission being assigned already exists on the object')) {
      return;
    }
    throw error;
  }
}
