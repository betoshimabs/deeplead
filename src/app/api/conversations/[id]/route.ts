import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);

  const { data, error } = await supabaseAdmin.rpc('get_messages', {
    p_conversation_id: id,
    p_limit:  parseInt(searchParams.get('limit') ?? '100'),
    p_offset: parseInt(searchParams.get('offset') ?? '0'),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .schema('messaging')
    .from('messages')
    .insert({
      conversation_id: id,
      sender_type: body.sender_type ?? 'agent',
      sender_id:   body.sender_id ?? null,
      content:     body.content,
      is_ai_suggestion: body.is_ai_suggestion ?? false,
      read: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Update conversation last_message_at + reset unread for agent messages
  await supabaseAdmin
    .schema('messaging')
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(body.sender_type === 'agent' ? { unread_count: 0 } : {}),
    })
    .eq('id', id);

  // --- REAL WHATSAPP DELIVERY ---
  if (body.sender_type === 'agent') {
    try {
      // Get conversation + lead phone
      const { data: conv } = await supabaseAdmin
        .schema('messaging')
        .from('conversations')
        .select('lead_id, business_id, channel')
        .eq('id', id)
        .single();

      if (conv?.channel === 'whatsapp') {
        const [{ data: lead }, { data: channel }] = await Promise.all([
          supabaseAdmin.schema('crm').from('leads').select('phone').eq('id', conv.lead_id).single(),
          supabaseAdmin.schema('integrations').from('channels')
            .select('phone_number_id, access_token')
            .eq('business_id', conv.business_id)
            .eq('type', 'whatsapp')
            .eq('status', 'active')
            .maybeSingle(),
        ]);

        if (lead?.phone && channel?.phone_number_id && channel?.access_token) {
          const toPhone = lead.phone.replace(/\D/g, ''); // strip non-digits
          const metaRes = await fetch(
            `https://graph.facebook.com/v19.0/${channel.phone_number_id}/messages`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${channel.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: toPhone,
                type: 'text',
                text: { body: body.content },
              }),
            }
          );

          if (metaRes.ok) {
            const metaData = await metaRes.json();
            const wamid = metaData.messages?.[0]?.id;
            if (wamid) {
              // Save the wamid for delivery tracking
              await supabaseAdmin
                .schema('messaging')
                .from('messages')
                .update({ external_id: wamid })
                .eq('id', data.id);
            }
          } else {
            const errData = await metaRes.json();
            console.error('[WhatsApp Send] Meta API error:', errData);
          }
        }
      }
    } catch (whatsappErr) {
      // Don't fail the request if WhatsApp delivery fails — message is already saved
      console.error('[WhatsApp Send] Delivery error:', whatsappErr);
    }
  }

  return NextResponse.json({ data }, { status: 201 });
}


export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const { error } = await supabaseAdmin
    .schema('messaging')
    .from('conversations')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // --- TRIGGER AGENT IMMEDIATELY ON MODE CHANGE ---
  if (body.ai_mode === 'agent') {
    supabaseAdmin.functions.invoke('chat-agent', {
      body: { conversation_id: id }
    }).catch(err => console.error('[Agent Trigger] Erro ao invocar chat-agent no modo manual:', err));
  }

  return NextResponse.json({ success: true });
}
