"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleSignOut} style={{ padding: "0.4rem 0.75rem" }}>
      Sair
    </button>
  );
}
