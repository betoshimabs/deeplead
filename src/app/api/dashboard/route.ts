import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  const userId = req.headers.get('x-user-id');

  if (!businessId || !userId) {
    return NextResponse.json({ error: 'Missing x-business-id or x-user-id header' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') ?? '30');
  const view = searchParams.get('view') ?? 'user';

  // Resolve user role from business_members
  const { data: memberData } = await supabaseAdmin
    .schema('core')
    .from('business_members')
    .select('business_role')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .single();

  const role = memberData?.business_role ?? 'colaborador';

  const { data, error } = await supabaseAdmin.rpc('get_dashboard_data', {
    p_business_id: businessId,
    p_user_id: userId,
    p_role: role,
    p_view: view,
    p_days: days,
  });

  if (error) {
    console.error('[API /dashboard]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, role });
}
