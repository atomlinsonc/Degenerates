import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePayout } from "@/lib/odds";
import { withCors, optionsResponse } from "@/lib/cors";

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

  try {
    const bets = await prisma.bet.findMany({
      where: {
        ...(status ? { status: status as "OPEN" | "RESOLVED" | "CANCELLED" } : {}),
        ...(participant
          ? { participants: { some: { participantName: { equals: participant, mode: "insensitive" } } } }
          : {}),
        ...(search
          ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }] }
          : {}),
        ...(from || to
          ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      include: { participants: true, resolution: { include: { moneyTransfers: true } } },
      orderBy: { createdAt: "desc" },
    });

    return withCors(NextResponse.json(bets), origin);
  } catch (error) {
    console.error("GET /api/bets error:", error);
    return withCors(NextResponse.json({ error: "Failed to fetch bets" }, { status: 500 }), origin);
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const body = await request.json();
    const { title, description, eventDate, resolutionDate, creatorName, stakeAmount, oddsType, oddsValueA, oddsValueB, sideALabel, sideBLabel, sideAParticipants, sideBParticipants, notes } = body;

    if (!title?.trim()) return withCors(NextResponse.json({ error: "Title is required" }, { status: 400 }), origin);
    if (!creatorName?.trim()) return withCors(NextResponse.json({ error: "Creator name is required" }, { status: 400 }), origin);
    if (!stakeAmount || stakeAmount <= 0) return withCors(NextResponse.json({ error: "Stake must be positive" }, { status: 400 }), origin);
    if (!sideAParticipants?.length || !sideBParticipants?.length) {
      return withCors(NextResponse.json({ error: "Each side needs at least one participant" }, { status: 400 }), origin);
    }

    const payout = calculatePayout(stakeAmount, oddsType ?? "EVEN", oddsValueA, oddsValueB);

    for (const name of [...sideAParticipants, ...sideBParticipants]) {
      if (name?.trim()) {
        await prisma.participant.upsert({ where: { name: name.trim() }, create: { name: name.trim() }, update: {} });
      }
    }

    const bet = await prisma.bet.create({
      data: {
        title: title.trim(),
        description: description?.trim() ?? "",
        eventDate: eventDate ? new Date(eventDate) : null,
        resolutionDate: resolutionDate ? new Date(resolutionDate) : null,
        creatorName: creatorName.trim(),
        stakeAmount: Number(stakeAmount),
        oddsType: oddsType ?? "EVEN",
        oddsValueA: oddsValueA != null ? Number(oddsValueA) : null,
        oddsValueB: oddsValueB != null ? Number(oddsValueB) : null,
        sideALabel: sideALabel?.trim() || "Side A",
        sideBLabel: sideBLabel?.trim() || "Side B",
        notes: notes?.trim() || null,
        participants: {
          create: [
            ...sideAParticipants.filter((n: string) => n?.trim()).map((n: string) => ({ participantName: n.trim(), side: "A", amountRisked: payout.sideAAmountRisked, potentialPayout: payout.sideAPayoutTotal })),
            ...sideBParticipants.filter((n: string) => n?.trim()).map((n: string) => ({ participantName: n.trim(), side: "B", amountRisked: payout.sideBAmountRisked, potentialPayout: payout.sideBPayoutTotal })),
          ],
        },
      },
      include: { participants: true, resolution: { include: { moneyTransfers: true } } },
    });

    return withCors(NextResponse.json(bet, { status: 201 }), origin);
  } catch (error) {
    console.error("POST /api/bets error:", error);
    return withCors(NextResponse.json({ error: "Failed to create bet" }, { status: 500 }), origin);
  }
}
