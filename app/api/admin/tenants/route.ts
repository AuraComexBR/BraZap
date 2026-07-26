import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Cria um novo tenant + sua config de WhatsApp. Restrito a superadmins --
 * a checagem aqui e so pra dar um erro claro cedo; a garantia de verdade
 * e a policy "admin can manage tenants" (RLS), que bloquearia o insert de
 * qualquer jeito se nao for admin.
 */
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Apenas superadmin" }, { status: 403 });
  }

  const { name, wabaId, phoneNumberId, accessToken } = await req.json();

  if (!name || !wabaId || !phoneNumberId) {
    return NextResponse.json(
      { error: "name, wabaId e phoneNumberId sao obrigatorios" },
      { status: 400 }
    );
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({ name })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json(
      { error: `Falha ao criar tenant: ${tenantError?.message}` },
      { status: 500 }
    );
  }

  const { error: configError } = await supabase
    .from("tenant_whatsapp_config")
    .insert({
      tenant_id: tenant.id,
      waba_id: wabaId,
      phone_number_id: phoneNumberId,
      access_token_encrypted: accessToken || null,
    });

  if (configError) {
    return NextResponse.json(
      { error: `Tenant criado, mas falha na config: ${configError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, tenantId: tenant.id });
}
