import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// GET /api/campaigns/eligible?filters=... — preview count + sample
export async function GET(req: NextRequest) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Missing x-business-id' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const filters = {
    status_filter:        searchParams.get('status')?.split(',') ?? null,
    source_filter:        searchParams.get('source')?.split(',') ?? null,
    state_code:           searchParams.get('state_code') ?? null,
    city:                 searchParams.get('city') ?? null,
    radius_km:            searchParams.get('radius_km') ? Number(searchParams.get('radius_km')) : null,
    center_lat:           searchParams.get('lat') ? Number(searchParams.get('lat')) : null,
    center_lng:           searchParams.get('lng') ? Number(searchParams.get('lng')) : null,
    age_min:              searchParams.get('age_min') ? Number(searchParams.get('age_min')) : null,
    age_max:              searchParams.get('age_max') ? Number(searchParams.get('age_max')) : null,
    include_reengagement: searchParams.get('reengagement') === 'true',
  };

  const { data, error } = await admin.rpc('get_eligible_contacts', {
    p_business_id:          businessId,
    p_status_filter:        filters.status_filter,
    p_source_filter:        filters.source_filter,
    p_state_code:           filters.state_code,
    p_city:                 filters.city,
    p_radius_km:            filters.radius_km,
    p_center_lat:           filters.center_lat,
    p_center_lng:           filters.center_lng,
    p_age_min:              filters.age_min,
    p_age_max:              filters.age_max,
    p_include_reengagement: filters.include_reengagement,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    count: data?.length ?? 0,
    sample: (data ?? []).slice(0, 5).map((c: any) => ({
      name: c.name, phone: c.phone, city: c.city, state_code: c.state_code, status: c.status,
    })),
  });
}
