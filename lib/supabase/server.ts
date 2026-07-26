import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para uso em Server Components / Route Handlers, com a
 * sessao do agente logado lida dos cookies. Respeita RLS (usa a anon key),
 * diferente do service client em lib/supabase.ts.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chamado de um Server Component sem permissao de escrita de
            // cookie -- ok, o middleware cuida de renovar a sessao.
          }
        },
      },
    }
  );
}
