import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getTenantByPhoneNumberId } from "@/lib/tenant";

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
 * - Responder rapido (200) para a Meta nao ficar reenviando o evento.
 *   Qualquer processamento pesado deve ser enfileirado, nao feito aqui.
 * - Validar a assinatura X-Hub-Signature-256 usando o META_APP_SECRET
 *   antes de confiar no payload.
 * - Rotear pelo phone_number_id do payload para achar o tenant certo
 *   (multi-tenant: varios clientes do BraZap batem nesse mesmo endpoint).
 *
 * TODO: persistir a mensagem em `messages` (ver supabase/schema.sql) e
 * disparar a atualizacao em tempo real via Supabase Realtime.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!isValidSignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  const phoneNumberId =
    payload?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

  if (phoneNumberId) {
    const tenant = await getTenantByPhoneNumberId(phoneNumberId);
    if (!tenant) {
      console.warn(
        `Webhook recebido para phone_number_id desconhecido: ${phoneNumberId}`
      );
    } else {
      // TODO: processar payload.entry[0].changes[0].value.messages / .statuses
      // e gravar em `messages` associado a tenant.tenantId.
      console.log(`Evento recebido para tenant ${tenant.tenantId}`);
    }
  }

  return new NextResponse("OK", { status: 200 });
}

function isValidSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const appSecret = process.env.META_APP_SECRET;

  // Em desenvolvimento, sem o secret configurado, nao bloqueia (facilita
  // testar localmente). Em producao isso deve estar sempre configurado.
  if (!appSecret) return process.env.NODE_ENV !== "production";

  if (!signatureHeader) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader)
  );
}
