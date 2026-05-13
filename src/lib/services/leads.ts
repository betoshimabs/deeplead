// ============================================
// Lead Service — fetches from Next.js API routes
// (which use service_role server-side)
// ============================================
import { apiClient } from '../apiClient';

export interface LeadFilters {
  q?: string;
  status?: string;
  stage?: string;
  source?: string;
  assigned_to?: string;
  ip_city?: string;
  ip_state?: string;
  score_min?: number;
  score_max?: number;
  limit?: number;
  offset?: number;
}

export async function fetchLeads(filters: LeadFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
  });

  return apiClient(`/api/leads?${params.toString()}`, { cache: 'no-store' });
}

export async function fetchLead(id: string) {
  const json: any = await apiClient(`/api/leads/${id}`, { cache: 'no-store' });
  return json.data;
}

export async function updateLead(id: string, updates: Record<string, unknown>) {
  return apiClient(`/api/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteLead(id: string) {
  return apiClient(`/api/leads/${id}`, { method: 'DELETE' });
}

export async function createLead(data: Record<string, unknown>) {
  return apiClient('/api/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchMembers() {
  const json: any = await apiClient('/api/members', { cache: 'no-store' });
  return json.data;
}
