import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const supabase = await getSupabaseServerClient();

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("id, last_message_at, contact:contacts(name, wa_id)")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) {
    return <p style={{ color: "crimson" }}>Erro ao carregar conversas: {error.message}</p>;
  }

  if (!conversations || conversations.length === 0) {
    return (
      <p style={{ color: "#666" }}>
        Nenhuma conversa ainda. Assim que um cliente mandar mensagem pro
        número, ela aparece aqui.
      </p>
    );
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
      {conversations.map((c: any) => (
        <li key={c.id}>
          <Link
            href={`/inbox/${c.id}`}
            style={{
              display: "block",
              padding: "0.75rem",
              border: "1px solid #eee",
              borderRadius: 8,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <strong>{c.contact?.name || c.contact?.wa_id || "Contato"}</strong>
            <div style={{ fontSize: "0.8rem", color: "#666" }}>
              {c.contact?.wa_id}
              {c.last_message_at &&
                ` · ${new Date(c.last_message_at).toLocaleString("pt-BR")}`}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
