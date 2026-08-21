import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();
  return proxyRequest(request, `/api/hall-of-fame/admin/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxyRequest(request, `/api/hall-of-fame/admin/events/${id}`, {
    method: "DELETE",
  });
}
