const API_BASE = const API_BASE = `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1`;

export function getToken(): string | null {
  return localStorage.getItem('foodloop_token');
}

export function setToken(token: string): void {
  localStorage.setItem('foodloop_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('foodloop_token');
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers = {}, ...rest } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const token = getToken();
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMessage) as Error & { status: number; code?: string; details?: any };
    err.status = response.status;
    err.code = data?.code;
    err.details = data?.details;
    throw err;
  }

  return data;
}
