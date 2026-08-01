import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hackathonId = searchParams.get("hackathonId");
  const userId = searchParams.get("userId");

  const params = [];
  if (hackathonId) params.push(`hackathonId=${hackathonId}`);
  if (userId) params.push(`userId=${userId}`);

  let path = "/api/submissions";
  if (params.length > 0) {
    path += `?${params.join("&")}`;
  }

  return proxyRequest(request, path, { method: "GET" });
}
