import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const supabase = await getSupabaseServerClient();

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("id, name, wa_id, created_at")
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Contatos</h1>
      {error && <p style={{ color: "crimson" }}>Erro: {error.message}</p>}
      {!contacts || contacts.length === 0 ? (
        <p style={{ color: "#666" }}>Nenhum contato ainda.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
              <th style={{ padding: "0.5rem 0" }}>Nome</th>
              <th>Número</th>
              <th>Primeiro contato</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                <td style={{ padding: "0.5rem 0" }}>{c.name || "—"}</td>
                <td>{c.wa_id}</td>
                <td>{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
