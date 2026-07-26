"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/inbox");
    router.refresh();
  }

  return (
    <main
      style={{
        fontFamily: "system-ui",
        maxWidth: 360,
        margin: "4rem auto",
        padding: "0 1rem",
      }}
    >
      <h1>BraZap</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </label>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: "0.5rem" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "1rem" }}>
        Contas de agente sao criadas manualmente pelo administrador no painel
        do Supabase por enquanto. Sem cadastro aberto.
      </p>
    </main>
  );
}
