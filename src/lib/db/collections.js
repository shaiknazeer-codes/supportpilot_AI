import { NextResponse } from "next/server.js";

export const COLLECTIONS = {
  BOOKINGS: "bookings",
  TICKETS: "tickets",
  LEADS: "leads",
  CONVERSATIONS: "conversations",
  WHATSAPP_MESSAGES: "whatsapp_messages",
};

let indexesInitialized = false;

/**
 * Initializes required unique and compound indexes across MongoDB collections.
 * Runs once during server runtime to guarantee optimal query performance and uniqueness.
 */
export async function ensureIndexes(db) {
  if (indexesInitialized) return;

  try {
    const bookings = db.collection(COLLECTIONS.BOOKINGS);
    await Promise.all([
      bookings.createIndex({ bookingId: 1 }, { unique: true }),
      bookings.createIndex({ customerEmail: 1, scheduledAt: 1 }),
      bookings.createIndex({ status: 1 }),
      bookings.createIndex({ channel: 1 }),
      bookings.createIndex({ createdAt: -1 }),
    ]);

    const tickets = db.collection(COLLECTIONS.TICKETS);
    await Promise.all([
      tickets.createIndex({ ticketId: 1 }, { unique: true }),
      tickets.createIndex({ customerEmail: 1 }),
      tickets.createIndex({ customerPhone: 1 }),
      tickets.createIndex({ status: 1 }),
      tickets.createIndex({ priority: 1 }),
      tickets.createIndex({ channel: 1 }),
      tickets.createIndex({ createdAt: -1 }),
    ]);

    const leads = db.collection(COLLECTIONS.LEADS);
    await Promise.all([
      leads.createIndex({ leadId: 1 }, { unique: true }),
      leads.createIndex({ email: 1 }),
      leads.createIndex({ channel: 1 }),
      leads.createIndex({ status: 1 }),
      leads.createIndex({ createdAt: -1 }),
    ]);

    const conversations = db.collection(COLLECTIONS.CONVERSATIONS);
    await Promise.all([
      conversations.createIndex({ conversationId: 1 }, { unique: true }),
      conversations.createIndex({ channel: 1 }),
      conversations.createIndex({ customerId: 1 }),
      conversations.createIndex({ updatedAt: -1 }),
    ]);

    const waMessages = db.collection(COLLECTIONS.WHATSAPP_MESSAGES);
    await Promise.all([
      waMessages.createIndex({ messageId: 1 }, { unique: true }),
      waMessages.createIndex({ from: 1 }),
      waMessages.createIndex({ processedAt: -1 }),
      // Optional TTL index to automatically purge processed deduplication records after 7 days
      waMessages.createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 }),
    ]);

    indexesInitialized = true;
  } catch (err) {
    console.error("[MongoDB Indexing Warning]: Could not ensure indexes:", err.message);
    // Do not crash the entire request if an index already exists or build is in progress
  }
}

/**
 * Maps raw database and server exceptions to clean, client-safe JSON responses.
 * Never leaks database connection strings, passwords, or internal stack traces.
 */
export function handleDatabaseError(error) {
  console.error("[Database Operation Error]:", error);

  // MongoDB Duplicate Key Error (E11000)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "identifier";
    return NextResponse.json(
      {
        error: `A record with this ${field} already exists in the system. Duplicate entries are rejected.`,
        code: "DUPLICATE_RECORD",
      },
      { status: 409 }
    );
  }

  // Unconfigured or Connection Failures
  if (error.code === "MONGODB_NOT_CONFIGURED" || error.code === "MONGODB_CONNECTION_FAILED") {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        hint: "Add your MongoDB Atlas connection string (MONGODB_URI) in .env.local to activate persistent operational storage.",
      },
      { status: 503 }
    );
  }

  // General Safe Fallback
  const status = error.status && error.status >= 400 && error.status <= 599 ? error.status : 500;
  return NextResponse.json(
    {
      error: status === 500 ? "An internal database error occurred while processing the request." : error.message,
      code: error.code || "DATABASE_ERROR",
    },
    { status: status }
  );
}
