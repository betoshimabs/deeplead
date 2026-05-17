import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// ─── GET /api/campaigns ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'external' | 'internal' | null = all

  let query = admin.schema('campaigns').from('campaigns')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate fresh signed URLs for exports that have a path stored
  const enriched = await Promise.all((data ?? []).map(async (c: any) => {
    if (c.type === 'external' && c.export_url && c.export_url.startsWith('campaigns/')) {
      const { data: signed } = await admin.storage
        .from('campaign-exports')
        .createSignedUrl(c.export_url, 60 * 60 * 24 * 7); // 7 days
      return { ...c, export_signed_url: signed?.signedUrl ?? null };
    }
    return c;
  }));

  return NextResponse.json({ data: enriched });
}

// ─── POST /api/campaigns ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  const userId     = req.headers.get('x-user-id') || '22222222-0000-0000-0000-000000000001';
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id' }, { status: 400 });

  const body = await req.json();

  // ── External campaign ──────────────────────────────────────────────────────
  if (body.type === 'external') {
    const {
      name, notes, filters = {}, export_template = 'whatsapp', export_columns,
    } = body;

    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    // 1. Get eligible contacts via DB function
    const { data: contacts, error: filterErr } = await admin.rpc('get_eligible_contacts', {
      p_business_id:         businessId,
      p_status_filter:       filters.status  ?? null,
      p_source_filter:       filters.source  ?? null,
      p_state_code:          filters.state_code ?? null,
      p_city:                filters.city    ?? null,
      p_radius_km:           filters.radius_km   ?? null,
      p_center_lat:          filters.center_lat  ?? null,
      p_center_lng:          filters.center_lng  ?? null,
      p_age_min:             filters.age_min ?? null,
      p_age_max:             filters.age_max ?? null,
      p_include_reengagement: filters.include_reengagement ?? false,
    });

    if (filterErr) return NextResponse.json({ error: filterErr.message }, { status: 500 });
    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: 'Nenhum contato elegível encontrado com os filtros informados.' }, { status: 422 });
    }

    // 2. Generate CSV
    const csv = buildCsv(contacts, export_template, export_columns);

    // 3. Upload to Supabase Storage
    const filePath = `${businessId}/${Date.now()}_${name.replace(/\s+/g,'_')}.csv`;
    const { error: uploadErr } = await admin.storage
      .from('campaign-exports')
      .upload(filePath, Buffer.from(csv, 'utf-8'), {
        contentType: 'text/csv',
        upsert: false,
      });
    if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

    // 4. Create campaign record
    const { data: campaign, error: campErr } = await admin
      .schema('campaigns')
      .from('campaigns')
      .insert({
        business_id:     businessId,
        name,
        notes,
        type:            'external',
        status:          'completed', // Export is immediate
        filters,
        export_template,
        export_columns:  export_columns ?? null,
        export_url:      filePath,    // Store path, not signed URL
        audience_count:  contacts.length,
        contact_count:   contacts.length,
        created_by:      userId,
      })
      .select()
      .single();

    if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 });

    // 5. Snapshot contacts
    const snapshots = contacts.map((c: any) => ({
      campaign_id: campaign.id,
      contact_id:  c.id,
      snapshot: {
        name: c.name, phone: c.phone, email: c.email,
        city: c.city, state_code: c.state_code,
        source: c.source, status: c.status,
      },
    }));

    await admin.schema('campaigns').from('campaign_contacts').insert(snapshots);

    // 6. Auto-create leads for contacts that don't have one yet
    const allContactIds = contacts.map((c: any) => c.id);

    // Find contacts that already have an active lead in this business
    const { data: existingLeads } = await admin.schema('crm').from('leads')
      .select('contact_id')
      .eq('business_id', businessId)
      .in('contact_id', allContactIds);

    const existingLeadContactIds = new Set(
      (existingLeads ?? []).map((l: any) => l.contact_id)
    );

    // Create leads only for contacts without an existing lead
    const newLeads = contacts
      .filter((c: any) => !existingLeadContactIds.has(c.id))
      .map((c: any) => ({
        business_id: businessId,
        contact_id:  c.id,
        stage:       'contact_initiated',
        score:       10,
        notes:       `Lead criado automaticamente via campanha "${name}".`,
        tags:        [] as string[],
      }));

    if (newLeads.length > 0) {
      await admin.schema('crm').from('leads').insert(newLeads);
    }

    // 7. Update contact status
    //    - Contacts with new leads → 'in_progress'
    //    - Already active ('in_progress', 'converted') → untouched
    const newLeadContactIds = newLeads.map((l: any) => l.contact_id);
    if (newLeadContactIds.length > 0) {
      await admin.schema('crm').from('contacts')
        .update({ status: 'in_progress' })
        .in('id', newLeadContactIds);
    }

    // 7. Return signed URL
    const { data: signed } = await admin.storage
      .from('campaign-exports')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7);

    return NextResponse.json({
      data: { ...campaign, export_signed_url: signed?.signedUrl ?? null }
    }, { status: 201 });
  }

  // ── Internal campaign (future) ─────────────────────────────────────────────
  const { data, error } = await admin.schema('campaigns').from('campaigns')
    .insert({ ...body, business_id: businessId, created_by: userId })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

// ─── CSV Builder ──────────────────────────────────────────────────────────────
function buildCsv(contacts: any[], template: string, customColumns?: string[]): string {
  type Col = { key: string; header: string; format?: (v: any, row: any) => string };

  const ALL_COLS: Col[] = [
    { key: 'name',       header: 'Nome' },
    { key: 'phone',      header: 'Telefone',        format: (v) => formatPhone(v) },
    { key: 'email',      header: 'Email' },
    { key: 'city',       header: 'Cidade' },
    { key: 'state_code', header: 'Estado' },
    { key: 'source',     header: 'Origem' },
    { key: 'status',     header: 'Status' },
    { key: 'birthdate',  header: 'Data de Nascimento' },
    { key: 'created_at', header: 'Cadastrado em',   format: (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '' },
  ];

  let cols: Col[];

  switch (template) {
    case 'whatsapp':
      cols = [
        { key: 'name',  header: 'Nome' },
        { key: 'phone', header: 'Telefone', format: (v) => formatPhone(v) },
      ];
      break;
    case 'email':
      cols = [
        { key: 'name',  header: 'Nome' },
        { key: 'email', header: 'Email' },
      ];
      break;
    case 'custom':
      cols = ALL_COLS.filter(c => customColumns?.includes(c.key));
      break;
    case 'full':
    default:
      cols = ALL_COLS;
  }

  const header = cols.map(c => `"${c.header}"`).join(',');
  const rows = contacts.map(row =>
    cols.map(c => {
      const raw = row[c.key] ?? '';
      const val = c.format ? c.format(raw, row) : String(raw);
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [header, ...rows].join('\n');
}

function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 11) return `55${digits}`;
  if (digits.length === 10) return `55${digits}`;
  return digits;
}
