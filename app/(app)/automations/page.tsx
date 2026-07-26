import { getSupabaseServerClient } from "@/lib/supabase/server";
import NewRuleForm from "./new-rule-form";
import DeleteRuleButton from "./delete-rule-button";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const supabase = await getSupabaseServerClient();

  const { data: rules, error } = await supabase
    .from("automation_rules")
    .select("id, keyword, reply_body, is_active, created_at")
    .order("created_at", { ascending: false });

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name")
    .order("name");

  return (
    <div style={{ maxWidth: 640 }}>
      <h1>Automações</h1>
      <p style={{ color: "#666", fontSize: "0.85rem" }}>
        Resposta automática simples: se a mensagem recebida contiver a
        palavra-chave (sem diferenciar maiúsculas/minúsculas), o BraZap
        responde sozinho com o texto configurado. Só a primeira regra que
        bater é usada por mensagem.
      </p>

      {error && <p style={{ color: "crimson" }}>Erro: {error.message}</p>}

      {!rules || rules.length === 0 ? (
        <p style={{ color: "#666" }}>Nenhuma regra cadastrada ainda.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
          {rules.map((r) => (
            <li
              key={r.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 8,
                padding: "0.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                gap: "1rem",
              }}
            >
              <div>
                <div>
                  <strong>{r.keyword}</strong>{" "}
                  {!r.is_active && (
                    <span style={{ fontSize: "0.75rem", color: "#999" }}>
                      (inativa)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#444" }}>
                  {r.reply_body}
                </div>
              </div>
              <DeleteRuleButton ruleId={r.id} />
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ marginTop: "2rem" }}>Nova regra</h2>
      <NewRuleForm tenants={tenants ?? []} />
    </div>
  );
}
