import { apiClient } from '../apiClient';

export interface ContactFilters {
  q?: string;
  status?: string;
  source?: string;
  limit?: number;
  offset?: number;
}

export async function fetchContacts(filters: ContactFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
  });

  return apiClient(`/api/contacts?${params.toString()}`, { cache: 'no-store' });
}

export async function fetchContact(id: string) {
  const json: any = await apiClient(`/api/contacts/${id}`, { cache: 'no-store' });
  return json.data;
}

export async function updateContact(id: string, updates: Record<string, unknown>) {
  return apiClient(`/api/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteContact(id: string) {
  return apiClient(`/api/contacts/${id}`, { method: 'DELETE' });
}

export async function createContact(data: Record<string, unknown>) {
  return apiClient('/api/contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function convertContactToLead(id: string) {
  return apiClient(`/api/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'convert_to_lead' }),
  });
}
