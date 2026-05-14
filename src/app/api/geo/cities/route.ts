import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q     = searchParams.get('q')?.trim() ?? '';
  const state = searchParams.get('state') ?? '';
  const limit = Math.min(Number(searchParams.get('limit') ?? 10), 20);

  if (q.length < 2) return NextResponse.json({ data: [] });

  let query = (admin as any).schema('geo')
    .from('municipalities')
    .select('id,name,state_code,state_name,lat,lng')
    .ilike('name', `${q}%`)
    .order('name')
    .limit(limit);

  if (state) query = query.eq('state_code', state);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
