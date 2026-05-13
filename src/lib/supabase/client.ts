import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for use in Client Components (browser).
 * Uses the publishable key — safe to expose. RLS enforces access control.
 *
 * Project: DeepLead
 * Project ID: tvcfzqcwdldryiqtcjob
 * Dashboard: https://supabase.com/dashboard/project/tvcfzqcwdldryiqtcjob
 *
 * ⚠️ NEVER use the secret key here. Only use NEXT_PUBLIC_* variables.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
