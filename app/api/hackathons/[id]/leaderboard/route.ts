import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing hackathon ID." }, { status: 400 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/hackathons/${id}/leaderboard`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch leaderboard from backend." }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to connect to evaluation backend: " + error.message }, { status: 502 });
  }
}
