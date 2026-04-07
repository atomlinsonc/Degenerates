import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePayout } from "@/lib/odds";

export async function GET(request: NextRequest) {
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
          ? {
              participants: {
                some: { participantName: { equals: participant, mode: "insensitive" } },
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: {
        participants: true,
        resolution: { include: { moneyTransfers: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bets);
  } catch (error) {
    console.error("GET /api/bets error:", error);
    return NextResponse.json({ error: "Failed to fetch bets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      eventDate,
      resolutionDate,
      creatorName,
      stakeAmount,
      oddsType,
      oddsValueA,
      oddsValueB,
      sideALabel,
      sideBLabel,
      sideAParticipants,
      sideBParticipants,
      notes,
    } = body;

    if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!creatorName?.trim()) return NextResponse.json({ error: "Creator name is required" }, { status: 400 });
    if (!stakeAmount || stakeAmount <= 0) return NextResponse.json({ error: "Stake must be positive" }, { status: 400 });
    if (!sideAParticipants?.length || !sideBParticipants?.length) {
      return NextResponse.json({ error: "Each side needs at least one participant" }, { status: 400 });
    }

    const payout = calculatePayout(stakeAmount, oddsType ?? "EVEN", oddsValueA, oddsValueB);

    // Upsert participants
    for (const name of [...sideAParticipants, ...sideBParticipants]) {
      if (name?.trim()) {
        await prisma.participant.upsert({
          where: { name: name.trim() },
          create: { name: name.trim() },
          update: {},
        });
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
            ...sideAParticipants
              .filter((n: string) => n?.trim())
              .map((n: string) => ({
                participantName: n.trim(),
                side: "A",
                amountRisked: payout.sideAAmountRisked,
                potentialPayout: payout.sideAPayoutTotal,
              })),
            ...sideBParticipants
              .filter((n: string) => n?.trim())
              .map((n: string) => ({
                participantName: n.trim(),
                side: "B",
                amountRisked: payout.sideBAmountRisked,
                potentialPayout: payout.sideBPayoutTotal,
              })),
          ],
        },
      },
      include: {
        participants: true,
        resolution: { include: { moneyTransfers: true } },
      },
    });

    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    console.error("POST /api/bets error:", error);
    return NextResponse.json({ error: "Failed to create bet" }, { status: 500 });
  }
}
