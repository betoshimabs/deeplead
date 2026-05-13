import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// GET /api/members — list members with plan capacity info
export async function GET(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id' }, { status: 400 });

  const { data: members, error } = await admin
    .schema('core')
    .from('business_members')
    .select('id, business_role, user:user_id ( id, name, email, avatar_url )')
    .eq('business_id', businessId)
    .order('business_role', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get plan capacity
  const { data: sub } = await admin
    .schema('core')
    .from('subscriptions')
    .select('plan:plan_id ( name, max_users )')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .single();

  const planName = (sub?.plan as any)?.name ?? 'Profissional';
  const maxUsers = (sub?.plan as any)?.max_users ?? 7;

  return NextResponse.json({
    data: members,
    meta: {
      plan_name: planName,
      max_users: maxUsers,
      current_count: members?.length ?? 0,
    },
  });
}

// POST /api/members — invite a user by email (owner/gestor only)
export async function POST(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  const requesterId = req.headers.get('x-user-id');
  if (!businessId || !requesterId) {
    return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
  }

  // Verify requester role
  const { data: requesterMember } = await admin
    .schema('core')
    .from('business_members')
    .select('business_role')
    .eq('business_id', businessId)
    .eq('user_id', requesterId)
    .single();

  if (!requesterMember || !['dono', 'gestor'].includes(requesterMember.business_role)) {
    return NextResponse.json({ error: 'Sem permissão para adicionar membros.' }, { status: 403 });
  }

  // Check plan capacity
  const { data: sub } = await admin
    .schema('core')
    .from('subscriptions')
    .select('plan:plan_id ( max_users )')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .single();

  const maxUsers = (sub?.plan as any)?.max_users ?? 7;

  const { count: currentCount } = await admin
    .schema('core')
    .from('business_members')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId);

  if ((currentCount ?? 0) >= maxUsers) {
    return NextResponse.json({
      error: `Limite do plano atingido (${maxUsers} usuários). Faça upgrade para adicionar mais.`,
    }, { status: 422 });
  }

  const { email, business_role } = await req.json();
  if (!email) return NextResponse.json({ error: 'E-mail obrigatório.' }, { status: 400 });

  // Validate role: gestor can only add colaborador
  const allowedRole =
    requesterMember.business_role === 'dono' ? business_role : 'colaborador';

  // Find user by email
  const { data: targetUser } = await admin
    .schema('core')
    .from('users')
    .select('id, name, email')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (!targetUser) {
    return NextResponse.json({
      error: 'Nenhum usuário encontrado com esse e-mail. A conta deve existir na plataforma.',
    }, { status: 404 });
  }

  // Check if already a member
  const { data: existing } = await admin
    .schema('core')
    .from('business_members')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', targetUser.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Este usuário já é membro do negócio.' }, { status: 409 });
  }

  // Add member
  const { data: newMember, error: insertError } = await admin
    .schema('core')
    .from('business_members')
    .insert({ business_id: businessId, user_id: targetUser.id, business_role: allowedRole ?? 'colaborador' })
    .select('id, business_role, user:user_id ( id, name, email, avatar_url )')
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ data: newMember });
}
