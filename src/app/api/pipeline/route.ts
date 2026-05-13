import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
// Removed DEMO_BUSINESS_ID

export async function GET(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id header' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const str = (k: string) => searchParams.get(k) || null;
  const num = (k: string) => { const v = searchParams.get(k); return v ? parseInt(v) : null; };

  const { data, error } = await supabaseAdmin.rpc('get_pipeline', {
    p_business_id: businessId,
    p_assigned_to: str('assigned_to'),
    p_source:      str('source'),
    p_score_min:   num('score_min'),
    p_score_max:   num('score_max'),
  });

  if (error) {
    console.error('[API /pipeline]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  // Move a lead to a new stage (drag-and-drop)
  const { lead_id, stage } = await req.json();
  if (!lead_id || !stage) return NextResponse.json({ error: 'lead_id and stage required' }, { status: 400 });

  const { error } = await supabaseAdmin
    .schema('crm')
    .from('leads')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', lead_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
