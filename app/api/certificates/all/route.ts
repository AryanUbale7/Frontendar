import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, "/api/certificates/all", { method: "DELETE" });
}
