import { processAgentMessage } from "../ai/agentCore.js";
import { sendWhatsAppText, simulateWhatsAppTyping } from "./openwaClient.js";
import { getDatabase, isMongoDBConfigured } from "../db/mongodb.js";
import { COLLECTIONS, ensureIndexes } from "../db/collections.js";

/**
 * In-memory sliding window cache for message deduplication.
 * Prevents processing retried webhooks within a 10-minute window.
 */
const recentMessageCache = new Map();
const DEDUPLICATION_WINDOW_MS = 10 * 60 * 1000;

function checkAndMarkDuplicateMemory(messageId) {
  if (!messageId) return false;
  const now = Date.now();

  // Clean stale cache entries
  for (const [id, timestamp] of recentMessageCache.entries()) {
    if (now - timestamp > DEDUPLICATION_WINDOW_MS) {
      recentMessageCache.delete(id);
    }
  }

  if (recentMessageCache.has(messageId)) {
    return true;
  }

  recentMessageCache.set(messageId, now);
  return false;
}

/**
 * Normalizes OpenWA webhook events.
 * OpenWA Easy API may deliver payloads wrapped in { event: "onMessage", data: {...} }
 * or directly as the message data object.
 */
export function normalizeWhatsAppEvent(payload) {
  if (!payload || typeof payload !== "object") return null;

  // Wrapped format: { event: "onMessage", data: { ... } }
  if (payload.event === "onMessage" && payload.data && typeof payload.data === "object") {
    return payload.data;
  }

  // Already unwrapped message object
  if (payload.id && (payload.from || payload.chatId)) {
    return payload;
  }

  // Check if payload contains data property
  if (payload.data && typeof payload.data === "object" && payload.data.id) {
    return payload.data;
  }

  return null;
}

/**
 * Formats agent tool outputs and final text into clean, mobile-friendly WhatsApp messages.
 */
function formatWhatsAppReply(agentResult) {
  const content = agentResult?.message?.content || "";
  const toolActions = agentResult?.toolActions || [];

  // Check if any tool action has additional structured output that benefits WhatsApp formatting
  const availabilityAction = toolActions.find((a) => a.toolName === "checkAvailability");
  if (availabilityAction) {
    const res = availabilityAction.result;
    if (res?.success && res?.dbActive && Array.isArray(res?.availableSlots) && res.availableSlots.length > 0) {
      const slotLines = res.availableSlots.map((slotIso) => {
        const time = new Date(slotIso).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        });
        return `• *${time} UTC*`;
      });

      return `${content}\n\n*Available Times (${res.date}):*\n${slotLines.join("\n")}\n\n_Reply with your preferred slot and your email to reserve your consultation._`;
    }
  }

  const bookingAction = toolActions.find((a) => a.toolName === "createBooking");
  if (bookingAction && bookingAction.result?.success) {
    const b = bookingAction.result;
    return `✅ *Appointment Confirmed!*\n\n*Booking ID:* ${b.bookingId}\n*Date & Time:* ${new Date(b.scheduledAt).toUTCString()}\n*Attendee:* ${b.customerName} (${b.customerEmail})\n\n${content}`;
  }

  const escalationAction = toolActions.find((a) => a.toolName === "escalateToHuman");
  if (escalationAction && escalationAction.result?.success) {
    const t = escalationAction.result;
    return `🚨 *Request Escalated to Human Support*\n\n*Ticket ID:* ${t.ticketId}\n*Priority:* Urgent\n*Queue:* Support Dashboard Triage Queue\n\n${content}`;
  }

  return content;
}

/**
 * Handles incoming WhatsApp messages from OpenWA Easy API webhook.
 * Enforces security, filters bot/group messages, deduplicates, retrieves context,
 * runs the SupportPilot AI agent, and replies via WhatsApp.
 */
