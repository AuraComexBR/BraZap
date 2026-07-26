import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getTenantByPhoneNumberId } from "@/lib/tenant";
import { persistInboundMessage } from "@/lib/messages";
import { maybeSendAutomatedReply } from "@/lib/automations";

/**
 * GET: handshake de verificacao do webhook, exigido pela Meta na hora de
 * cadastrar a URL no painel do App. A Meta manda hub.mode, hub.verify_token
 * e hub.challenge; se o verify_token bater com o nosso, devolvemos o
 * challenge de volta em texto puro.
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * POST: eventos de mensagem/status enviados pela Meta.
 *
 * Pontos importantes:
 * - Responde rapido (200) para a Meta nao ficar reenviando o evento.
 *   O processamento aqui e minimo por enquanto (insercao simples); se
 *   crescer, mover para fila em vez de fazer tudo sincrono na request.
 * - Valida a assinatura X-Hub-Signature-256 usando o META_APP_SECRET
 *   antes de confiar no payload.
 * - Roteia pelo phone_number_id do payload para achar o tenant certo
 *   (multi-tenant: varios clientes do BraZap batem nesse mesmo endpoint).
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!isValidSignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const value = payload?.entry?.[0]?.changes?.[0]?.value;
  const phoneNumberId = value?.metadata?.phone_number_id;

  if (phoneNumberId) {
    const tenant = await getTenantByPhoneNumberId(phoneNumberId);

    if (!tenant) {
      console.warn(
        `Webhook recebido para phone_number_id desconhecido: ${phoneNumberId}`
      );
    } else {
      const inboundMessages = value?.messages ?? [];

      for (const m of inboundMessages) {
        // Por enquanto so tratamos mensagens de texto. Outros tipos
        // (imagem, audio, botao, etc.) ficam para uma fase seguinte.
        if (m.type !== "text") continue;

        try {
          const body = m.text?.body ?? "";
          const { conversationId } = await persistInboundMessage(
            tenant.tenantId,
            {
              waId: m.from,
              contactName: value?.contacts?.[0]?.profile?.name,
              waMessageId: m.id,
              body,
            }
          );

          await maybeSendAutomatedReply(
            tenant.tenantId,
            conversationId,
            m.from,
            body
          );
        } catch (err) {
          console.error("Falha ao persistir mensagem recebida:", err);
        }
      }

      // TODO: tratar value?.statuses (delivered/read/failed de mensagens
      // enviadas por nos) numa fase seguinte.
    }
  }

  return new NextResponse("OK", { status: 200 });
}

function isValidSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    // TEMPORARIO: enquanto o META_APP_SECRET nao foi gerado (bloqueado por
    // recuperacao de senha da conta Meta), permite testar o fluxo sem
    // validar assinatura -- SO se a flag abaixo for setada explicitamente.
    // Sem a flag, continua bloqueando por padrao (fail closed).
    // Remover esse bypass (e a env var ALLOW_UNSIGNED_WEBHOOK_TEMP) assim
    // que o App Secret real estiver configurado na Vercel.
    if (process.env.ALLOW_UNSIGNED_WEBHOOK_TEMP === "true") {
      console.warn(
        "AVISO: processando webhook SEM validar assinatura (ALLOW_UNSIGNED_WEBHOOK_TEMP=true). Isso e temporario, nao usar com dado de cliente real."
      );
      return true;
    }
    return process.env.NODE_ENV !== "production";
  }

  if (!signatureHeader) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader)
  );
}
