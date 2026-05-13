import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function test() {
  const { data, error } = await supabase.rpc('get_whatsapp_credentials', {
    p_business_id: '11111111-0000-0000-0000-000000000001'
  });
  console.log('RPC Error:', error);
  console.log('RPC Data:', data);
}

test();
