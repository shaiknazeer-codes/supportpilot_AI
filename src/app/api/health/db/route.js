import { NextResponse } from "next/server";
import { checkDatabaseHealth, resetDatabaseConnection } from "@/lib/db/mongodb";

/**
 * GET /api/health/db
 * Safe database health-check & diagnostic endpoint.
 * Confirms whether MongoDB Atlas is connected and lists collections without leaking credentials.
 */
export async function GET() {
  const health = await checkDatabaseHealth();

  return NextResponse.json(
    {
      status: health.connected ? "connected" : "disconnected",
      ...health,
      timestamp: new Date().toISOString(),
    },
    { status: health.connected ? 200 : 503 }
  );
}

/**
 * POST /api/health/db
 * Resets cached connection pools and performs a fresh live connection test.
 * Useful immediately after updating .env.local credentials or Atlas IP whitelists.
 */
export async function POST() {
  await resetDatabaseConnection();
  const health = await checkDatabaseHealth();

  return NextResponse.json(
    {
      status: health.connected ? "connected" : "disconnected",
      action: "connection_cache_cleared",
      ...health,
      timestamp: new Date().toISOString(),
    },
    { status: health.connected ? 200 : 503 }
  );
}
