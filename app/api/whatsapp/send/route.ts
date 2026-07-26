import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Envia uma mensagem de texto de saida para o contato de uma conversation.
 *
 * Usa o cliente com a sessao do agente (respeita RLS) tanto pra ler a
 * conversation/tenant/config quanto pra gravar a mensagem -- isso garante
 * que um agente so consegue enviar mensagem em nome do proprio tenant,
 * sem precisar reimplementar essa checagem aqui.
 *
 * TODO: aplicar rate limit / fila quando o volume justificar; por ora e
 * uma chamada sincrona direto pra Graph API.
 */
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { conversationId, body } = await req.json();

  if (!conversationId || !body) {
    return NextResponse.json(
      { error: "conversationId e body sao obrigatorios" },
      { status: 400 }
    );
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, tenant_id, contact:contacts(wa_id)")
    .eq("id", conversationId)
    .single();

  if (conversationError || !conversation) {
    // RLS faz essa consulta retornar vazio se o agente nao pertence ao
    // tenant da conversa -- tratamos como 404 pra nao vazar existencia.
    return NextResponse.json({ error: "Conversa nao encontrada" }, { status: 404 });
  }

  const { data: config, error: configError } = await supabase
    .from("tenant_whatsapp_config")
    .select("phone_number_id, access_token_encrypted")
    .eq("tenant_id", conversation.tenant_id)
    .single();

  if (configError || !config?.access_token_encrypted) {
    return NextResponse.json(
      {
        error:
          "Tenant sem token de acesso configurado ainda (ver tenant_whatsapp_config.access_token_encrypted).",
      },
      { status: 412 }
    );
  }

  const contactWaId = (conversation as any).contact?.wa_id;

  const metaResponse = await fetch(
    `https://graph.facebook.com/v21.0/${config.phone_number_id}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.access_token_encrypted}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: contactWaId,
        type: "text",
        text: { body },
      }),
    }
  );

  const metaData = await metaResponse.json();

  if (!metaResponse.ok) {
    console.error("Erro ao enviar via Graph API:", metaData);
    return NextResponse.json(
      { error: "Falha ao enviar mensagem", detail: metaData },
      { status: 502 }
    );
  }

  const waMessageId = metaData?.messages?.[0]?.id;

  const { error: insertError } = await supabase.from("messages").insert({
    tenant_id: conversation.tenant_id,
    conversation_id: conversation.id,
    direction: "out",
    wa_message_id: waMessageId,
    body,
    status: "sent",
  });

  if (insertError) {
    console.error("Mensagem enviada mas falhou ao gravar historico:", insertError);
  }

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversation.id);

  return NextResponse.json({ ok: true, waMessageId });
}
