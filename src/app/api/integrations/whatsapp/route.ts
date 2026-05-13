import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const META_API = 'https://graph.facebook.com/v19.0';

// GET — returns WhatsApp channel status (no token exposed to client)
export async function GET(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id' }, { status: 400 });

  // Use RPC helper to avoid PostgREST schema-switching restriction
  const { data, error } = await supabaseAdmin.rpc('get_whatsapp_channel', {
    p_business_id: businessId,
  });

  if (error) {
    console.error('[GET /api/integrations/whatsapp]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return NextResponse.json({ connected: false });

  return NextResponse.json({
    connected: row.status === 'active',
    channel: {
      id: row.id,
      status: row.status,
      display_name: row.display_name,
      phone_number_id: row.phone_number_id,
      connected_at: row.connected_at,
    },
  });
}

// POST — connect WhatsApp (verify credentials with Meta, then save)
export async function POST(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id' }, { status: 400 });

  const { phone_number_id, access_token } = await req.json();

  if (!phone_number_id || !access_token) {
    return NextResponse.json({ error: 'phone_number_id e access_token são obrigatórios' }, { status: 400 });
  }

  // 1. Verify credentials against Meta API
  let displayName = '';
  try {
    const metaRes = await fetch(
      `${META_API}/${phone_number_id}?fields=display_phone_number,verified_name&access_token=${access_token}`
    );
    const metaData = await metaRes.json();

    if (!metaRes.ok || metaData.error) {
      return NextResponse.json({
        error: metaData.error?.message ?? 'Credenciais inválidas. Verifique o Phone Number ID e o Access Token.',
        meta_error: metaData.error,
      }, { status: 400 });
    }

    displayName = metaData.verified_name || metaData.display_phone_number || 'WhatsApp Business';
  } catch {
    return NextResponse.json({ error: 'Não foi possível conectar à API da Meta. Tente novamente.' }, { status: 502 });
  }

  // 2. Generate a secure verify token for this business's webhook
  const verifyToken = `dl_${businessId.replace(/-/g, '').slice(0, 8)}_${Math.random().toString(36).slice(2, 10)}`;

  // 3. Upsert channel record via RPC helper
  const { data, error } = await supabaseAdmin.rpc('upsert_whatsapp_channel', {
    p_business_id: businessId,
    p_phone_number_id: phone_number_id,
    p_access_token: access_token,
    p_display_name: displayName,
    p_verify_token: verifyToken,
    p_metadata: { display_phone_number: displayName },
  });

  if (error) {
    console.error('[POST /api/integrations/whatsapp]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    success: true,
    channel: {
      display_name: row?.display_name ?? displayName,
      phone_number_id: row?.phone_number_id ?? phone_number_id,
      connected_at: row?.connected_at ?? new Date().toISOString(),
    },
    webhook: {
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://deeplead-chi.vercel.app'}/api/webhooks/whatsapp`,
      verify_token: verifyToken,
    },
  });
}

// DELETE — disconnect WhatsApp
export async function DELETE(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id' }, { status: 400 });

  const { error } = await supabaseAdmin.rpc('disconnect_whatsapp_channel', {
    p_business_id: businessId,
  });

  if (error) {
    console.error('[DELETE /api/integrations/whatsapp]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
