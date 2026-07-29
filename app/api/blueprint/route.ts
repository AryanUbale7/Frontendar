import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:4000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hackathonId = searchParams.get("hackathonId");

  if (!hackathonId) {
    return NextResponse.json({ error: "Missing hackathonId parameter." }, { status: 400 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/blueprints/${hackathonId}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Blueprint not found on backend." }, { status: 404 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to connect to evaluation backend: " + error.message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/blueprints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to connect to evaluation backend: " + error.message }, { status: 502 });
  }
}
