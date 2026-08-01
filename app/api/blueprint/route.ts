import { NextRequest, NextResponse } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hackathonId = searchParams.get("hackathonId");
  const includeDraft = searchParams.get("includeDraft");

  if (!hackathonId) {
    return NextResponse.json({ error: "Missing hackathonId parameter." }, { status: 400 });
  }

  const query = includeDraft === "true" ? "?includeDraft=true" : "";
  return proxyRequest(request, `/api/blueprints/${hackathonId}${query}`, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyRequest(request, "/api/blueprints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
