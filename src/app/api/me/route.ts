import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

/**
 * GET /api/me
 * Headers: x-user-id (required)
 *
 * Returns the authenticated user's profile along with their
 * business memberships, so the frontend always reflects the
 * live database state instead of hardcoded DEV_USERS data.
 */
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Missing x-user-id' }, { status: 400 });

  // Fetch user profile
  const { data: user, error: userError } = await admin
    .schema('core')
    .from('users')
    .select('id, name, email, avatar_url, platform_role')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Fetch business memberships (with business name)
  const { data: memberships } = await admin
    .schema('core')
    .from('business_members')
    .select('id, business_role, business:business_id ( id, name )')
    .eq('user_id', userId);

  const businesses = (memberships ?? []).map((m: any) => ({
    memberId: m.id,           // business_members.id (used as assigned_to FK)
    id: m.business.id,        // businesses.id
    name: m.business.name,
    role: m.business_role,    // 'dono' | 'gestor' | 'colaborador'
  }));

  return NextResponse.json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      platform_role: user.platform_role,
      businesses,
      // Convenience: role in first business (or null)
      role: businesses[0]?.role ?? null,
    }
  });
}
