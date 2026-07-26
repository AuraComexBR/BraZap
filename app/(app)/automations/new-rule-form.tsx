"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRuleForm({
  tenants,
}: {
  tenants: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const [keyword, setKeyword] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, keyword, replyBody }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao criar regra");
      return;
    }

    setKeyword("");
    setReplyBody("");
    router.refresh();
  }

  if (tenants.length === 0) {
    return <p style={{ color: "#666" }}>Nenhum tenant disponível.</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: 420 }}>
      {tenants.length > 1 && (
        <label>
          Tenant
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Palavra-chave
        <input
          required
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="ex: horário"
          style={{ width: "100%", padding: "0.5rem" }}
        />
      </label>
      <label>
        Resposta automática
        <textarea
          required
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: "0.5rem" }}
        />
      </label>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ padding: "0.5rem" }}>
        {loading ? "Salvando..." : "Criar regra"}
      </button>
    </form>
  );
}
