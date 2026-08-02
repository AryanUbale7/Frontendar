import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function POST(request: NextRequest) {
  return proxyRequest(request, "/api/auth/send-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}
