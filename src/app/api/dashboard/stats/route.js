import { NextResponse } from "next/server";
import { getDatabase, isMongoDBConfigured } from "@/lib/db/mongodb";
import { COLLECTIONS, ensureIndexes, handleDatabaseError } from "@/lib/db/collections";

/**
 * GET /api/dashboard/stats
 * Aggregates live operational totals, open/escalated ticket counts, and recent activity feed.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const bypass = searchParams.get("t");

  // Fallback demo metrics if MongoDB is unconfigured
  if (!isMongoDBConfigured()) {
    return NextResponse.json({
      connected: false,
      database: null,
      message: "MongoDB Atlas is not configured. Displaying labeled sample operational telemetry.",
      stats: {
        totalBookings: 3,
        openTickets: 3,
        escalatedTickets: 1,
        totalLeads: 3,
        resolvedTickets: 1,
        totalTickets: 4,
      },
      recentActivity: [
        {
          id: "act-1",
          type: "escalation",
          title: "Ticket Escalated to Human Support",
          subtitle: "TK-SAMPLE-101: Payment failure on checkout for Enterprise tier",
          timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          badge: "Urgent",
          badgeColor: "rose",
        },
        {
          id: "act-2",
          type: "booking",
          title: "New Appointment Scheduled",
          subtitle: "BK-SAMPLE-201: Sarah Connor — Enterprise Operations Demo",
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          badge: "Confirmed",
          badgeColor: "emerald",
        },
        {
          id: "act-3",
          type: "lead",
          title: "Inbound Prospect Captured",
          subtitle: "LD-SAMPLE-301: Rachel Rosen (Nexus AI Labs)",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          badge: "Qualified",
          badgeColor: "blue",
        },
      ],
    });
  }

  try {
    const db = await getDatabase();
    await ensureIndexes(db);

    const [
      totalBookings,
      totalTickets,
      resolvedTickets,
      openTickets,
      escalatedTickets,
      totalLeads,
      recentTickets,
      recentBookings,
      recentLeads,
    ] = await Promise.all([
      db.collection(COLLECTIONS.BOOKINGS).countDocuments(),
      db.collection(COLLECTIONS.TICKETS).countDocuments(),
      db.collection(COLLECTIONS.TICKETS).countDocuments({ status: "resolved" }),
      db.collection(COLLECTIONS.TICKETS).countDocuments({ status: { $in: ["open", "in_progress", "escalated"] } }),
      db.collection(COLLECTIONS.TICKETS).countDocuments({ status: "escalated" }),
      db.collection(COLLECTIONS.LEADS).countDocuments(),
      db
        .collection(COLLECTIONS.TICKETS)
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray(),
      db
        .collection(COLLECTIONS.BOOKINGS)
        .find()
        .sort({ createdAt: -1 })
        .limit(4)
        .toArray(),
      db
        .collection(COLLECTIONS.LEADS)
        .find()
        .sort({ createdAt: -1 })
        .limit(4)
        .toArray(),
    ]);

    // Build unified recent activity feed
    const activityItems = [];

    recentTickets.forEach((t) => {
      activityItems.push({
        id: `ticket-${t.ticketId}`,
        type: t.status === "escalated" ? "escalation" : "ticket",
        title: t.status === "escalated" ? "Ticket Escalated to Human Support" : "Support Ticket Logged",
        subtitle: `${t.ticketId}: ${t.subject}`,
        timestamp: t.createdAt,
        channel: t.channel || "website",
        badge: t.channel === "whatsapp" ? `WA · ${t.priority ? t.priority.toUpperCase() : "MEDIUM"}` : (t.priority ? t.priority.toUpperCase() : "MEDIUM"),
        badgeColor: t.status === "escalated" ? "rose" : t.priority === "urgent" ? "rose" : "amber",
      });
    });

    recentBookings.forEach((b) => {
      activityItems.push({
        id: `booking-${b.bookingId}`,
        type: "booking",
        title: "New Appointment Scheduled",
        subtitle: `${b.bookingId}: ${b.customerName} — ${b.topic}`,
        timestamp: b.createdAt,
        channel: b.channel || "website",
        badge: b.channel === "whatsapp" ? `WA · ${b.status.toUpperCase()}` : b.status.toUpperCase(),
        badgeColor: "emerald",
      });
    });

    recentLeads.forEach((l) => {
      activityItems.push({
        id: `lead-${l.leadId}`,
        type: "lead",
        title: "Inbound Prospect Captured",
        subtitle: `${l.leadId}: ${l.name} ${l.company ? `(${l.company})` : ""}`,
        timestamp: l.createdAt,
        channel: l.channel || "website",
        badge: l.channel === "whatsapp" ? `WA · ${l.status.toUpperCase()}` : l.status.toUpperCase(),
        badgeColor: "blue",
      });
    });

    // Sort combined activities by timestamp descending
    activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      connected: true,
      database: process.env.MONGODB_DB_NAME || "supportpilot",
      stats: {
        totalBookings,
        totalTickets,
        resolvedTickets,
        openTickets,
        escalatedTickets,
        totalLeads,
      },
      recentActivity: activityItems.slice(0, 10),
    });
  } catch (error) {
    console.warn("[Dashboard Stats Fallback]:", error.message);
    return NextResponse.json({
      connected: false,
      database: null,
      message: "MongoDB Atlas connection failed (" + error.message + "). Displaying sample operational telemetry.",
      stats: {
        totalBookings: 3,
        openTickets: 3,
        escalatedTickets: 1,
        totalLeads: 3,
        resolvedTickets: 1,
        totalTickets: 4,
      },
      recentActivity: [
        {
          id: "act-1",
          type: "escalation",
          title: "Ticket Escalated to Human Support",
          subtitle: "TK-SAMPLE-101: Payment failure on checkout for Enterprise tier",
          timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          badge: "Urgent",
          badgeColor: "rose",
        },
        {
          id: "act-2",
          type: "booking",
          title: "New Appointment Scheduled",
          subtitle: "BK-SAMPLE-201: Sarah Connor — Enterprise Operations Demo",
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          badge: "Confirmed",
          badgeColor: "emerald",
        },
        {
          id: "act-3",
          type: "lead",
          title: "Inbound Prospect Captured",
          subtitle: "LD-SAMPLE-301: Rachel Rosen (Nexus AI Labs)",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          badge: "Qualified",
          badgeColor: "blue",
        },
      ],
    });
  }
}
