import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// GET /api/campaigns/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Campaign record
  const { data: campaign, error } = await admin
    .schema('campaigns')
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });
  }

  // 2. Contacts snapshot
  const { data: contacts } = await admin
    .schema('campaigns')
    .from('campaign_contacts')
    .select('contact_id, snapshot, added_at')
    .eq('campaign_id', id)
    .order('added_at', { ascending: true });

  // 3. Fresh signed URL (7 days)
  let signedUrl: string | null = null;
  if (campaign.export_url?.startsWith(campaign.business_id)) {
    const { data: signed } = await admin.storage
      .from('campaign-exports')
      .createSignedUrl(campaign.export_url, 60 * 60 * 24 * 7);
    signedUrl = signed?.signedUrl ?? null;
  }

  return NextResponse.json({
    data: {
      ...campaign,
      export_signed_url: signedUrl,
      contacts: (contacts ?? []).map((c: any) => c.snapshot),
    },
  });
}

// DELETE /api/campaigns/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Fetch campaign so we know the storage path
  const { data: campaign, error: fetchErr } = await admin
    .schema('campaigns')
    .from('campaigns')
    .select('id, export_url')
    .eq('id', id)
    .single();

  if (fetchErr || !campaign) {
    return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });
  }

  // 2. Delete CSV from storage (best-effort)
  if (campaign.export_url) {
    await admin.storage.from('campaign-exports').remove([campaign.export_url]);
  }

  // 3. Delete campaign record (campaign_contacts cascades via FK)
  const { error: deleteErr } = await admin
    .schema('campaigns')
    .from('campaigns')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
