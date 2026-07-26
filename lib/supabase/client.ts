import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso no browser (Client Components), com sessao
 * sincronizada via cookies com o servidor/middleware.
 */
export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
