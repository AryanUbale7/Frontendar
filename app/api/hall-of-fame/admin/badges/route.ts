import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: NextRequest) {
  return proxyRequest(request, "/api/hall-of-fame/admin/badges", { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyRequest(request, "/api/hall-of-fame/admin/badges", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
