import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
const DEMO_ACTOR = '22222222-0000-0000-0000-000000000001';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await admin.rpc('get_lead', { p_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: 'Not found' },   { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actorId = req.headers.get('x-user-id') || '22222222-0000-0000-0000-000000000001';
  const body = await req.json();
  const { real_estate_profile, _log_activity, ...leadUpdates } = body;

  // Fetch current values for activity logging
  let prevStage: string | null = null;
  let prevStatus: string | null = null;
  if (_log_activity !== false) {
    const { data: cur } = await admin.schema('crm').from('leads')
      .select('stage, status').eq('id', id).single();
    prevStage  = cur?.stage  ?? null;
    prevStatus = cur?.status ?? null;
  }

  if (Object.keys(leadUpdates).length > 0) {
    const { error } = await admin.schema('crm').from('leads')
      .update({ ...leadUpdates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      console.error('[PATCH /api/leads/id] update error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (real_estate_profile && Object.keys(real_estate_profile).length > 0) {
    const { error } = await admin.schema('real_estate').from('lead_profiles')
      .upsert({ lead_id: id, ...real_estate_profile, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Auto-log activities for stage/status changes
  const STAGE_LABELS: Record<string, string> = {
    new_lead: 'Novo Lead', contact_initiated: 'Contato Iniciado',
    visit_scheduled: 'Visita Agendada', proposal: 'Proposta',
    negotiation: 'Negociação', won: 'Fechado', lost: 'Perdido',
  };
  const STATUS_LABELS: Record<string, string> = {
    new: 'Novo', open: 'Aberto', pending: 'Pendente',
    resolved: 'Resolvido', won: 'Ganho', lost: 'Perdido',
  };

  if (leadUpdates.stage && prevStage && leadUpdates.stage !== prevStage) {
    await admin.rpc('log_activity', {
      p_lead_id: id, p_type: 'stage_change',
      p_description: `Etapa alterada: ${STAGE_LABELS[prevStage] ?? prevStage} → ${STAGE_LABELS[leadUpdates.stage] ?? leadUpdates.stage}`,
      p_actor_id: actorId,
      p_metadata: { from: prevStage, to: leadUpdates.stage },
    });
  }
  if (leadUpdates.status && prevStatus && leadUpdates.status !== prevStatus) {
    await admin.rpc('log_activity', {
      p_lead_id: id, p_type: 'status_change',
      p_description: `Status alterado: ${STATUS_LABELS[prevStatus] ?? prevStatus} → ${STATUS_LABELS[leadUpdates.status] ?? leadUpdates.status}`,
      p_actor_id: actorId,
      p_metadata: { from: prevStatus, to: leadUpdates.status },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await admin.rpc('log_activity', {
    p_lead_id: id, p_type: 'note',
    p_description: 'Lead removido do sistema.',
    p_actor_id: actorId, p_metadata: {},
  }).catch(() => {}); // best-effort, don't block delete
  const { error } = await admin.schema('crm').from('leads').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
