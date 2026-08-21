import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  return proxyRequest(request, `/api/hall-of-fame/admin/events/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
