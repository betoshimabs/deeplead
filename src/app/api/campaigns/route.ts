import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id header' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') ?? '50');
  const offset = parseInt(searchParams.get('offset') ?? '0');

  const { data, error } = await supabaseAdmin.rpc('list_campaigns', {
    p_business_id: businessId,
    p_status: status || null,
    p_type: type || null,
    p_limit: limit,
    p_offset: offset
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [], total: data?.length ?? 0 });
}

export async function POST(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id header' }, { status: 400 });

  const body = await req.json();
  const { error, data } = await supabaseAdmin.rpc('create_campaign', {
    p_business_id: businessId,
    p_name: body.name,
    p_type: body.type,
    p_channel: body.channel,
    p_status: body.status ?? 'draft',
    p_content: body.content ?? null,
    p_audience_count: body.audience_count ?? 0,
    p_scheduled_at: body.scheduled_at ?? null
  }).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
