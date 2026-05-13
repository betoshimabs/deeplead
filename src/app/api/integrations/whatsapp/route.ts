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

  const { data, error } = await supabaseAdmin
    .schema('integrations')
    .from('channels')
    .select('id, status, display_name, phone_number_id, connected_at, metadata')
    .eq('business_id', businessId)
    .eq('type', 'whatsapp')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) return NextResponse.json({ connected: false });

  return NextResponse.json({
    connected: data.status === 'active',
    channel: {
      id: data.id,
      status: data.status,
      display_name: data.display_name,
      phone_number_id: data.phone_number_id,
      connected_at: data.connected_at,
    },
  });
}

// POST — connect WhatsApp (save credentials + verify with Meta)
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
  } catch (e) {
    return NextResponse.json({ error: 'Não foi possível conectar à API da Meta. Tente novamente.' }, { status: 502 });
  }

  // 2. Generate a secure verify token for this business's webhook
  const verifyToken = `dl_${businessId.replace(/-/g, '').slice(0, 8)}_${Math.random().toString(36).slice(2, 10)}`;

  // 3. Upsert channel record
  const { data, error } = await supabaseAdmin
    .schema('integrations')
    .from('channels')
    .upsert({
      business_id: businessId,
      type: 'whatsapp',
      status: 'active',
      phone_number_id,
      access_token, // stored server-side only, never returned to client
      display_name: displayName,
      verify_token: verifyToken,
      connected_at: new Date().toISOString(),
      metadata: { display_phone_number: displayName },
    }, { onConflict: 'business_id,type' })
    .select('id, display_name, phone_number_id, connected_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    channel: {
      display_name: data.display_name,
      phone_number_id: data.phone_number_id,
      connected_at: data.connected_at,
    },
    webhook: {
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://your-domain.vercel.app'}/api/webhooks/whatsapp`,
      verify_token: verifyToken,
    },
  });
}

// DELETE — disconnect WhatsApp
export async function DELETE(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id' }, { status: 400 });

  const { error } = await supabaseAdmin
    .schema('integrations')
    .from('channels')
    .update({ status: 'inactive', access_token: null })
    .eq('business_id', businessId)
    .eq('type', 'whatsapp');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
