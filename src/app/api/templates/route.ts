import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET() {
  const { data, error } = await supabaseAdmin
    .schema('messaging')
    .from('message_templates')
    .select('*')
    .eq('business_id', '11111111-0000-0000-0000-000000000001')
    .eq('is_active', true)
    .order('category');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
