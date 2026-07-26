"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteRuleButton({ ruleId }: { ruleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/automations?id=${ruleId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={loading} style={{ padding: "0.25rem 0.5rem" }}>
      {loading ? "..." : "Remover"}
    </button>
  );
}
