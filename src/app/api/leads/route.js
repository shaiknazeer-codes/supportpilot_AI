import { NextResponse } from "next/server";
import { getDatabase, isMongoDBConfigured } from "@/lib/db/mongodb";
import { COLLECTIONS, ensureIndexes, handleDatabaseError } from "@/lib/db/collections";
import { validateLeadInput, generateUniqueId } from "@/lib/db/validators";

const SAMPLE_LEADS = [
  {
    leadId: "LD-SAMPLE-301",
    name: "Rachel Rosen",
    email: "rachel@nexus-ai.com",
    phone: "+1 (555) 912-3456",
    company: "Nexus AI Labs",
    interest: "Enterprise Operations Agent",
    notes: "Evaluating SupportPilot to handle 10,000 monthly customer requests.",
    status: "qualified",
    source: "landing_page",
    isSample: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    leadId: "LD-SAMPLE-302",
    name: "Amos Burton",
    email: "amos@baltimore-repairs.com",
    phone: "+1 (555) 789-0123",
    company: "Baltimore Industrial",
    interest: "Automated Ticket Triage",
    notes: "Requested a demo consultation for support dispatch team.",
    status: "contacted",
    source: "ai_assistant",
    isSample: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    leadId: "LD-SAMPLE-303",
    name: "Clarissa Mao",
    email: "c.mao@mao-kwik.org",
    phone: "+1 (555) 456-7890",
    company: "Mao-Kwikowski Shipping",
    interest: "Multi-language AI Chatbot",
    notes: "Wants pricing quote for global support teams.",
    status: "new",
    source: "web_landing",
    isSample: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
];

/**
 * GET /api/leads
 * Retrieves captured leads with optional search and status filtering.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "25", 10), 1), 100);
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const skip = (page - 1) * limit;

  const status = searchParams.get("status");
  const search = searchParams.get("search");

  if (!isMongoDBConfigured()) {
    let filtered = [...SAMPLE_LEADS];
    if (status && status !== "all") filtered = filtered.filter((l) => l.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.leadId.toLowerCase().includes(q) ||
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.company && l.company.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      dbActive: false,
      count: filtered.length,
      total: filtered.length,
      page,
      limit,
      leads: filtered,
      message: "MongoDB not connected. Displaying labeled sample seed records.",
    });
  }

  try {
    const db = await getDatabase();
    await ensureIndexes(db);

    const query = {};
    if (status && status !== "all") query.status = status;

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { leadId: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
        { interest: { $regex: q, $options: "i" } },
      ];
    }

    const [total, leads] = await Promise.all([
      db.collection(COLLECTIONS.LEADS).countDocuments(query),
      db
        .collection(COLLECTIONS.LEADS)
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    if (total === 0 && !search && (!status || status === "all")) {
      return NextResponse.json({
        success: true,
        dbActive: true,
        count: SAMPLE_LEADS.length,
        total: SAMPLE_LEADS.length,
        page: 1,
        limit,
        leads: SAMPLE_LEADS,
        message: "No live leads found. Displaying labeled sample records.",
      });
    }

    const sanitized = leads.map((l) => ({
      leadId: l.leadId,
      name: l.name,
      email: l.email,
      phone: l.phone,
      company: l.company,
      interest: l.interest,
      notes: l.notes,
      status: l.status,
      source: l.source,
      isSample: Boolean(l.isSample),
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      dbActive: true,
      count: sanitized.length,
      total,
      page,
      limit,
      leads: sanitized,
    });
  } catch (error) {
    console.warn("[Leads GET Fallback]:", error.message);
    return NextResponse.json({
      success: true,
      dbActive: false,
      count: SAMPLE_LEADS.length,
      total: SAMPLE_LEADS.length,
      page: 1,
      limit: 50,
      leads: SAMPLE_LEADS,
      message: "Database connection failed (" + error.message + "). Displaying sample operational records.",
    });
  }
}

/**
 * POST /api/leads
 * Validates and captures a prospective customer lead in MongoDB.
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

    const validation = validateLeadInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: "VALIDATION_FAILED" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    await ensureIndexes(db);

    const now = new Date();
    const newLead = {
      ...validation.data,
      leadId: generateUniqueId("LD"),
      isSample: Boolean(body.isSample),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(COLLECTIONS.LEADS).insertOne(newLead);

    if (!result.acknowledged) {
      return NextResponse.json(
        {
          error: "Database failed to acknowledge lead persistence.",
          code: "WRITE_UNACKNOWLEDGED",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Customer lead captured and saved in database.",
        lead: {
          leadId: newLead.leadId,
          name: newLead.name,
          email: newLead.email,
          company: newLead.company,
          interest: newLead.interest,
          status: newLead.status,
          isSample: newLead.isSample,
          createdAt: newLead.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * PATCH /api/leads
 * Updates follow-up status (new, contacted, qualified, converted, closed) in MongoDB.
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

    const { leadId, status, notes } = body || {};

    if (!leadId || typeof leadId !== "string") {
      return NextResponse.json(
        { error: "A valid leadId is required.", code: "MISSING_LEAD_ID" },
        { status: 400 }
      );
    }

    const allowedStatuses = ["new", "contacted", "qualified", "converted", "closed"];
    if (status && !allowedStatuses.includes(status.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Invalid status '${status}'. Allowed: ${allowedStatuses.join(", ")}.`,
          code: "INVALID_STATUS",
        },
        { status: 400 }
      );
    }

    if (!isMongoDBConfigured()) {
      return NextResponse.json({
        success: true,
        dbActive: false,
        message: `Lead ${leadId} status updated (demo preview).`,
        lead: { leadId, status: status || "contacted", notes: notes || "" },
      });
    }

    const db = await getDatabase();
    await ensureIndexes(db);

    const updateFields = { updatedAt: new Date() };
    if (status) updateFields.status = status.toLowerCase();
    if (notes !== undefined) updateFields.notes = notes;

    const result = await db.collection(COLLECTIONS.LEADS).findOneAndUpdate(
      { leadId: leadId.trim() },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: `Lead '${leadId}' not found in database.`, code: "LEAD_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dbActive: true,
      message: `Lead ${leadId} status updated in MongoDB.`,
      lead: result,
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
}
