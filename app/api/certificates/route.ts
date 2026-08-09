import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const path = searchParams ? `/api/certificates?${searchParams}` : "/api/certificates";
  return proxyRequest(request, path, { method: "GET" });
}
