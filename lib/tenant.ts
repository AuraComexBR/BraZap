import { getSupabaseServiceClient } from "./supabase";

/**
 * Dado o phone_number_id que vem no payload do webhook da Meta, descobre
 * a qual tenant (cliente do BraZap) essa mensagem pertence.
 *
 * TODO: criar a tabela tenant_whatsapp_config (ver supabase/schema.sql)
 * e implementar esta consulta de verdade. Por enquanto retorna null.
 */
export async function getTenantByPhoneNumberId(
  phoneNumberId: string
): Promise<{ tenantId: string } | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("tenant_whatsapp_config")
    .select("tenant_id")
    .eq("phone_number_id", phoneNumberId)
    .maybeSingle();

  if (error || !data) return null;

  return { tenantId: data.tenant_id };
}
