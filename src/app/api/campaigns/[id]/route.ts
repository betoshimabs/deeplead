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

  // 2. Get contact IDs from this campaign (before cascade delete)
  const { data: campaignContacts } = await admin
    .schema('campaigns')
    .from('campaign_contacts')
    .select('contact_id')
    .eq('campaign_id', id);

  const contactIds = (campaignContacts ?? []).map((r: any) => r.contact_id);

  // 3. Delete CSV from storage (best-effort)
  if (campaign.export_url) {
    await admin.storage.from('campaign-exports').remove([campaign.export_url]);
  }

  // 4. Delete campaign record (campaign_contacts cascades via FK)
  const { error: deleteErr } = await admin
    .schema('campaigns')
    .from('campaigns')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  // 5. Delete untouched leads created by this campaign
  //    If the lead is still 'new_lead', it hasn't been engaged with yet.
  if (contactIds.length > 0) {
    await admin.schema('crm').from('leads')
      .delete()
      .in('contact_id', contactIds)
      .eq('stage', 'new_lead');
      
    // 6. Revert contacts → 'lost'
    //    Now that we deleted the untouched leads, any contact still in 'in_progress'
    //    might actually have lost their only lead.
    //    To be safe, we just set all campaign contacts to 'lost' UNLESS they still have an active lead.
    
    // First, find which of these contacts STILL have active leads
    const { data: remainingLeads } = await admin.schema('crm').from('leads')
      .select('contact_id')
      .in('contact_id', contactIds);
      
    const contactsWithLeads = new Set((remainingLeads ?? []).map((l: any) => l.contact_id));
    const contactsToRevert = contactIds.filter(id => !contactsWithLeads.has(id));

    if (contactsToRevert.length > 0) {
      await admin.schema('crm').from('contacts')
        .update({ status: 'lost' })
        .in('id', contactsToRevert);
    }
  }

  return NextResponse.json({ success: true });
}
