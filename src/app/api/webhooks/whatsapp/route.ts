import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
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

  if (mode !== 'subscribe' || !token) return new NextResponse('Forbidden', { status: 403 });

  const { data } = await admin.rpc('find_channel_by_verify_token', { p_token: token });
  const channel  = Array.isArray(data) ? data[0] : data;
  if (!channel) return new NextResponse('Forbidden', { status: 403 });

  return new NextResponse(challenge ?? '', { status: 200 });
}

// ─── POST — Receive incoming WhatsApp messages ────────────────────────────────
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  // Meta requires immediate 200
  const ack = NextResponse.json({ status: 'ok' }, { status: 200 });

  try {
    const value         = body?.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages?.length) return ack;

    const msg           = value.messages[0];
    const phoneNumberId = value.metadata?.phone_number_id;
    const fromPhone     = msg.from;   // e.g. "5512981530613"
    const msgText       = msg.text?.body ?? '[Mídia não suportada]';
    const wamid         = msg.id;

    if (!phoneNumberId || !fromPhone) return ack;

    // 1. Resolve business + channel from phone_number_id
    const { data: channelRows } = await admin.rpc('find_business_by_phone', { p_phone_number_id: phoneNumberId });
    const channelInfo = Array.isArray(channelRows) ? channelRows[0] : channelRows;
    if (!channelInfo) { console.warn('[Webhook] No channel for phone_number_id:', phoneNumberId); return ack; }

    const businessId = channelInfo.business_id as string;
    const channelId  = channelInfo.channel_id  as string;

    // Normalise phone for lookup (strip leading + if present, Meta sends without)
    const phoneLookup = fromPhone.replace(/^\+/, '');

    // ── 2. Contact lookup — crm.contacts owns phone ──────────────────────────
    const { data: contactRows } = await admin
      .schema('crm')
      .from('contacts')
      .select('id, name, status')
      .eq('business_id', businessId)
      .or(`phone.eq.${phoneLookup},phone.eq.+${phoneLookup}`)
      .limit(1);

    let contactId: string;
    let contactName: string;

    if (contactRows && contactRows.length > 0) {
      contactId   = contactRows[0].id;
      contactName = contactRows[0].name;
    } else {
      // New contact — create from WhatsApp profile info
      contactName = value.contacts?.[0]?.profile?.name ?? `+${phoneLookup}`;
      const { data: newContact, error: cErr } = await admin
        .schema('crm')
        .from('contacts')
        .insert({
          business_id: businessId,
          name:        contactName,
          phone:       phoneLookup,
          source:      'whatsapp',
          status:      'new',
        })
        .select('id')
        .single();

      if (cErr) { console.error('[Webhook] Contact insert error:', cErr); return ack; }
      contactId = newContact.id;
    }

    // ── 3. Lead lookup or creation ────────────────────────────────────────────
    const { data: leadRows } = await admin
      .schema('crm')
      .from('leads')
      .select('id, stage')
      .eq('contact_id', contactId)
      .limit(1);

    let leadId: string;

    if (leadRows && leadRows.length > 0) {
      leadId = leadRows[0].id;
      
      // Auto-advance from 'new_lead' to 'contact_initiated' when lead sends a message
      if (leadRows[0].stage === 'new_lead') {
        await admin.schema('crm').from('leads')
          .update({ stage: 'contact_initiated' })
          .eq('id', leadId);
      }
    } else {
      // Contact has no lead yet — auto-promote (inbound WhatsApp = intent)
      const { data: newLead, error: lErr } = await admin
        .schema('crm')
        .from('leads')
        .insert({
          business_id: businessId,
          contact_id:  contactId,
          stage:       'new_lead',
          score:       50,
        })
        .select('id')
        .single();

      if (lErr) { console.error('[Webhook] Lead insert error:', lErr); return ack; }
      leadId = newLead.id;

      // Update contact status → in_progress
      await admin.schema('crm').from('contacts')
        .update({ status: 'in_progress' })
        .eq('id', contactId);
    }

    // ── 4. Conversation — find open or create ─────────────────────────────────
    const { data: convRows } = await admin
      .schema('messaging')
      .from('conversations')
      .select('id, unread_count')
      .eq('business_id', businessId)
      .eq('lead_id', leadId)
      .eq('channel', 'whatsapp')
      .neq('status', 'resolved')
      .limit(1);

    let conversationId: string;

    if (convRows && convRows.length > 0) {
      conversationId = convRows[0].id;
      await admin.schema('messaging').from('conversations')
        .update({
          status:          'open',
          last_message_at: new Date().toISOString(),
          updated_at:      new Date().toISOString(),
          unread_count:    (convRows[0].unread_count ?? 0) + 1,
        })
        .eq('id', conversationId);
    } else {
      const { data: newConv, error: convErr } = await admin
        .schema('messaging')
        .from('conversations')
        .insert({
          business_id:     businessId,
          lead_id:         leadId,
          channel:         'whatsapp',
          status:          'open',
          last_message_at: new Date().toISOString(),
          unread_count:    1,
        })
        .select('id')
        .single();

      if (convErr) { console.error('[Webhook] Conv insert error:', convErr); return ack; }
      conversationId = newConv.id;
    }

    // ── 5. Insert message — deduplication by wamid ────────────────────────────
    const { data: existing } = await admin
      .schema('messaging')
      .from('messages')
      .select('id')
      .eq('external_id', wamid)
      .maybeSingle();

    if (!existing) {
      const { data: messageData } = await admin
        .schema('messaging')
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type:     'lead',
          content:         msgText,
          external_id:     wamid,
          read:            false,
        })
        .select('*')
        .single();

      // Log integration event
      await admin.rpc('log_integration_event', {
        p_business_id: businessId,
        p_channel_id:  channelId,
        p_event_type:  'message_received',
        p_status:      'success',
      });

      // Real-time broadcast to frontend (specific chat)
      await admin.channel(`chat_${conversationId}`).send({
        type:    'broadcast',
        event:   'new_message',
        payload: messageData,
      });

      // Real-time broadcast to frontend (sidebar refresh)
      await admin.channel(`business_chat_${businessId}`).send({
        type:  'broadcast',
        event: 'conversation_updated',
        payload: { conversation_id: conversationId },
      });
    }

    // ── 6. Log webhook event ──────────────────────────────────────────────────
    await admin.rpc('log_webhook_event', {
      p_business_id: businessId,
      p_channel_id:  channelId,
      p_source:      'whatsapp',
      p_event_type:  msg.type ?? 'text',
      p_payload:     body,
      p_processed:   true,
    });

  } catch (err) {
    console.error('[Webhook] Unhandled error:', err);
    // Always 200 so Meta doesn't retry
  }

  return ack;
}
