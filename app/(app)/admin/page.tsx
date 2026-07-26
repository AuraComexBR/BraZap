import { getSupabaseServerClient } from "@/lib/supabase/server";
import NewTenantForm from "./new-tenant-form";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient();

  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, name, created_at, config:tenant_whatsapp_config(waba_id, phone_number_id, access_token_encrypted)")
    .order("created_at", { ascending: false });

  return (
    <div style={{ display: "grid", gap: "2rem", maxWidth: 720 }}>
      <section>
        <h1>Tenants</h1>
        {error && <p style={{ color: "crimson" }}>Erro: {error.message}</p>}
        {!tenants || tenants.length === 0 ? (
          <p style={{ color: "#666" }}>Nenhum tenant cadastrado ainda.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                <th style={{ padding: "0.5rem 0" }}>Nome</th>
                <th>WABA ID</th>
                <th>Phone Number ID</th>
                <th>Token configurado?</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t: any) => (
                <tr key={t.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <td style={{ padding: "0.5rem 0" }}>{t.name}</td>
                  <td>{t.config?.[0]?.waba_id ?? t.config?.waba_id ?? "—"}</td>
                  <td>{t.config?.[0]?.phone_number_id ?? t.config?.phone_number_id ?? "—"}</td>
                  <td>
                    {(t.config?.[0]?.access_token_encrypted ?? t.config?.access_token_encrypted)
                      ? "Sim"
                      : "Não"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Novo tenant</h2>
        <NewTenantForm />
      </section>
    </div>
  );
}
