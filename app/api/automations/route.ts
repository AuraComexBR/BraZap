import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * CRUD simples de automation_rules. RLS ja garante que so membro do tenant
 * (ou superadmin) consegue criar/apagar -- essas rotas nao fazem checagem
 * extra de permissao, so repassam o insert/delete pro Supabase com a
 * sessao do agente.
 */
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { tenantId, keyword, replyBody } = await req.json();

  if (!tenantId || !keyword || !replyBody) {
    return NextResponse.json(
      { error: "tenantId, keyword e replyBody sao obrigatorios" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("automation_rules").insert({
    tenant_id: tenantId,
    keyword,
    reply_body: replyBody,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id obrigatorio" }, { status: 400 });
  }

  const { error } = await supabase.from("automation_rules").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
