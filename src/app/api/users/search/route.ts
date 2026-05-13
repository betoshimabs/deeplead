import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// GET /api/users/search?q=termo&business_id=xxx
// Returns users matching name or email, excluding current business members
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const businessId = req.headers.get('x-business-id') ?? searchParams.get('business_id') ?? '';

  if (q.length < 2) return NextResponse.json({ data: [] });

  // Get existing member user_ids to exclude them
  const { data: existingMembers } = await admin
    .schema('core')
    .from('business_members')
    .select('user_id')
    .eq('business_id', businessId);

  const excludeIds = (existingMembers ?? []).map((m: any) => m.user_id);

  // Search by name OR email (case-insensitive)
  const { data: users, error } = await admin
    .schema('core')
    .from('users')
    .select('id, name, email, avatar_url')
    .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
    .not('id', 'in', excludeIds.length > 0 ? `(${excludeIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)')
    .limit(6);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: users ?? [] });
}
