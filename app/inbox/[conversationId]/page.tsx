import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import ConversationView from "./conversation-view";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, contact:contacts(name, wa_id)")
    .eq("id", conversationId)
    .single();

  if (!conversation) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, direction, body, status, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (
    <ConversationView
      conversationId={conversationId}
      contact={conversation.contact as any}
      initialMessages={messages ?? []}
    />
  );
}
