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
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode !== 'subscribe' || !token) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Find the channel with this verify_token using RPC helper
  const { data, error } = await supabaseAdmin.rpc('find_channel_by_verify_token', {
    p_token: token,
  });

  if (error) {
    console.error('[Webhook GET] DB error:', error.message);
    return new NextResponse('Server Error', { status: 500 });
  }

  const channel = Array.isArray(data) ? data[0] : data;
  if (!channel) {
    console.warn('[Webhook GET] No channel found for token:', token);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Echo the challenge back — Meta requires plain text
  return new NextResponse(challenge ?? '', { status: 200 });
}

// ─── POST — Receive incoming WhatsApp messages ───────────────────────────────
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Meta requires immediate 200 acknowledgement
  const ack = NextResponse.json({ status: 'ok' }, { status: 200 });

  try {
    const entry   = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;

    if (!value?.messages?.length) return ack; // status updates, reactions, etc.

    const msg           = value.messages[0];
    const phoneNumberId = value.metadata?.phone_number_id;
    const fromPhone     = msg.from;
    const msgText       = msg.text?.body ?? '[Mídia não suportada]';
    const wamid         = msg.id;

    if (!phoneNumberId || !fromPhone) return ack;

    // 1. Find which business this phone number belongs to
    const { data: channelRows } = await supabaseAdmin.rpc('find_business_by_phone', {
      p_phone_number_id: phoneNumberId,
    });

    const channelInfo = Array.isArray(channelRows) ? channelRows[0] : channelRows;
    if (!channelInfo) {
      console.warn('[Webhook] No active channel for phone_number_id:', phoneNumberId);
      return ack;
    }

    const businessId = channelInfo.business_id;
    const channelId  = channelInfo.channel_id;
    const formattedPhone = `+${fromPhone}`;

    // 2. Upsert lead by phone number (crm schema)
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

      if (leadErr) { console.error('[Webhook] Lead insert error:', leadErr); return ack; }
      leadId = newLead.id;
    }

    // 3. Upsert conversation (messaging schema)
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

      if (convErr) { console.error('[Webhook] Conv insert error:', convErr); return ack; }
      conversationId = newConv.id;
    }

    // 4. Insert message — deduplicate by external_id (messaging schema)
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

    // 5. Log webhook via RPC helper (avoids integrations schema restriction)
    await supabaseAdmin.rpc('log_webhook_event', {
      p_business_id: businessId,
      p_channel_id: channelId,
      p_source: 'whatsapp',
      p_event_type: msg.type ?? 'text',
      p_payload: body,
      p_processed: true,
    });

  } catch (err) {
    console.error('[Webhook] Unhandled error:', err);
    // Always return 200 so Meta doesn't retry endlessly
  }

  return ack;
}
