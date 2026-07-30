import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ hackathonId: string }> }
) {
  const { hackathonId } = await context.params;

  if (!hackathonId) {
    return NextResponse.json({ error: "Missing hackathonId." }, { status: 400 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/blueprints/${hackathonId}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "No blueprint configured for this hackathon yet." },
        { status: 404 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to connect to evaluation backend: " + error.message },
      { status: 502 }
    );
  }
}
