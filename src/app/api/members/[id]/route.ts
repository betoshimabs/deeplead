import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// PATCH /api/members/[id] — change role (dono only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = req.headers.get('x-business-id');
  const requesterId = req.headers.get('x-user-id');

  if (!businessId || !requesterId) {
    return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
  }

  // Verify requester is dono (only dono can change roles)
  const { data: requester } = await admin
    .schema('core')
    .from('business_members')
    .select('business_role')
    .eq('business_id', businessId)
    .eq('user_id', requesterId)
    .single();

  if (!requester || requester.business_role !== 'dono') {
    return NextResponse.json({ error: 'Apenas o dono pode alterar papéis de membros.' }, { status: 403 });
  }

  const { business_role } = await req.json();
  if (!['gestor', 'colaborador'].includes(business_role)) {
    return NextResponse.json({ error: 'Papel inválido.' }, { status: 400 });
  }

  // Prevent changing the dono's own role
  const { data: target } = await admin
    .schema('core')
    .from('business_members')
    .select('business_role, user_id')
    .eq('id', id)
    .single();

  if (target?.business_role === 'dono') {
    return NextResponse.json({ error: 'O papel do dono não pode ser alterado.' }, { status: 403 });
  }

  const { data, error } = await admin
    .schema('core')
    .from('business_members')
    .update({ business_role })
    .eq('id', id)
    .select('id, business_role, user:user_id ( id, name, email )')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE /api/members/[id] — remove member (dono or gestor can remove colaboradores; dono can remove gestores)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = req.headers.get('x-business-id');
  const requesterId = req.headers.get('x-user-id');

  if (!businessId || !requesterId) {
    return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
  }

  // Verify requester role
  const { data: requester } = await admin
    .schema('core')
    .from('business_members')
    .select('business_role')
    .eq('business_id', businessId)
    .eq('user_id', requesterId)
    .single();

  if (!requester || !['dono', 'gestor'].includes(requester.business_role)) {
    return NextResponse.json({ error: 'Sem permissão para remover membros.' }, { status: 403 });
  }

  // Get target member
  const { data: target } = await admin
    .schema('core')
    .from('business_members')
    .select('business_role, user_id')
    .eq('id', id)
    .single();

  if (!target) return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 });

  // Dono cannot be removed
  if (target.business_role === 'dono') {
    return NextResponse.json({ error: 'O dono não pode ser removido do negócio.' }, { status: 403 });
  }

  // Gestor can only remove colaboradores
  if (requester.business_role === 'gestor' && target.business_role !== 'colaborador') {
    return NextResponse.json({ error: 'Gestores só podem remover colaboradores.' }, { status: 403 });
  }

  const { error } = await admin
    .schema('core')
    .from('business_members')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
