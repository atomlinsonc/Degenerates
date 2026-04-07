import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors, optionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return optionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const participants = await prisma.participant.findMany({ orderBy: { name: "asc" } });
    return withCors(NextResponse.json(participants), origin);
  } catch (error) {
    console.error("GET /api/participants error:", error);
    return withCors(NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 }), origin);
  }
}
