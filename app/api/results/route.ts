import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors, optionsResponse } from "@/lib/cors";

function parseDateRange(from: string | null, to: string | null) {
  if (!from && !to) return null;

  return {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
  };
}

export async function OPTIONS(request: NextRequest) {
  return optionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const participant = searchParams.get("participant");
  const search = searchParams.get("search");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const dateRange = parseDateRange(from, to);

  try {
    const where = {
      ...(status ? { status: status as "OPEN" | "RESOLVED" | "CANCELLED" } : {}),
      ...(participant
        ? {
            participants: {
              some: {
                participantName: { equals: participant, mode: "insensitive" as const },
              },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { notes: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(dateRange
        ? status === "RESOLVED" || !status
          ? {
              resolution: {
                ...(status === "RESOLVED"
                  ? { is: { resolvedAt: dateRange } }
                  : { is: { resolvedAt: dateRange } }),
              },
            }
          : { createdAt: dateRange }
        : {}),
    };

    const bets = await prisma.bet.findMany({
      where,
      include: { participants: true, resolution: { include: { moneyTransfers: true } } },
      orderBy: [{ resolution: { resolvedAt: "desc" } }, { createdAt: "desc" }],
    });

    return withCors(NextResponse.json(bets), origin);
  } catch (error) {
    console.error("GET /api/results error:", error);
    return withCors(
      NextResponse.json({ error: "Failed to fetch results" }, { status: 500 }),
      origin
    );
  }
}
