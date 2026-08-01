import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hackathonId = searchParams.get("hackathonId");
  const userId = searchParams.get("userId");

  const params = [];
  if (hackathonId) params.push(`hackathonId=${hackathonId}`);
  if (userId) params.push(`userId=${userId}`);

  let path = "/api/registrations";
  if (params.length > 0) {
    path += `?${params.join("&")}`;
  }

  return proxyRequest(request, path, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyRequest(request, "/api/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
