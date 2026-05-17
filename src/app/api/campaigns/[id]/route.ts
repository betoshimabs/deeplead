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
