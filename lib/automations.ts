import { getSupabaseServiceClient } from "./supabase";

/**
 * Verifica se alguma automation_rule do tenant bate com o texto recebido
 * (match simples: keyword contida no corpo, case-insensitive) e, se sim,
 * envia a resposta automatica via Graph API e grava como mensagem de
 * saida no historico.
 *
 * Roda a partir do webhook (contexto de servidor, sem sessao de agente),
 * por isso usa o service client -- filtra tudo por tenantId manualmente.
 *
 * Pega so a primeira regra ativa que bater, pra nao mandar varias
 * respostas de uma vez. Se o tenant nao tiver token configurado ainda,
 * so loga um aviso e nao quebra o resto do processamento do webhook.
 */
export async function maybeSendAutomatedReply(
  tenantId: string,
  conversationId: string,
  contactWaId: string,
  incomingBody: string
) {
  const supabase = getSupabaseServiceClient();

  const { data: rules } = await supabase
    .from("automation_rules")
    .select("id, keyword, reply_body")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const match = rules?.find((r) =>
    incomingBody.toLowerCase().includes(r.keyword.toLowerCase())
  );

  if (!match) return;

  const { data: config } = await supabase
    .from("tenant_whatsapp_config")
    .select("phone_number_id, access_token_encrypted")
    .eq("tenant_id", tenantId)
    .single();

  if (!config?.access_token_encrypted) {
    console.warn(
      `Automacao "${match.keyword}" bateu mas o tenant ${tenantId} nao tem token configurado ainda -- resposta nao enviada.`
    );
    return;
  }

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
        text: { body: match.reply_body },
      }),
    }
  );

  const metaData = await metaResponse.json();

  if (!metaResponse.ok) {
    console.error("Falha ao enviar resposta automatica:", metaData);
    return;
  }

  await supabase.from("messages").insert({
    tenant_id: tenantId,
    conversation_id: conversationId,
    direction: "out",
    wa_message_id: metaData?.messages?.[0]?.id,
    body: match.reply_body,
    status: "sent",
  });

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}
