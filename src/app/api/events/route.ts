import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

/**
 * GET /api/events
 * Headers: x-business-id (required)
 * Query:
 *   assigned_to  — filter to a specific business_members.id
 *   month        — YYYY-MM to load events for a specific month
 *   type         — filter by event type
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const assignedTo = searchParams.get('assigned_to') || null;
  const month = searchParams.get('month') || null;
  const type = searchParams.get('type') || null;

  const { data, error } = await admin.rpc('list_events', {
    p_business_id: businessId,
    p_assigned_to: assignedTo,
    p_month:       month,
    p_type:        type,
  });

  if (error) {
    console.error('[API /events]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Reshape flat RPC rows → rich objects expected by the frontend
  const shaped = (data ?? []).map((row: any) => ({
    id:        row.id,
    title:     row.title,
    type:      row.type,
    start_at:  row.start_at,
    end_at:    row.end_at,
    location:  row.location,
    notes:     row.notes,
    confirmed: row.confirmed,
    lead: row.lead_id ? { id: row.lead_id, name: row.lead_name, phone: row.lead_phone } : null,
    member: row.member_id ? {
      id:            row.member_id,
      business_role: row.member_role,
      user: { id: row.user_id, name: row.user_name, avatar_url: row.avatar_url },
    } : null,
  }));

  return NextResponse.json({ data: shaped });
}

/**
 * POST /api/events
 * Body: { title, type, start_at, end_at, assigned_to, lead_id?, location?, notes? }
 */
export async function POST(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id' }, { status: 400 });

  const body = await req.json();
  const { title, type, start_at, end_at, assigned_to, lead_id, location, notes } = body;

  if (!title || !type || !start_at || !end_at || !assigned_to) {
    return NextResponse.json({ error: 'title, type, start_at, end_at, assigned_to are required' }, { status: 400 });
  }

  const { data, error } = await admin
    .schema('scheduling')
    .from('events')
    .insert({
      business_id: businessId, title, type, start_at, end_at, assigned_to,
      lead_id: lead_id ?? null, location: location ?? null, notes: notes ?? null,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
