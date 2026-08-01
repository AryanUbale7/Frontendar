import { NextRequest, NextResponse } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing hackathon ID." }, { status: 400 });
  }

  return proxyRequest(request, `/api/hackathons/${id}/leaderboard`, { method: "GET" });
}
