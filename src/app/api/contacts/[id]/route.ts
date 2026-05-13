import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .schema('crm')
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = req.headers.get('x-user-id') || '22222222-0000-0000-0000-000000000001';
  const { id } = await params;
  const body = await req.json();

  if (body.action === 'convert_to_lead') {
    // 1. Fetch contact
    const { data: contact, error: fetchErr } = await supabaseAdmin
      .schema('crm')
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    if (contact.status === 'converted') return NextResponse.json({ error: 'Already converted' }, { status: 400 });

    // 2. Insert into leads
    const { data: newLead, error: insertErr } = await supabaseAdmin
      .schema('crm')
      .from('leads')
      .insert({
        business_id: contact.business_id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        source: contact.source,
        notes: contact.notes,
        stage: 'new_lead',
        status: 'new',
        score: 50, // Default base score
      })
      .select()
      .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    // 3. Mark contact as converted
    await supabaseAdmin
      .schema('crm')
      .from('contacts')
      .update({ status: 'converted' })
      .eq('id', id);

    // 4. Log activity
    await supabaseAdmin.rpc('log_activity', {
      p_lead_id: newLead.id,
      p_actor_id: userId,
      p_type: 'import',
      p_description: 'Contato convertido em Lead.',
      p_metadata: { from_contact_id: contact.id }
    });

    return NextResponse.json({ success: true, newLeadId: newLead.id });
  }

  // Normal update
  const { error } = await supabaseAdmin
    .schema('crm')
    .from('contacts')
    .update(body)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabaseAdmin
    .schema('crm')
    .from('contacts')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
