import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Atualiza a config de WhatsApp de um tenant existente (waba_id,
 * phone_number_id, token). Restrito a superadmin via RLS (policy
 * "admin can manage tenant config") -- se um agente comum chamar isso,
 * o update simplesmente afeta 0 linhas (RLS bloqueia silenciosamente).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { wabaId, phoneNumberId, accessToken } = await req.json();

  const update: Record<string, string | null> = {};
  if (wabaId !== undefined) update.waba_id = wabaId;
  if (phoneNumberId !== undefined) update.phone_number_id = phoneNumberId;
  if (accessToken !== undefined) update.access_token_encrypted = accessToken || null;

  const { error, count } = await supabase
    .from("tenant_whatsapp_config")
    .update(update, { count: "exact" })
    .eq("tenant_id", tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!count) {
    return NextResponse.json(
      { error: "Nenhuma config atualizada (sem permissão ou tenant sem config ainda)" },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
