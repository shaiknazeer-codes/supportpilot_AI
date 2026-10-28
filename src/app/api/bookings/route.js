import { NextResponse } from "next/server";
import { getDatabase, isMongoDBConfigured } from "@/lib/db/mongodb";
import { COLLECTIONS, ensureIndexes, handleDatabaseError } from "@/lib/db/collections";
import { validateBookingInput, generateUniqueId } from "@/lib/db/validators";

const SAMPLE_BOOKINGS = [
  {
    bookingId: "BK-SAMPLE-201",
    customerName: "Sarah Connor",
    customerEmail: "sarah@cyberdyne.io",
    customerPhone: "+1 (555) 234-5678",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    durationMinutes: 45,
    topic: "Enterprise Operations Demo",
    notes: "Needs multi-channel human escalation workflow walkthrough.",
    status: "confirmed",
    isSample: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    bookingId: "BK-SAMPLE-202",
    customerName: "James Holden",
    customerEmail: "james@roci-logistics.com",
    customerPhone: "+1 (555) 876-5432",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    durationMinutes: 30,
    topic: "Technical Architecture Onboarding",
    notes: "MongoDB Atlas cluster integration questions.",
    status: "confirmed",
    isSample: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  {
    bookingId: "BK-SAMPLE-203",
    customerName: "Naomi Nagata",
    customerEmail: "naomi@belter-systems.org",
    customerPhone: "+1 (555) 345-6789",
    scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    durationMinutes: 30,
    topic: "Billing & Tier Upgrade",
    notes: "Successfully upgraded to Growth Tier.",
    status: "completed",
    isSample: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

/**
 * GET /api/bookings
 * Retrieves existing bookings with optional search and status filtering.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "25", 10), 1), 100);
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const skip = (page - 1) * limit;

  const status = searchParams.get("status");
  const customerEmail = searchParams.get("email");
  const search = searchParams.get("search");

  if (!isMongoDBConfigured()) {
    let filtered = [...SAMPLE_BOOKINGS];
    if (status && status !== "all") filtered = filtered.filter((b) => b.status === status);
    if (customerEmail) filtered = filtered.filter((b) => b.customerEmail === customerEmail.toLowerCase().trim());
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.bookingId.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.customerEmail.toLowerCase().includes(q) ||
          b.topic.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      dbActive: false,
      count: filtered.length,
      total: filtered.length,
      page,
      limit,
      bookings: filtered,
      message: "MongoDB not connected. Displaying labeled sample seed records.",
    });
  }

  try {
    const db = await getDatabase();
    await ensureIndexes(db);

    const query = {};
    if (status && status !== "all") query.status = status;
    if (customerEmail) query.customerEmail = customerEmail.toLowerCase().trim();

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { bookingId: { $regex: q, $options: "i" } },
        { customerName: { $regex: q, $options: "i" } },
        { customerEmail: { $regex: q, $options: "i" } },
        { topic: { $regex: q, $options: "i" } },
      ];
    }

    const [total, bookings] = await Promise.all([
      db.collection(COLLECTIONS.BOOKINGS).countDocuments(query),
      db
        .collection(COLLECTIONS.BOOKINGS)
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
        count: SAMPLE_BOOKINGS.length,
        total: SAMPLE_BOOKINGS.length,
        page: 1,
        limit,
        bookings: SAMPLE_BOOKINGS,
        message: "No live bookings found. Displaying labeled sample records.",
      });
    }

    const sanitized = bookings.map((b) => ({
      bookingId: b.bookingId,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      customerPhone: b.customerPhone,
      scheduledAt: b.scheduledAt,
      durationMinutes: b.durationMinutes,
      topic: b.topic,
      notes: b.notes,
      status: b.status,
      isSample: Boolean(b.isSample),
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      dbActive: true,
      count: sanitized.length,
      total,
      page,
      limit,
      bookings: sanitized,
    });
  } catch (error) {
    console.warn("[Bookings GET Fallback]:", error.message);
    return NextResponse.json({
      success: true,
      dbActive: false,
      count: SAMPLE_BOOKINGS.length,
      total: SAMPLE_BOOKINGS.length,
      page: 1,
      limit: 50,
      bookings: SAMPLE_BOOKINGS,
      message: "Database connection failed (" + error.message + "). Displaying sample operational records.",
    });
  }
}

/**
 * POST /api/bookings
 * Validates and creates a booking record in MongoDB.
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

    const validation = validateBookingInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: "VALIDATION_FAILED" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    await ensureIndexes(db);

    const now = new Date();
    const newBooking = {
      ...validation.data,
      bookingId: generateUniqueId("BK"),
      isSample: Boolean(body.isSample),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(COLLECTIONS.BOOKINGS).insertOne(newBooking);

    if (!result.acknowledged) {
      return NextResponse.json(
        {
          error: "Database failed to acknowledge booking persistence.",
          code: "WRITE_UNACKNOWLEDGED",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Booking scheduled and confirmed in database.",
        booking: {
          bookingId: newBooking.bookingId,
          customerName: newBooking.customerName,
          customerEmail: newBooking.customerEmail,
          customerPhone: newBooking.customerPhone,
          scheduledAt: newBooking.scheduledAt,
          durationMinutes: newBooking.durationMinutes,
          topic: newBooking.topic,
          status: newBooking.status,
          isSample: newBooking.isSample,
          createdAt: newBooking.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * PATCH /api/bookings
 * Updates booking status (confirmed, rescheduled, completed, cancelled) in MongoDB.
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

    const { bookingId, status, notes } = body || {};

    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json(
        { error: "A valid bookingId is required.", code: "MISSING_BOOKING_ID" },
        { status: 400 }
      );
    }

    const allowedStatuses = ["pending", "confirmed", "rescheduled", "completed", "cancelled"];
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
        message: `Booking ${bookingId} updated (demo preview).`,
        booking: { bookingId, status: status || "completed", notes: notes || "" },
      });
    }

    const db = await getDatabase();
    await ensureIndexes(db);

    const updateFields = { updatedAt: new Date() };
    if (status) updateFields.status = status.toLowerCase();
    if (notes !== undefined) updateFields.notes = notes;

    const result = await db.collection(COLLECTIONS.BOOKINGS).findOneAndUpdate(
      { bookingId: bookingId.trim() },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: `Booking '${bookingId}' not found in database.`, code: "BOOKING_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dbActive: true,
      message: `Booking ${bookingId} status updated in MongoDB.`,
      booking: result,
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
}
