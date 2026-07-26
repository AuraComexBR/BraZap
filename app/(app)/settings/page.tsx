import { getSupabaseServerClient } from "@/lib/supabase/server";
import TenantConfigCard from "./tenant-config-card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient();

  const { data: isAdmin } = await supabase.rpc("is_platform_admin");

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, config:tenant_whatsapp_config(waba_id, phone_number_id, access_token_encrypted)")
    .order("name");

  return (
    <div style={{ maxWidth: 480, display: "grid", gap: "1rem" }}>
      <h1>Configurações</h1>
      {!tenants || tenants.length === 0 ? (
        <p style={{ color: "#666" }}>Nenhum tenant disponível.</p>
      ) : (
        tenants.map((t: any) => {
          const config = Array.isArray(t.config) ? t.config[0] : t.config;
          return (
            <TenantConfigCard
              key={t.id}
              tenantId={t.id}
              tenantName={t.name}
              wabaId={config?.waba_id ?? ""}
              phoneNumberId={config?.phone_number_id ?? ""}
              hasToken={Boolean(config?.access_token_encrypted)}
              editable={Boolean(isAdmin)}
            />
          );
        })
      )}
    </div>
  );
}
