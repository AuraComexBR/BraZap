"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  direction: "in" | "out";
  body: string | null;
  status: string | null;
  created_at: string;
};

export default function ConversationView({
  conversationId,
  contact,
  initialMessages,
}: {
  conversationId: string;
  contact: { name: string | null; wa_id: string } | null;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Escuta novas mensagens em tempo real (Supabase Realtime) pra essa
  // conversa -- cobre tanto o que o cliente manda (via webhook) quanto
  // confirmacoes do que a gente envia.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: { new: Message }) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as Message).id)) {
              return prev;
            }
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;

    setSending(true);
    setError(null);

    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, body: draft }),
    });

    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao enviar mensagem");
      return;
    }

    setDraft("");
    // A mensagem enviada tambem chega via Realtime (insert feito pela rota
    // de envio), entao nao precisamos adicionar manualmente aqui.
  }

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 640 }}>
      <div>
        <strong>{contact?.name || contact?.wa_id || "Contato"}</strong>
        <div style={{ fontSize: "0.8rem", color: "#666" }}>{contact?.wa_id}</div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.5rem",
          maxHeight: "60vh",
          overflowY: "auto",
          padding: "0.5rem",
          border: "1px solid #eee",
          borderRadius: 8,
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              justifySelf: m.direction === "out" ? "end" : "start",
              background: m.direction === "out" ? "#dcf8c6" : "#f1f1f1",
              padding: "0.5rem 0.75rem",
              borderRadius: 8,
              maxWidth: "80%",
            }}
          >
            <div>{m.body}</div>
            <div style={{ fontSize: "0.7rem", color: "#666" }}>
              {new Date(m.created_at).toLocaleString("pt-BR")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escreva uma mensagem..."
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <button type="submit" disabled={sending}>
          {sending ? "Enviando..." : "Enviar"}
        </button>
      </form>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}
