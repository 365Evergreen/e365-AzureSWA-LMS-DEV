function readEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function requireEnv(preferredName: string, ...aliases: string[]): string {
  const value = readEnv(preferredName, ...aliases);
  if (!value) {
    throw new Error(`Missing required configuration: ${[preferredName, ...aliases].join(' or ')}`);
  }
  return value;
}

export function getEntraTenantId(): string {
  return requireEnv('ENTRA_TENANT_ID', 'AZURE_TENANT_ID');
}

export function getBackendApiClientId(): string {
  return requireEnv('ENTRA_CLIENT_ID', 'BACKEND_API_CLIENT_ID');
}

export function getStorageConnectionString(): string {
  return requireEnv('STORAGE_CONNECTION_STRING', 'BLOB_STORAGE_CONNECTION_STRING');
}

/** Service principal object ID for the lms-backend-api Entra app (used for Graph role assignments). */
export function getBackendApiServicePrincipalId(): string {
  return readEnv('ENTRA_BACKEND_SP_ID') ?? '439b0094-1bf9-49b3-aa5a-c500f9243a7d';
}

/** App role ID for the Learner role on lms-backend-api. */
export function getLearnerAppRoleId(): string {
  return readEnv('ENTRA_LEARNER_ROLE_ID') ?? 'a1b2c3d4-0002-0000-0000-000000000002';
}
