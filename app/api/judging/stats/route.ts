import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hackathonId = searchParams.get("hackathonId") || "";
  const problemStatementId = searchParams.get("problemStatementId") || "";

  return proxyRequest(
    request,
    `/api/judging/stats?hackathonId=${hackathonId}&problemStatementId=${problemStatementId}`,
    { method: "GET" }
  );
}
