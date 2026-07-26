import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function count(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  table: string,
  filter?: (q: any) => any
) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count: total } = await query;
  return total ?? 0;
}

export default async function MetricsPage() {
  const supabase = await getSupabaseServerClient();

  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    totalContacts,
    totalConversations,
    activeConversations,
    totalMessages,
    inbound,
    outbound,
  ] = await Promise.all([
    count(supabase, "contacts"),
    count(supabase, "conversations"),
    count(supabase, "conversations", (q) => q.gte("last_message_at", sevenDaysAgo)),
    count(supabase, "messages"),
    count(supabase, "messages", (q) => q.eq("direction", "in")),
    count(supabase, "messages", (q) => q.eq("direction", "out")),
  ]);

  const cards = [
    { label: "Contatos", value: totalContacts },
    { label: "Conversas", value: totalConversations },
    { label: "Conversas ativas (7 dias)", value: activeConversations },
    { label: "Mensagens totais", value: totalMessages },
    { label: "Recebidas", value: inbound },
    { label: "Enviadas", value: outbound },
  ];

  return (
    <div>
      <h1>Métricas</h1>
      <p style={{ color: "#666", fontSize: "0.85rem" }}>
        Números básicos por enquanto (sem gráfico ainda) — reflete só o(s)
        tenant(s) que você tem acesso.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "0.75rem",
          marginTop: "1rem",
          maxWidth: 720,
        }}
      >
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              border: "1px solid #eee",
              borderRadius: 8,
              padding: "1rem",
            }}
          >
            <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{c.value}</div>
            <div style={{ fontSize: "0.8rem", color: "#666" }}>{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
