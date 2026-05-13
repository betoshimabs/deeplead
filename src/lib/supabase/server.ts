import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client for use in Server Components, Route Handlers, and Server Actions.
 * Uses cookies for session management.
 *
 * Project: DeepLead
 * Project ID: tvcfzqcwdldryiqtcjob
 * Dashboard: https://supabase.com/dashboard/project/tvcfzqcwdldryiqtcjob
 *
 * ⚠️ The SUPABASE_SECRET_KEY must NEVER be exposed to the browser.
 *    Only use it in server-side code (Edge Functions, API Routes, Server Actions).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookie mutations will be handled by middleware
          }
        },
      },
    }
  );
}
