import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePayout } from "@/lib/odds";
import { normalizeBetInput, validateBetInput } from "@/lib/bet-validation";
import { withCors, optionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return optionsResponse(request.headers.get("origin"));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get("origin");
  const { id } = await params;
  try {
    const bet = await prisma.bet.findUnique({
      where: { id },
      include: { participants: true, resolution: { include: { moneyTransfers: true } } },
    });

    if (!bet) return withCors(NextResponse.json({ error: "Bet not found" }, { status: 404 }), origin);
    return withCors(NextResponse.json(bet), origin);
  } catch (error) {
    console.error("GET /api/bets/[id] error:", error);
    return withCors(NextResponse.json({ error: "Failed to fetch bet" }, { status: 500 }), origin);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get("origin");
  const { id } = await params;
  try {
    const body = await request.json();
    const existing = await prisma.bet.findUnique({ where: { id } });
    if (!existing) return withCors(NextResponse.json({ error: "Bet not found" }, { status: 404 }), origin);

    const input = normalizeBetInput({ ...existing, ...body });
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

    for (const name of [...input.sideAParticipants, ...input.sideBParticipants, input.creatorName]) {
      await prisma.participant.upsert({
        where: { name },
        create: { name },
        update: {},
      });
    }

    await prisma.betParticipant.deleteMany({ where: { betId: id } });
    await prisma.betParticipant.createMany({
      data: [
        ...input.sideAParticipants.map((name) => ({
          betId: id,
          participantName: name,
          side: "A",
          amountRisked: payout.sideAAmountRisked,
          potentialPayout: payout.sideAPayoutTotal,
        })),
        ...input.sideBParticipants.map((name) => ({
          betId: id,
          participantName: name,
          side: "B",
          amountRisked: payout.sideBAmountRisked,
          potentialPayout: payout.sideBPayoutTotal,
        })),
      ],
    });

    const updated = await prisma.bet.update({
      where: { id },
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
        status: existing.status === "RESOLVED" ? "RESOLVED" : input.status,
      },
      include: { participants: true, resolution: { include: { moneyTransfers: true } } },
    });

    return withCors(NextResponse.json(updated), origin);
  } catch (error) {
    console.error("PUT /api/bets/[id] error:", error);
    return withCors(NextResponse.json({ error: "Failed to update bet" }, { status: 500 }), origin);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get("origin");
  const { id } = await params;
  try {
    await prisma.bet.delete({ where: { id } });
    return withCors(NextResponse.json({ success: true }), origin);
  } catch (error) {
    console.error("DELETE /api/bets/[id] error:", error);
    return withCors(NextResponse.json({ error: "Failed to delete bet" }, { status: 500 }), origin);
  }
}
