const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  code: number;
  details?: any;

  constructor(message: string, code: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('fixora_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data.message || data.detail || `Request failed with status ${response.status}`;
      
      // If 401 Unauthorized, clear local storage and redirect if in browser
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('fixora_token');
        localStorage.removeItem('fixora_role');
        document.cookie = 'auth_role=; path=/; max-age=0';
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }

      throw new ApiError(errorMessage, response.status, data.details);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error or backend unavailable',
      500
    );
  }
}
