/**
 * Central API Client (The "Main" fetcher)
 * This wrapper ensures that any non-200 responses from our API throw an Error,
 * preventing silent failures in the frontend (optimistic updates reverting, etc.).
 */
export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('dl_active_user');
    const businessId = localStorage.getItem('dl_active_business');
    if (userId) defaultHeaders['x-user-id'] = userId;
    if (businessId) defaultHeaders['x-business-id'] = businessId;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(endpoint, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // If the server sent an error message, use it. Otherwise, use status text.
    const errorMessage = data?.error || response.statusText || 'Erro desconhecido na API';
    throw new Error(errorMessage);
  }

  return data;
}
