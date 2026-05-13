import { apiClient } from '@/lib/apiClient';

export type DashboardView = 'user' | 'business';
export type DashboardDays = 7 | 30;

export interface DashboardKpis {
  total_leads: number;
  conversion_rate: number;
  avg_response_hours: number;
  leads_no_contact: number;
}

export interface HotLead {
  id: string;
  name: string;
  score: number;
  stage: string;
  source: string;
  last_contact_at: string | null;
  assigned_name: string | null;
}

export interface RecentMsg {
  id: string;
  channel: string;
  status: string;
  unread_count: number;
  updated_at: string;
  lead_name: string | null;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  type: string;
  start_at: string;
  end_at: string;
  confirmed: boolean;
  location: string | null;
  lead_name: string | null;
}

export interface UnassignedLead {
  id: string;
  name: string;
  score: number;
  source: string;
  created_at: string;
  stage: string;
}

export interface TeamActivity {
  id: string;
  type: string;
  description: string;
  created_at: string;
  actor_name: string | null;
  lead_name: string | null;
}

export interface DashboardData {
  kpis: DashboardKpis;
  hot_leads: HotLead[];
  recent_msgs: RecentMsg[];
  upcoming: UpcomingEvent[];
  unassigned: UnassignedLead[];
  team_activity: TeamActivity[];
  meta: { days: number; view: string; role: string; generated_at: string };
}

export interface DashboardResponse {
  data: DashboardData;
  role: string;
}

export async function fetchDashboardData(
  days: DashboardDays,
  view: DashboardView
): Promise<DashboardResponse> {
  return apiClient<DashboardResponse>(`/api/dashboard?days=${days}&view=${view}`);
}
