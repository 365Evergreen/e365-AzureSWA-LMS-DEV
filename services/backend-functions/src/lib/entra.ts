import { ManagedIdentityCredential } from '@azure/identity';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';

const graphCredential = new ManagedIdentityCredential();

export interface EntraInvitationResult {
  invitedUserId: string;
  inviteRedeemUrl?: string;
}

export interface EntraDirectoryUser {
  id: string;
  mail?: string;
  userPrincipalName?: string;
  otherMails?: string[];
  externalUserState?: string;
}

interface GraphCollectionResponse<TValue> {
  value: TValue[];
  '@odata.nextLink'?: string;
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

export async function listGroupMemberUserIds(groupId: string): Promise<string[]> {
  const userIds: string[] = [];
  let path = `/groups/${encodeURIComponent(groupId)}/transitiveMembers/microsoft.graph.user?$select=id&$top=999`;

  while (path) {
    const response = await graphRequest<GraphCollectionResponse<{ id?: string }>>(path, { method: 'GET' });
    userIds.push(
      ...response.value
        .map((entry) => entry.id?.trim())
        .filter((id): id is string => Boolean(id)),
    );

    path = response['@odata.nextLink']
      ? response['@odata.nextLink'].replace('https://graph.microsoft.com/v1.0', '')
      : '';
  }

  return userIds;
}

export async function findDirectoryUserByEmail(email: string): Promise<EntraDirectoryUser | null> {
  const target = email.trim().toLowerCase();
  let path =
    '/users?$select=id,mail,userPrincipalName,otherMails,externalUserState&$top=999';

  while (path) {
    const response = await graphRequest<{
      value: Array<{
        id: string;
        mail?: string;
        userPrincipalName?: string;
        otherMails?: string[];
        externalUserState?: string;
      }>;
      '@odata.nextLink'?: string;
    }>(path, { method: 'GET' });

    const match = response.value.find((user) => {
      const candidates = [
        user.mail,
        user.userPrincipalName,
        ...(Array.isArray(user.otherMails) ? user.otherMails : []),
      ]
        .filter(Boolean)
        .map((value) => value!.trim().toLowerCase());
      return candidates.includes(target);
    });

    if (match) {
      return match;
    }

    path = response['@odata.nextLink']
      ? response['@odata.nextLink'].replace('https://graph.microsoft.com/v1.0', '')
      : '';
  }

  return null;
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

export async function addUserToReadersGroup(userId: string): Promise<void> {
  const groupId = requiredSetting('LMS_READERS_GROUP_ID');

  try {
    await graphRequest<void>(`/groups/${encodeURIComponent(groupId)}/members/$ref`, {
      method: 'POST',
      body: JSON.stringify({
        '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('One or more added object references already exist') ||
      message.includes('added object references already exist')
    ) {
      return;
    }
    throw error;
  }
}

export function signupResetPasswordUrl(): string {
  return process.env.SIGNUP_RESET_PASSWORD_URL?.trim() || 'https://passwordreset.microsoftonline.com/';
}
