import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import Sidebar from "./sidebar";
import SignOutButton from "./sign-out-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");

  return (
    <div style={{ fontFamily: "system-ui", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid #eee",
        }}
      >
        <Link href="/inbox" style={{ fontWeight: 600, textDecoration: "none", color: "inherit" }}>
          BraZap
        </Link>
        <SignOutButton />
      </header>
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar isAdmin={Boolean(isAdmin)} />
        <main style={{ padding: "1rem", flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
