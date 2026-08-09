import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const path = searchParams ? `/api/qr-verification?${searchParams}` : "/api/qr-verification";
  return proxyRequest(request, path, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyRequest(request, "/api/qr-verification/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
