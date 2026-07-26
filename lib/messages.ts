import { getSupabaseServiceClient } from "./supabase";

type InboundMessage = {
  waId: string; // numero do contato (from)
  contactName?: string;
  waMessageId: string;
  body: string;
  timestamp?: string;
};

/**
 * Grava uma mensagem recebida (inbound) do WhatsApp: garante que o contato
 * e a conversa existem (cria se necessario) e insere a mensagem no
 * historico. Usa o service client porque roda em contexto de servidor
 * (webhook), sem sessao de agente logado -- por isso filtra tudo
 * explicitamente por tenantId, ja que RLS nao se aplica aqui.
 */
export async function persistInboundMessage(
  tenantId: string,
  msg: InboundMessage
) {
  const supabase = getSupabaseServiceClient();

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .upsert(
      { tenant_id: tenantId, wa_id: msg.waId, name: msg.contactName ?? null },
      { onConflict: "tenant_id,wa_id", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (contactError || !contact) {
    throw new Error(`Falha ao gravar contato: ${contactError?.message}`);
  }

  let { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("contact_id", contact.id)
    .maybeSingle();

  if (!conversation) {
    const { data: newConversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({ tenant_id: tenantId, contact_id: contact.id })
      .select("id")
      .single();

    if (conversationError || !newConversation) {
      throw new Error(
        `Falha ao criar conversa: ${conversationError?.message}`
      );
    }
    conversation = newConversation;
  }

  const { error: messageError } = await supabase.from("messages").insert({
    tenant_id: tenantId,
    conversation_id: conversation.id,
    direction: "in",
    wa_message_id: msg.waMessageId,
    body: msg.body,
    status: "received",
  });

  if (messageError) {
    throw new Error(`Falha ao gravar mensagem: ${messageError.message}`);
  }

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversation.id);
}