export async function handleIncomingWhatsAppMessage(rawPayload, options = {}) {
  const msg = normalizeWhatsAppEvent(rawPayload);

  if (!msg) {
    return {
      status: "ignored",
      reason: "INVALID_OR_NON_MESSAGE_EVENT",
      message: "Payload does not contain recognized WhatsApp message fields.",
    };
  }

  const messageId = msg.id;
  const fromMe = Boolean(msg.fromMe);
  const isGroupMsg = Boolean(msg.isGroupMsg || (typeof msg.from === "string" && msg.from.endsWith("@g.us")));
  const senderId = msg.from || msg.chatId || "";
  const body = (msg.body || msg.text || msg.content || "").trim();
  const senderName = msg.sender?.pushname || msg.sender?.name || msg.notifyName || "WhatsApp Customer";

  // 1. Ignore messages sent by the bot itself
  if (fromMe) {
    return {
      status: "ignored",
      reason: "BOT_OWN_MESSAGE",
      message: "Ignored message sent by the bot itself.",
    };
  }

  // 2. Ignore group messages unless explicitly configured
  if (isGroupMsg && !process.env.ALLOW_WHATSAPP_GROUPS) {
    return {
      status: "ignored",
      reason: "GROUP_MESSAGE_IGNORED",
      message: "Group messages are ignored by default for privacy and security.",
    };
  }

  // 3. Ignore empty or unsupported media types (stickers, status broadcasts)
  if (!body && msg.type !== "chat") {
    return {
      status: "ignored",
      reason: "UNSUPPORTED_MEDIA_OR_EMPTY",
      message: `Message type '${msg.type}' with empty body ignored.`,
    };
  }

  // 4. Prevent duplicate message processing (Memory Sliding Window)
  if (checkAndMarkDuplicateMemory(messageId)) {
    console.warn(`[WhatsApp Handler]: Ignored duplicate message ${messageId} (memory cache hit).`);
    return {
      status: "ignored",
      reason: "DUPLICATE_MESSAGE",
      messageId,
    };
  }

  // 5. Database Deduplication & Persistence Check
  if (isMongoDBConfigured()) {
    try {
      const db = await getDatabase();
      await ensureIndexes(db);

      const existingRecord = await db.collection(COLLECTIONS.WHATSAPP_MESSAGES).findOne({ messageId });
      if (existingRecord) {
        console.warn(`[WhatsApp Handler]: Ignored duplicate message ${messageId} (database hit).`);
        return {
          status: "ignored",
          reason: "DUPLICATE_MESSAGE_DB",
          messageId,
        };
      }

      await db.collection(COLLECTIONS.WHATSAPP_MESSAGES).insertOne({
        messageId,
        from: senderId,
        senderName,
        bodyPreview: body.slice(0, 100),
        processedAt: new Date(),
        createdAt: new Date(),
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        console.warn(`[WhatsApp Handler]: Duplicate key on message ${messageId}. Ignoring.`);
        return {
          status: "ignored",
          reason: "DUPLICATE_MESSAGE_KEY",
          messageId,
        };
      }
      console.warn("[WhatsApp Handler]: Database deduplication check warning:", dbErr.message);
    }
  }

  console.log(`[WhatsApp Handler]: Processing message from ${senderId.slice(0, 5)}***: "${body.slice(0, 40)}"`);

  // 6. Simulate typing indicator on WhatsApp
  if (!options.skipTyping) {
    simulateWhatsAppTyping(senderId, true).catch(() => {});
  }

  // 7. Load recent conversation history from MongoDB (channel: "whatsapp")
  let conversationHistory = [];
  const conversationId = `wa_${senderId.replace(/[^a-zA-Z0-9_]/g, "_")}`;

  if (isMongoDBConfigured()) {
    try {
      const db = await getDatabase();
      const existingConv = await db.collection(COLLECTIONS.CONVERSATIONS).findOne({
        conversationId,
        channel: "whatsapp",
      });

      if (existingConv && Array.isArray(existingConv.messages)) {
        // Take last 8 turns (16 messages) for context
        conversationHistory = existingConv.messages.slice(-16).map((m) => ({
          role: m.role,
          content: m.content,
        }));
      }
    } catch (histErr) {
      console.warn("[WhatsApp Handler]: Could not load conversation history:", histErr.message);
    }
  }

  // Append incoming user message
  const messagesForAgent = [
    ...conversationHistory,
    { role: "user", content: body },
  ];

  // 8. Execute SupportPilot AI Agent
  let agentResult = null;
  try {
    agentResult = await processAgentMessage({
      messages: messagesForAgent,
      channel: "whatsapp",
      context: {
        channel: "whatsapp",
        customerPhone: senderId,
        customerName: senderName,
        customerEmail: `${senderId.replace(/[^0-9]/g, "")}@whatsapp.user`,
      },
    });
  } catch (agentErr) {
    console.error("[WhatsApp Handler]: Agent processing error:", agentErr);
    agentResult = {
      message: {
        role: "assistant",
        content: "I apologize, but our operations engine encountered a temporary error. Please try your request again shortly.",
        timestamp: new Date().toISOString(),
      },
      toolActions: [],
      model: "System Error Fallback",
    };
  }

  // Stop typing indicator
  if (!options.skipTyping) {
    simulateWhatsAppTyping(senderId, false).catch(() => {});
  }

  // 9. Format message for WhatsApp
  const formattedReply = formatWhatsAppReply(agentResult);

  // 10. Send reply via OpenWA Easy API
  let sendResult = null;
  if (!options.dryRun) {
    sendResult = await sendWhatsAppText(senderId, formattedReply);
  } else {
    sendResult = { success: true, dryRun: true };
  }

  // 11. Persist conversation turn to MongoDB (channel: "whatsapp")
  if (isMongoDBConfigured()) {
    try {
      const db = await getDatabase();
      await db.collection(COLLECTIONS.CONVERSATIONS).updateOne(
        { conversationId, channel: "whatsapp" },
        {
          $set: {
            channel: "whatsapp",
            customerId: senderId,
            customerName: senderName,
            customerPhone: senderId,
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          },
          $push: {
            messages: {
              $each: [
                {
                  role: "user",
                  content: body,
                  messageId,
                  timestamp: new Date().toISOString(),
                },
                {
                  role: "assistant",
                  content: formattedReply,
                  model: agentResult.model,
                  toolActions: agentResult.toolActions,
                  timestamp: new Date().toISOString(),
                },
              ],
              $slice: -30, // Retain last 30 messages in sliding window
            },
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (saveErr) {
      console.warn("[WhatsApp Handler]: Could not save conversation history:", saveErr.message);
    }
  }

  return {
    status: "processed",
    messageId,
    senderId,
    replyText: formattedReply,
    sendResult,
    toolActions: agentResult.toolActions,
    model: agentResult.model,
  };
}
