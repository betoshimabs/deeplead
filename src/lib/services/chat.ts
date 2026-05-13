import { apiClient } from '../apiClient';

export interface ConversationFilters {
  q?: string;
  status?: string;
  channel?: string;
  assigned_to?: string;
  limit?: number;
  offset?: number;
}

export async function fetchConversations(filters: ConversationFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
  });
  const json: any = await apiClient(`/api/conversations?${params}`, { cache: 'no-store' });
  return json.data;
}

export async function fetchMessages(conversationId: string) {
  const json: any = await apiClient(`/api/conversations/${conversationId}`, { cache: 'no-store' });
  return json.data;
}

export async function sendMessage(conversationId: string, content: string, senderId?: string, isAi = false) {
  return apiClient(`/api/conversations/${conversationId}`, {
    method: 'POST',
    body: JSON.stringify({
      content,
      sender_type: 'agent',
      sender_id: senderId ?? '22222222-0000-0000-0000-000000000001',
      is_ai_suggestion: isAi,
    }),
  });
}

export async function updateConversation(id: string, updates: Record<string, unknown>) {
  return apiClient(`/api/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function fetchTemplates() {
  try {
    const json: any = await apiClient('/api/templates', { cache: 'no-store' });
    return json.data ?? [];
  } catch {
    return [];
  }
}
