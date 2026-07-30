import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing hackathon ID." }, { status: 400 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/hackathons/${id}`, {
      method: "DELETE",
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: `Backend returned ${response.status}: ${text.slice(0, 100)}` };
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to connect to evaluation backend: " + error.message },
      { status: 502 }
    );
  }
}
