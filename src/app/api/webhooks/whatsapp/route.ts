import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const META_API = 'https://graph.facebook.com/v19.0';

// ─── GET — Meta webhook verification handshake ───────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode       = searchParams.get('hub.mode');
  const token      = searchParams.get('hub.verify_token');
  const challenge  = searchParams.get('hub.challenge');

  if (mode !== 'subscribe' || !token) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Find the channel with this verify_token
  const { data: channel } = await supabaseAdmin
    .schema('integrations')
    .from('channels')
    .select('id')
    .eq('verify_token', token)
    .eq('type', 'whatsapp')
    .maybeSingle();

  if (!channel) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Echo the challenge back — Meta requires plain text integer
  return new NextResponse(challenge, { status: 200 });
}

// ─── POST — Receive incoming WhatsApp messages ───────────────────────────────
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Meta sends a status=200 check — always acknowledge immediately
  const ack = NextResponse.json({ status: 'ok' }, { status: 200 });

  try {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.length) return ack; // status updates, etc.

    const msg         = value.messages[0];
    const phoneNumberId = value.metadata?.phone_number_id;
    const fromPhone   = msg.from; // sender's WhatsApp number (e.g. "5511999990000")
    const msgText     = msg.text?.body ?? '[Mídia não suportada]';
    const wamid       = msg.id; // WhatsApp message ID

    if (!phoneNumberId || !fromPhone) return ack;

    // 1. Find which business this phone number belongs to
    const { data: channelInfo } = await supabaseAdmin
      .rpc('find_business_by_phone', { p_phone_number_id: phoneNumberId })
      .single() as any;

    if (!channelInfo) {
      console.warn('[Webhook] No active channel found for phone_number_id:', phoneNumberId);
      return ack;
    }

    const businessId = channelInfo.business_id;
    const channelId  = channelInfo.channel_id;

    // 2. Upsert contact/lead by phone number
    const formattedPhone = `+${fromPhone}`;
    let leadId: string;

    const { data: existingLead } = await supabaseAdmin
      .schema('crm')
      .from('leads')
      .select('id')
      .eq('business_id', businessId)
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (existingLead) {
      leadId = existingLead.id;
    } else {
      // Create new lead from WhatsApp contact
      const contactName = value.contacts?.[0]?.profile?.name ?? formattedPhone;
      const { data: newLead, error: leadErr } = await supabaseAdmin
        .schema('crm')
        .from('leads')
        .insert({
          business_id: businessId,
          name: contactName,
          phone: formattedPhone,
          source: 'whatsapp',
          status: 'new',
          stage: 'new_lead',
          score: 50,
        })
        .select('id')
        .single();

      if (leadErr) {
        console.error('[Webhook] Failed to create lead:', leadErr);
        return ack;
      }
      leadId = newLead.id;
    }

    // 3. Upsert conversation
    const { data: existingConv } = await supabaseAdmin
      .schema('messaging')
      .from('conversations')
      .select('id, unread_count')
      .eq('business_id', businessId)
      .eq('lead_id', leadId)
      .eq('channel', 'whatsapp')
      .neq('status', 'resolved')
      .maybeSingle();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
      await supabaseAdmin
        .schema('messaging')
        .from('conversations')
        .update({
          status: 'open',
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          unread_count: (existingConv.unread_count ?? 0) + 1,
        })
        .eq('id', conversationId);
    } else {
      const { data: newConv, error: convErr } = await supabaseAdmin
        .schema('messaging')
        .from('conversations')
        .insert({
          business_id: businessId,
          lead_id: leadId,
          channel: 'whatsapp',
          status: 'new',
          last_message_at: new Date().toISOString(),
          unread_count: 1,
        })
        .select('id')
        .single();

      if (convErr) {
        console.error('[Webhook] Failed to create conversation:', convErr);
        return ack;
      }
      conversationId = newConv.id;
    }

    // 4. Insert message (check external_id to avoid duplicates)
    const { data: existingMsg } = await supabaseAdmin
      .schema('messaging')
      .from('messages')
      .select('id')
      .eq('external_id', wamid)
      .maybeSingle();

    if (!existingMsg) {
      await supabaseAdmin
        .schema('messaging')
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'lead',
          content: msgText,
          external_id: wamid,
          read: false,
        });
    }

    // 5. Log webhook
    await supabaseAdmin
      .schema('integrations')
      .from('webhook_logs')
      .insert({
        business_id: businessId,
        channel_id: channelId,
        source: 'whatsapp',
        event_type: msg.type ?? 'text',
        payload: body,
        processed: true,
      });

  } catch (err) {
    console.error('[Webhook] Unhandled error:', err);
    // Always return 200 to Meta so it doesn't retry endlessly
  }

  return ack;
}
