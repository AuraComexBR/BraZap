import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import SignOutButton from "../inbox/sign-out-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();

  const { data: isAdmin } = await supabase.rpc("is_platform_admin");

  if (!isAdmin) {
    // Nao e superadmin -- manda pro inbox normal em vez de dar erro feio.
    redirect("/inbox");
  }

  return (
    <div style={{ fontFamily: "system-ui" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid #eee",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/inbox" style={{ fontWeight: 600, textDecoration: "none" }}>
            BraZap
          </Link>
          <Link href="/admin" style={{ textDecoration: "none", color: "#666" }}>
            Admin
          </Link>
        </div>
        <SignOutButton />
      </header>
      <main style={{ padding: "1rem" }}>{children}</main>
    </div>
  );
}
