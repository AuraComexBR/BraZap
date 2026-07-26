"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTenantForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        wabaId,
        phoneNumberId,
        accessToken: accessToken || null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao criar tenant");
      return;
    }

    setName("");
    setWabaId("");
    setPhoneNumberId("");
    setAccessToken("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: 420 }}>
      <label>
        Nome do tenant
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: "0.5rem" }}
        />
      </label>
      <label>
        WABA ID
        <input
          required
          value={wabaId}
          onChange={(e) => setWabaId(e.target.value)}
          style={{ width: "100%", padding: "0.5rem" }}
        />
      </label>
      <label>
        Phone Number ID
        <input
          required
          value={phoneNumberId}
          onChange={(e) => setPhoneNumberId(e.target.value)}
          style={{ width: "100%", padding: "0.5rem" }}
        />
      </label>
      <label>
        Token de acesso (opcional, dá pra preencher depois)
        <input
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          style={{ width: "100%", padding: "0.5rem" }}
        />
      </label>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ padding: "0.5rem" }}>
        {loading ? "Criando..." : "Criar tenant"}
      </button>
      <p style={{ fontSize: "0.8rem", color: "#666" }}>
        Contas de agente para esse tenant ainda precisam ser criadas
        manualmente no Supabase (Auth → Users) e vinculadas na tabela
        `memberships`. Isso entra numa fase seguinte da área de admin.
      </p>
    </form>
  );
}
