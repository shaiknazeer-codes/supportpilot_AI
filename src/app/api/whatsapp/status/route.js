import { NextResponse } from "next/server";
import { checkOpenWAHealth } from "@/lib/whatsapp/openwaClient";
import { isMongoDBConfigured, getDatabase } from "@/lib/db/mongodb";
import { COLLECTIONS } from "@/lib/db/collections";
import { getAIProvider, getAIModel } from "@/lib/ai/client";

/**
 * GET /api/whatsapp/status
 * Diagnostic and health-check route for the WhatsApp OpenWA integration.
 * Never exposes passwords or API keys.
 */
export async function GET() {
  const openwaHealth = await checkOpenWAHealth();
  const dbConfigured = isMongoDBConfigured();
  let dbConnected = false;
  let waTicketsCount = 0;
  let waConversationsCount = 0;
  let waMessagesCount = 0;

  if (dbConfigured) {
    try {
      const db = await getDatabase();
      dbConnected = true;
      const [tickets, convs, msgs] = await Promise.all([
        db.collection(COLLECTIONS.TICKETS).countDocuments({ channel: "whatsapp" }),
        db.collection(COLLECTIONS.CONVERSATIONS).countDocuments({ channel: "whatsapp" }),
        db.collection(COLLECTIONS.WHATSAPP_MESSAGES).countDocuments(),
      ]);
      waTicketsCount = tickets;
      waConversationsCount = convs;
      waMessagesCount = msgs;
    } catch {
      dbConnected = false;
    }
  }

  const aiProvider = getAIProvider();
  const aiModel = getAIModel();

  return NextResponse.json({
    channel: "whatsapp",
    status: openwaHealth.connected ? "healthy" : "disconnected",
    openwa: {
      configured: openwaHealth.configured,
      connected: openwaHealth.connected,
      baseUrl: openwaHealth.baseUrl,
      maskedApiKey: openwaHealth.maskedApiKey,
      message: openwaHealth.message,
    },
    database: {
      configured: dbConfigured,
      connected: dbConnected,
    },
    ai: {
      provider: aiProvider || "unconfigured",
      model: aiModel,
    },
    metrics: {
      whatsappTicketsLogged: waTicketsCount,
      activeConversations: waConversationsCount,
      processedMessages: waMessagesCount,
    },
    webhook: {
      endpoint: "/api/whatsapp/webhook",
      methods: ["POST", "GET"],
      authType: process.env.OPENWA_API_KEY ? "api_key / secret" : "open",
    },
    timestamp: new Date().toISOString(),
  });
}
