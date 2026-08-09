import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(request, `/api/qr-verification/${id}/revoke`, {
    method: "PUT",
  });
}
