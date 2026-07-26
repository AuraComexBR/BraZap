import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const { tenant: tenantParam } = await searchParams;
  const supabase = await getSupabaseServerClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name")
    .order("name");

  if (!tenants || tenants.length === 0) {
    return <p style={{ color: "#666" }}>Nenhum tenant disponível.</p>;
  }

  const selectedTenantId = tenantParam ?? tenants[0].id;

  const { data: config } = await supabase
    .from("tenant_whatsapp_config")
    .select("waba_id, access_token_encrypted")
    .eq("tenant_id", selectedTenantId)
    .maybeSingle();

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Templates</h1>

      {tenants.length > 1 && (
        <form style={{ marginBottom: "1rem" }}>
          <label>
            Tenant:{" "}
            <select name="tenant" defaultValue={selectedTenantId}>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>{" "}
          <button type="submit">Ver</button>
        </form>
      )}

      {!config?.access_token_encrypted ? (
        <p style={{ color: "#666" }}>
          Esse tenant ainda não tem token de acesso configurado (ver área
          Admin → Tenants). Templates de mensagem só podem ser listados
          depois que o token permanente da Meta estiver salvo.
        </p>
      ) : (
        <TemplatesList wabaId={config.waba_id} accessToken={config.access_token_encrypted} />
      )}
    </div>
  );
}

async function TemplatesList({
  wabaId,
  accessToken,
}: {
  wabaId: string;
  accessToken: string;
}) {
  let templates: any[] = [];
  let fetchError: string | null = null;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/message_templates?limit=50`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
    );
    const data = await res.json();

    if (!res.ok) {
      fetchError = data?.error?.message ?? "Falha ao buscar templates";
    } else {
      templates = data.data ?? [];
    }
  } catch (err: any) {
    fetchError = err?.message ?? "Falha ao buscar templates";
  }

  if (fetchError) {
    return <p style={{ color: "crimson" }}>Erro ao buscar templates: {fetchError}</p>;
  }

  if (templates.length === 0) {
    return (
      <p style={{ color: "#666" }}>
        Nenhum template criado ainda para esse número. Templates são
        criados no painel da Meta (WhatsApp Manager) por enquanto — criar
        direto pelo BraZap é uma fase futura.
      </p>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
          <th style={{ padding: "0.5rem 0" }}>Nome</th>
          <th>Categoria</th>
          <th>Idioma</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {templates.map((t) => (
          <tr key={t.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
            <td style={{ padding: "0.5rem 0" }}>{t.name}</td>
            <td>{t.category}</td>
            <td>{t.language}</td>
            <td>{t.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
