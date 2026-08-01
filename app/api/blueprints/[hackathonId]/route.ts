import { NextRequest, NextResponse } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ hackathonId: string }> }
) {
  const { hackathonId } = await context.params;

  if (!hackathonId) {
    return NextResponse.json({ error: "Missing hackathonId." }, { status: 400 });
  }

  return proxyRequest(request, `/api/blueprints/${hackathonId}`, { method: "GET" });
}
