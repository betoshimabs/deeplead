import { apiClient } from '../apiClient';

export interface ProspectFilters {
  q?: string;
  status?: string;
  source?: string;
  limit?: number;
  offset?: number;
}

export async function fetchProspects(filters: ProspectFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
  });

  return apiClient(`/api/prospects?${params.toString()}`, { cache: 'no-store' });
}

export async function fetchProspect(id: string) {
  const json: any = await apiClient(`/api/prospects/${id}`, { cache: 'no-store' });
  return json.data;
}

export async function updateProspect(id: string, updates: Record<string, unknown>) {
  return apiClient(`/api/prospects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteProspect(id: string) {
  return apiClient(`/api/prospects/${id}`, { method: 'DELETE' });
}

export async function createProspect(data: Record<string, unknown>) {
  return apiClient('/api/prospects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function convertProspectToLead(id: string) {
  return apiClient(`/api/prospects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'convert_to_lead' }),
  });
}
