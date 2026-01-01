// API helper with basePath support
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function apiUrl(path: string): string {
  return `${basePath}${path}`;
}

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), options);
}
