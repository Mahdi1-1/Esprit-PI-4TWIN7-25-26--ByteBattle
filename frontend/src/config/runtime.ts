const envApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export function getBackendOrigin(): string {
  if (envApiUrl) return envApiUrl;
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return 'http://localhost:4001';
}

export function getApiBaseUrl(): string {
  if (envApiUrl) return `${envApiUrl}/api`;
  return '/api';
}

export function getSocketNamespaceUrl(namespace: string): string {
  const cleanNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
  if (envApiUrl) return `${envApiUrl}${cleanNamespace}`;
  return cleanNamespace;
}
