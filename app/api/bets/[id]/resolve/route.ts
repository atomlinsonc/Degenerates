import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePayout } from "@/lib/odds";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { winningSide, verifiedBy, notes, resolvedAt } = body;

    if (!winningSide || !["A", "B"].includes(winningSide)) {
      return NextResponse.json({ error: "winningSide must be A or B" }, { status: 400 });
    }

    const bet = await prisma.bet.findUnique({
      where: { id },
      include: { participants: true, resolution: true },
    });

    if (!bet) return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    if (bet.status === "RESOLVED") {
      return NextResponse.json({ error: "Bet is already resolved" }, { status: 400 });
    }

    const payout = calculatePayout(
      bet.stakeAmount,
      bet.oddsType as "EVEN" | "AMERICAN" | "DECIMAL",
      bet.oddsValueA,
      bet.oddsValueB
    );

    const sideAParticipants = bet.participants.filter((p) => p.side === "A");
    const sideBParticipants = bet.participants.filter((p) => p.side === "B");

    // Build money transfers: losers pay winners
    const transfers: { fromName: string; toName: string; amount: number }[] = [];

    if (winningSide === "A") {
      // Side B pays Side A
      for (const loser of sideBParticipants) {
        for (const winner of sideAParticipants) {
          transfers.push({
            fromName: loser.participantName,
            toName: winner.participantName,
            amount: payout.sideBTransferIfAWins / sideAParticipants.length,
          });
        }
      }
    } else {
      // Side A pays Side B
      for (const loser of sideAParticipants) {
        for (const winner of sideBParticipants) {
          transfers.push({
            fromName: loser.participantName,
            toName: winner.participantName,
            amount: payout.sideATransferIfBWins / sideBParticipants.length,
          });
        }
      }
    }

    const resolution = await prisma.resolution.create({
      data: {
        betId: id,
        resolvedAt: resolvedAt ? new Date(resolvedAt) : new Date(),
        winningSide,
        verifiedBy: verifiedBy?.trim() || null,
        notes: notes?.trim() || null,
        moneyTransfers: {
          create: transfers.map((t) => ({
            fromName: t.fromName,
            toName: t.toName,
            amount: Math.round(t.amount * 100) / 100,
          })),
        },
      },
      include: { moneyTransfers: true },
    });

    await prisma.bet.update({
      where: { id },
      data: { status: "RESOLVED" },
    });

    const updatedBet = await prisma.bet.findUnique({
      where: { id },
      include: {
        participants: true,
        resolution: { include: { moneyTransfers: true } },
      },
    });

    return NextResponse.json(updatedBet);
  } catch (error) {
    console.error("POST /api/bets/[id]/resolve error:", error);
    return NextResponse.json({ error: "Failed to resolve bet" }, { status: 500 });
  }
}
