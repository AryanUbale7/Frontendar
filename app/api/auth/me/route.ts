import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: NextRequest) {
  return proxyRequest(request, "/api/auth/me", { method: "GET" });
}
