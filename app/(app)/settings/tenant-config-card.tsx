"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TenantConfigCard({
  tenantId,
  tenantName,
  wabaId,
  phoneNumberId,
  hasToken,
  editable,
}: {
  tenantId: string;
  tenantName: string;
  wabaId: string;
  phoneNumberId: string;
  hasToken: boolean;
  editable: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [wabaIdValue, setWabaIdValue] = useState(wabaId);
  const [phoneNumberIdValue, setPhoneNumberIdValue] = useState(phoneNumberId);
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/admin/tenants/${tenantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wabaId: wabaIdValue,
        phoneNumberId: phoneNumberIdValue,
        // so manda accessToken se o campo foi preenchido -- deixa em
        // branco pra nao sobrescrever o token existente sem querer.
        ...(accessToken ? { accessToken } : {}),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao salvar");
      return;
    }

    setEditing(false);
    setAccessToken("");
    router.refresh();
  }

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{tenantName}</strong>
        {editable && !editing && (
          <button onClick={() => setEditing(true)} style={{ padding: "0.25rem 0.5rem" }}>
            Editar
          </button>
        )}
      </div>

      {!editing ? (
        <div style={{ fontSize: "0.85rem", color: "#444", marginTop: "0.5rem" }}>
          <div>WABA ID: {wabaId || "—"}</div>
          <div>Phone Number ID: {phoneNumberId || "—"}</div>
          <div>Token: {hasToken ? "configurado" : "não configurado"}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.5rem" }}>
          <label>
            WABA ID
            <input
              value={wabaIdValue}
              onChange={(e) => setWabaIdValue(e.target.value)}
              style={{ width: "100%", padding: "0.4rem" }}
            />
          </label>
          <label>
            Phone Number ID
            <input
              value={phoneNumberIdValue}
              onChange={(e) => setPhoneNumberIdValue(e.target.value)}
              style={{ width: "100%", padding: "0.4rem" }}
            />
          </label>
          <label>
            Novo token de acesso (deixe em branco pra manter o atual)
            <input
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              style={{ width: "100%", padding: "0.4rem" }}
            />
          </label>
          {error && <p style={{ color: "crimson" }}>{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={() => setEditing(false)} disabled={loading}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
