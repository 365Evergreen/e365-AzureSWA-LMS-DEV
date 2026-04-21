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
