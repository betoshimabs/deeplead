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

  const params = {
    p_business_id: businessId,
    p_status:      str('status'),
    p_stage:       str('stage'),
    p_source:      str('source'),
    p_assigned_to: str('assigned_to'),
    p_ip_city:     str('ip_city'),
    p_ip_state:    str('ip_state'),
    p_score_min:   num('score_min'),
    p_score_max:   num('score_max'),
    p_search:      str('q'),
    p_limit:       parseInt(searchParams.get('limit') ?? '100'),
    p_offset:      parseInt(searchParams.get('offset') ?? '0'),
  };

  const countParams = { ...params };
  delete (countParams as any).p_limit;
  delete (countParams as any).p_offset;

  const [{ data, error }, { data: total, error: countError }] = await Promise.all([
    supabaseAdmin.rpc('list_leads', params),
    supabaseAdmin.rpc('count_leads', {
      p_business_id: businessId,
      p_status:      params.p_status,
      p_stage:       params.p_stage,
      p_source:      params.p_source,
      p_assigned_to: params.p_assigned_to,
      p_ip_city:     params.p_ip_city,
      p_ip_state:    params.p_ip_state,
      p_score_min:   params.p_score_min,
      p_score_max:   params.p_score_max,
      p_search:      params.p_search,
    }),
  ]);

  if (error) {
    console.error('[API /leads] error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    count: Number(total ?? (data as any[])?.length ?? 0),
    limit: params.p_limit,
    offset: params.p_offset,
  });
}

export async function POST(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  const userId = req.headers.get('x-user-id') || '22222222-0000-0000-0000-000000000001';
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id header' }, { status: 400 });

  const body = await req.json();
  const { real_estate_profile, ...leadData } = body;

  // Leads must originate from a contact — contact_id is required
  if (!leadData.contact_id) {
    return NextResponse.json(
      { error: 'contact_id is required. Leads must be created via contact conversion.' },
      { status: 400 }
    );
  }

  // Insert lead
  const { data: newLead, error: leadError } = await supabaseAdmin
    .schema('crm')
    .from('leads')
    .insert({ ...leadData, business_id: businessId })
    .select()
    .single();

  if (leadError) return NextResponse.json({ error: leadError.message }, { status: 400 });

  // Insert profile if present
  if (real_estate_profile && Object.keys(real_estate_profile).length > 0) {
    const { error: profileError } = await supabaseAdmin
      .schema('real_estate')
      .from('lead_profiles')
      .insert({ lead_id: newLead.id, ...real_estate_profile });
    if (profileError) console.error('Failed to create lead profile:', profileError.message);
  }

  // Log creation activity
  await supabaseAdmin.rpc('log_activity', {
    p_lead_id: newLead.id,
    p_type: 'note',
    p_description: 'Lead criado manualmente.',
    p_actor_id: '22222222-0000-0000-0000-000000000001', // DEMO_ACTOR
    p_metadata: { source: leadData.source },
  });

  return NextResponse.json({ data: newLead }, { status: 201 });
}
