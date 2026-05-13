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
  const q = searchParams.get('q');
  const status = searchParams.get('status');
  const source = searchParams.get('source');
  const limit = parseInt(searchParams.get('limit') ?? '50');
  const offset = parseInt(searchParams.get('offset') ?? '0');

  let query = supabaseAdmin
    .schema('crm')
    .from('contacts')
    .select('*', { count: 'exact' })
    .eq('business_id', businessId);

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  if (status) query = query.eq('status', status);
  if (source) query = query.eq('source', source);

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id header' }, { status: 400 });

  const body = await req.json();
  
  if (Array.isArray(body)) {
    // Bulk insert
    const insertPayload = body.map(p => ({
      business_id: businessId,
      name: p.name,
      phone: p.phone,
      email: p.email,
      source: p.source ?? 'import',
      status: p.status ?? 'new',
      notes: p.notes,
    }));
    
    const { error, data } = await supabaseAdmin
      .schema('crm')
      .from('contacts')
      .insert(insertPayload)
      .select();
      
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data }, { status: 201 });
  } else {
    // Single insert
    const { error, data } = await supabaseAdmin
      .schema('crm')
      .from('contacts')
      .insert({
        business_id: businessId,
        name: body.name,
        phone: body.phone,
        email: body.email,
        source: body.source ?? 'direct',
        status: body.status ?? 'new',
        notes: body.notes,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data }, { status: 201 });
  }
}
