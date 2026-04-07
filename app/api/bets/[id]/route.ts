import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePayout } from "@/lib/odds";
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
    const { title, description, eventDate, resolutionDate, creatorName, stakeAmount, oddsType, oddsValueA, oddsValueB, sideALabel, sideBLabel, sideAParticipants, sideBParticipants, notes, status } = body;

    const existing = await prisma.bet.findUnique({ where: { id } });
    if (!existing) return withCors(NextResponse.json({ error: "Bet not found" }, { status: 404 }), origin);

    const payout = calculatePayout(
      Number(stakeAmount ?? existing.stakeAmount),
      oddsType ?? existing.oddsType,
      oddsValueA ?? existing.oddsValueA,
      oddsValueB ?? existing.oddsValueB
    );

    if (sideAParticipants && sideBParticipants) {
      for (const name of [...sideAParticipants, ...sideBParticipants]) {
        if (name?.trim()) {
          await prisma.participant.upsert({ where: { name: name.trim() }, create: { name: name.trim() }, update: {} });
        }
      }
      await prisma.betParticipant.deleteMany({ where: { betId: id } });
      await prisma.betParticipant.createMany({
        data: [
          ...sideAParticipants.filter((n: string) => n?.trim()).map((n: string) => ({ betId: id, participantName: n.trim(), side: "A", amountRisked: payout.sideAAmountRisked, potentialPayout: payout.sideAPayoutTotal })),
          ...sideBParticipants.filter((n: string) => n?.trim()).map((n: string) => ({ betId: id, participantName: n.trim(), side: "B", amountRisked: payout.sideBAmountRisked, potentialPayout: payout.sideBPayoutTotal })),
        ],
      });
    }

    const updated = await prisma.bet.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(eventDate !== undefined ? { eventDate: eventDate ? new Date(eventDate) : null } : {}),
        ...(resolutionDate !== undefined ? { resolutionDate: resolutionDate ? new Date(resolutionDate) : null } : {}),
        ...(creatorName ? { creatorName: creatorName.trim() } : {}),
        ...(stakeAmount ? { stakeAmount: Number(stakeAmount) } : {}),
        ...(oddsType ? { oddsType } : {}),
        ...(oddsValueA !== undefined ? { oddsValueA: oddsValueA != null ? Number(oddsValueA) : null } : {}),
        ...(oddsValueB !== undefined ? { oddsValueB: oddsValueB != null ? Number(oddsValueB) : null } : {}),
        ...(sideALabel ? { sideALabel: sideALabel.trim() } : {}),
        ...(sideBLabel ? { sideBLabel: sideBLabel.trim() } : {}),
        ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
        ...(status ? { status } : {}),
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
