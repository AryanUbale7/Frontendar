import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hackathonId = searchParams.get("hackathonId");
    const userId = searchParams.get("userId");

    const params = [];
    if (hackathonId) params.push(`hackathonId=${hackathonId}`);
    if (userId) params.push(`userId=${userId}`);

    let url = `${BACKEND_URL}/api/submissions`;
    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch submissions from backend." }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to connect to evaluation backend: " + error.message }, { status: 502 });
  }
}
