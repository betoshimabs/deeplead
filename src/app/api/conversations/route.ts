import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
// Removed DEMO_BUSINESS_ID

export async function GET(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id header' }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const str = (k: string) => searchParams.get(k) || null;

  // Special: find conversation by lead_id
  const leadId = str('lead_id');
  if (leadId) {
    const { data, error } = await admin.rpc('get_conversation_by_lead', {
      p_business_id: businessId,
      p_lead_id: leadId,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data?.[0] ?? null });
  }

  const { data, error } = await admin.rpc('list_conversations', {
    p_business_id: businessId,
    p_status:      str('status'),
    p_channel:     str('channel'),
    p_assigned_to: str('assigned_to'),
    p_search:      str('q'),
    p_limit:       parseInt(searchParams.get('limit') ?? '50'),
    p_offset:      parseInt(searchParams.get('offset') ?? '0'),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id header' }, { status: 400 });

  // Create a new conversation for a lead
  const body = await req.json();
  const { lead_id, channel = 'whatsapp', assigned_to } = body;
  if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 });

  const { data, error } = await admin.schema('messaging').from('conversations')
    .insert({
      business_id: businessId,
      lead_id,
      channel,
      assigned_to: assigned_to ?? null,
      status: 'new',
    })
    .select('id, status, channel, unread_count')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
