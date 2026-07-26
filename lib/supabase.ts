import { createClient } from "@supabase/supabase-js";

/**
 * Cliente para uso no browser / rotas publicas (usa a anon key, respeita RLS).
 */
export function getSupabaseBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Cliente para uso apenas em codigo server-side de confianca (ex: processar
 * webhook da Meta). Usa a service role key, que IGNORA RLS -- por isso o
 * isolamento por tenant precisa ser feito manualmente no codigo que usa este
 * client (sempre filtrar por tenant_id explicitamente).
 *
 * NUNCA importar este arquivo em codigo que roda no browser.
 */
export function getSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
