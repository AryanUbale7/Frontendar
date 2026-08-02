import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hackathonId = searchParams.get("hackathonId") || "";
  const problemStatementId = searchParams.get("problemStatementId") || "";
  const status = searchParams.get("status") || "";

  return proxyRequest(
    request,
    `/api/judging/submissions?hackathonId=${hackathonId}&problemStatementId=${problemStatementId}&status=${status}`,
    { method: "GET" }
  );
}
