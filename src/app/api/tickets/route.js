import { NextResponse } from "next/server";
import { getDatabase, isMongoDBConfigured } from "@/lib/db/mongodb";
import { COLLECTIONS, ensureIndexes, handleDatabaseError } from "@/lib/db/collections";
import { validateTicketInput, generateUniqueId } from "@/lib/db/validators";

/**
 * Sample fallback tickets when MongoDB is unconfigured or empty.
 * Explicitly flagged with isSample: true.
 */
const SAMPLE_TICKETS = [
  {
    ticketId: "TK-SAMPLE-101",
    subject: "ESCALATED: Payment failure on checkout for Enterprise tier",
    description: "Customer attempted checkout 3 times with corporate card. Card verified with bank, gateway returns 502 Bad Gateway. Escalated by SupportPilot AI.",
    customerEmail: "finance@enterprise-corp.com",
    customerName: "David Sterling",
    priority: "urgent",
    category: "billing",
    status: "escalated",
    source: "ai_agent",
    assignedTo: "Sarah Jenkins (Tier-2 Lead)",
    resolutionNotes: "ESCALATED: Urgent billing gateway failure. Escalated directly by SupportPilot AI.",
    isSample: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    ticketId: "TK-SAMPLE-102",
    subject: "Webhook delivery failure on appointment.created event",
    description: "Endpoint https://api.client.io/webhooks receiving timeout errors. Customer needs webhook payload verification.",
    customerEmail: "engineering@techflow.io",
    customerName: "Elena Rostova",
    priority: "high",
    category: "technical",
    status: "in_progress",
    source: "chat",
    assignedTo: "Alex Rivera",
    resolutionNotes: null,
    isSample: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    ticketId: "TK-SAMPLE-103",
    subject: "Feature request: Custom calendar buffer time settings",
    description: "Requesting a 15-minute buffer setting between appointments to prevent back-to-back scheduling.",
    customerEmail: "ops@healthcare-connect.org",
    customerName: "Dr. Marcus Vance",
    priority: "low",
    category: "feature_request",
    status: "open",
    source: "web",
    assignedTo: null,
    resolutionNotes: null,
    isSample: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    ticketId: "TK-SAMPLE-104",
    subject: "Account SSO configuration guidance needed",
    description: "Customer needs Okta SAML 2.0 metadata XML upload assistance for domain federation.",
    customerEmail: "it@globaltech.com",
    customerName: "Michael Chang",
    priority: "medium",
    category: "account",
    status: "resolved",
    source: "email",
    assignedTo: "Alex Rivera",
    resolutionNotes: "Provided SAML configuration guide and verified assertion consumer URL.",
    isSample: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
];

/**
 * GET /api/tickets
 * Retrieves support tickets with optional search, status/priority filtering, and pagination.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "25", 10), 1), 100);
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const skip = (page - 1) * limit;

  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const category = searchParams.get("category");
  const customerEmail = searchParams.get("email");
  const search = searchParams.get("search");

  // Fallback if MongoDB is not configured
  if (!isMongoDBConfigured()) {
    let filtered = [...SAMPLE_TICKETS];
    if (status && status !== "all") filtered = filtered.filter((t) => t.status === status);
    if (priority && priority !== "all") filtered = filtered.filter((t) => t.priority === priority);
    if (category && category !== "all") filtered = filtered.filter((t) => t.category === category);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.ticketId.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.customerEmail.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      dbActive: false,
      count: filtered.length,
      total: filtered.length,
      page,
      limit,
      tickets: filtered,
      message: "MongoDB not connected. Displaying labeled sample seed records.",
    });
  }

  try {
    const db = await getDatabase();
    await ensureIndexes(db);

    const query = {};
    if (status && status !== "all") query.status = status;
    if (priority && priority !== "all") query.priority = priority;
    if (category && category !== "all") query.category = category;
    if (customerEmail) query.customerEmail = customerEmail.toLowerCase().trim();

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { ticketId: { $regex: q, $options: "i" } },
        { subject: { $regex: q, $options: "i" } },
        { customerEmail: { $regex: q, $options: "i" } },
        { customerName: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const [total, tickets] = await Promise.all([
      db.collection(COLLECTIONS.TICKETS).countDocuments(query),
      db
        .collection(COLLECTIONS.TICKETS)
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    // If database is active but empty, return sample records clearly labeled
    if (total === 0 && !search && (!status || status === "all")) {
      return NextResponse.json({
        success: true,
        dbActive: true,
        count: SAMPLE_TICKETS.length,
        total: SAMPLE_TICKETS.length,
        page: 1,
        limit,
        tickets: SAMPLE_TICKETS,
        message: "No live tickets logged in database yet. Displaying labeled sample records.",
      });
    }

    const sanitized = tickets.map((t) => ({
      ticketId: t.ticketId,
      subject: t.subject,
      description: t.description,
      customerEmail: t.customerEmail,
      customerName: t.customerName,
      priority: t.priority,
      category: t.category,
      status: t.status,
      source: t.source,
      assignedTo: t.assignedTo || null,
      resolutionNotes: t.resolutionNotes || null,
      isSample: Boolean(t.isSample),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      dbActive: true,
      count: sanitized.length,
      total,
      page,
      limit,
      tickets: sanitized,
    });
  } catch (error) {
    console.warn("[Tickets GET Fallback]:", error.message);
    return NextResponse.json({
      success: true,
      dbActive: false,
      count: SAMPLE_TICKETS.length,
      total: SAMPLE_TICKETS.length,
      page: 1,
      limit: 50,
      tickets: SAMPLE_TICKETS,
      message: "Database connection failed (" + error.message + "). Displaying sample operational records.",
    });
  }
}

/**
 * POST /api/tickets
 * Creates a support ticket in MongoDB.
 */
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request payload.", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const validation = validateTicketInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: "VALIDATION_FAILED" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    await ensureIndexes(db);

    const now = new Date();
    const newTicket = {
      ...validation.data,
      ticketId: generateUniqueId("TK"),
      isSample: Boolean(body.isSample),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(COLLECTIONS.TICKETS).insertOne(newTicket);

    if (!result.acknowledged) {
      return NextResponse.json(
        {
          error: "Database failed to acknowledge ticket persistence.",
          code: "WRITE_UNACKNOWLEDGED",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Support ticket recorded and tracked in database.",
        ticket: {
          ticketId: newTicket.ticketId,
          subject: newTicket.subject,
          description: newTicket.description,
          customerEmail: newTicket.customerEmail,
          priority: newTicket.priority,
          category: newTicket.category,
          status: newTicket.status,
          source: newTicket.source,
          isSample: newTicket.isSample,
          createdAt: newTicket.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * PATCH /api/tickets
 * Updates ticket status, agent assignment, or resolution notes in MongoDB.
 */
export async function PATCH(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request payload.", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const { ticketId, status, assignedTo, resolutionNotes, priority } = body || {};

    if (!ticketId || typeof ticketId !== "string") {
      return NextResponse.json(
        { error: "A valid ticketId is required for ticket updates.", code: "MISSING_TICKET_ID" },
        { status: 400 }
      );
    }

    const allowedStatuses = ["open", "in_progress", "escalated", "resolved", "closed"];
    if (status && !allowedStatuses.includes(status.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Invalid status '${status}'. Must be one of: ${allowedStatuses.join(", ")}.`,
          code: "INVALID_STATUS",
        },
        { status: 400 }
      );
    }

    const allowedPriorities = ["low", "medium", "high", "urgent"];
    if (priority && !allowedPriorities.includes(priority.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Invalid priority '${priority}'. Must be one of: ${allowedPriorities.join(", ")}.`,
          code: "INVALID_PRIORITY",
        },
        { status: 400 }
      );
    }

    if (!isMongoDBConfigured()) {
      // In unconfigured demo mode, return simulated update confirmation
      return NextResponse.json({
        success: true,
        dbActive: false,
        message: `Status for ticket ${ticketId} updated (demo preview). Add MONGODB_URI to persist to Atlas.`,
        ticket: {
          ticketId,
          status: status || "in_progress",
          assignedTo: assignedTo !== undefined ? assignedTo : "Alex Rivera",
          resolutionNotes: resolutionNotes || null,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const db = await getDatabase();
    await ensureIndexes(db);

    const updateFields = {
      updatedAt: new Date(),
    };

    if (status) updateFields.status = status.toLowerCase();
    if (priority) updateFields.priority = priority.toLowerCase();
    if (assignedTo !== undefined) updateFields.assignedTo = assignedTo ? assignedTo.trim() : null;
    if (resolutionNotes !== undefined) updateFields.resolutionNotes = resolutionNotes ? resolutionNotes.trim() : null;

    const result = await db.collection(COLLECTIONS.TICKETS).findOneAndUpdate(
      { ticketId: ticketId.trim() },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: `Ticket '${ticketId}' was not found in the database.`, code: "TICKET_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dbActive: true,
      message: `Ticket ${ticketId} successfully updated in MongoDB.`,
      ticket: {
        ticketId: result.ticketId,
        subject: result.subject,
        status: result.status,
        priority: result.priority,
        assignedTo: result.assignedTo,
        resolutionNotes: result.resolutionNotes,
        updatedAt: result.updatedAt,
      },
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
}
