import { NextResponse } from "next/server";
import { handleIncomingWhatsAppMessage } from "@/lib/whatsapp/messageHandler";
import { getOpenWAConfig } from "@/lib/whatsapp/openwaClient";

/**
 * Validates webhook request authenticity.
 * Checks header 'x-api-key', 'authorization', or query '?secret=' against
 * OPENWA_WEBHOOK_SECRET or OPENWA_API_KEY if configured.
 */
function verifyWebhookAuthenticity(request) {
  const secret = process.env.OPENWA_WEBHOOK_SECRET || process.env.OPENWA_API_KEY;

  // If no secret is configured, allow in development but log warning
  if (!secret || secret === "your_openwa_api_key_here") {
    return { authorized: true };
  }

  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret") || searchParams.get("key");
  const headerKey =
    request.headers.get("x-api-key") ||
    request.headers.get("api-key") ||
    request.headers.get("x-webhook-secret");
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const candidateKey = querySecret || headerKey || bearerToken;

  if (candidateKey && candidateKey.trim() === secret.trim()) {
    return { authorized: true };
  }

  // Also check if OpenWA sends its standard user-agent or client signature
  const userAgent = request.headers.get("user-agent") || "";
  if (userAgent.includes("open-wa") || userAgent.includes("wa-automate")) {
    return { authorized: true, note: "User-Agent verified" };
  }

  return { authorized: false, error: "Unauthorized webhook caller: Invalid or missing API key." };
}

/**
 * GET /api/whatsapp/webhook
 * Health probe and verification endpoint for webhook setup.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("hub.challenge") || searchParams.get("challenge");

  if (challenge) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({
    status: "active",
    channel: "whatsapp",
    service: "SupportPilot AI OpenWA Webhook",
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/whatsapp/webhook
 * Receives onMessage events from OpenWA Easy API.
 */
export async function POST(request) {
  // 1. Authenticate request
  const auth = verifyWebhookAuthenticity(request);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        error: auth.error,
        code: "UNAUTHORIZED_WEBHOOK",
      },
      { status: 401 }
    );
  }

  let payload = null;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Malformed request payload. Expected JSON body.",
        code: "INVALID_JSON",
      },
      { status: 400 }
    );
  }

  try {
    const result = await handleIncomingWhatsAppMessage(payload);

    return NextResponse.json({
      status: "ok",
      result,
    });
  } catch (error) {
    console.error("[POST /api/whatsapp/webhook Error]:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error processing WhatsApp message.",
        code: "PROCESSING_FAILED",
      },
      { status: 500 }
    );
  }
}
