import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

  return <>{children}</>;
}
