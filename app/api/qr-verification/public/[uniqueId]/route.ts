import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  const { uniqueId } = await params;
  return proxyRequest(request, `/api/qr-verification/public/${uniqueId}`, {
    method: "GET",
  });
}
