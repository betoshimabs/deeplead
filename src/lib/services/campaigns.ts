import { apiClient } from '../apiClient';
import type { Campaign } from '@/types';

export interface CampaignFilters {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export async function fetchCampaigns(filters: CampaignFilters = {}): Promise<{ data: Campaign[], total: number }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
  });

  const json: any = await apiClient(`/api/campaigns?${params.toString()}`, { cache: 'no-store' });
  return { data: json.data ?? [], total: json.total ?? 0 };
}

export async function createCampaign(data: Partial<Campaign>) {
  return apiClient('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
