import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePayout } from "@/lib/odds";
import { normalizeBetInput, validateBetInput } from "@/lib/bet-validation";
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
    const input = normalizeBetInput(body);
    const validationError = validateBetInput(input);

    if (validationError) {
      return withCors(NextResponse.json({ error: validationError }, { status: 400 }), origin);
    }

    const payout = calculatePayout(
      input.stakeAmount,
      input.oddsType,
      input.oddsValueA,
      input.oddsValueB
    );

    for (const name of [...input.sideAParticipants, ...input.sideBParticipants]) {
      await prisma.participant.upsert({
        where: { name },
        create: { name },
        update: {},
      });
    }

    if (input.creatorName) {
      await prisma.participant.upsert({
        where: { name: input.creatorName },
        create: { name: input.creatorName },
        update: {},
      });
    }

    const bet = await prisma.bet.create({
      data: {
        title: input.title,
        description: input.description,
        eventDate: input.eventDate,
        resolutionDate: input.resolutionDate,
        creatorName: input.creatorName,
        stakeAmount: input.stakeAmount,
        oddsType: input.oddsType,
        payoutLogic: input.payoutLogic,
        oddsValueA: input.oddsValueA,
        oddsValueB: input.oddsValueB,
        sideALabel: input.sideALabel,
        sideBLabel: input.sideBLabel,
        notes: input.notes,
        status: input.status === "RESOLVED" ? "OPEN" : input.status,
        participants: {
          create: [
            ...input.sideAParticipants.map((name) => ({
              participantName: name,
              side: "A",
              amountRisked: payout.sideAAmountRisked,
              potentialPayout: payout.sideAPayoutTotal,
            })),
            ...input.sideBParticipants.map((name) => ({
              participantName: name,
              side: "B",
              amountRisked: payout.sideBAmountRisked,
              potentialPayout: payout.sideBPayoutTotal,
            })),
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
