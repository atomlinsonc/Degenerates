import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const participants = await prisma.participant.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(participants);
  } catch (error) {
    console.error("GET /api/participants error:", error);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }
}
