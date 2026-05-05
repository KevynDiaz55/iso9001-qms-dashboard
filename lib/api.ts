const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}

