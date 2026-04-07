import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ParticipantStats } from "@/lib/types";

export async function GET() {
  try {
    // Fetch all resolved bets with transfers
    const resolvedBets = await prisma.bet.findMany({
      where: { status: "RESOLVED" },
      include: {
        participants: true,
        resolution: { include: { moneyTransfers: true } },
      },
    });

    // Fetch all open bets for exposure
    const openBets = await prisma.bet.findMany({
      where: { status: "OPEN" },
      include: { participants: true },
    });

    // Fetch all participants
    const allParticipants = await prisma.participant.findMany({ orderBy: { name: "asc" } });

    const statsMap: Record<string, ParticipantStats> = {};

    for (const p of allParticipants) {
      statsMap[p.name] = {
        name: p.name,
        totalBets: 0,
        betsWon: 0,
        betsLost: 0,
        winPct: 0,
        totalWon: 0,
        totalLost: 0,
        netProfitLoss: 0,
        biggestWin: 0,
        biggestLoss: 0,
        openExposure: 0,
      };
    }

    // Process resolved bets
    for (const bet of resolvedBets) {
      if (!bet.resolution) continue;
      const { winningSide, moneyTransfers } = bet.resolution;

      for (const p of bet.participants) {
        const name = p.participantName;
        if (!statsMap[name]) {
          statsMap[name] = {
            name,
            totalBets: 0,
            betsWon: 0,
            betsLost: 0,
            winPct: 0,
            totalWon: 0,
            totalLost: 0,
            netProfitLoss: 0,
            biggestWin: 0,
            biggestLoss: 0,
            openExposure: 0,
          };
        }

        const s = statsMap[name];
        s.totalBets += 1;

        const didWin = p.side === winningSide;
        if (didWin) {
          s.betsWon += 1;
        } else {
          s.betsLost += 1;
        }

        // Calculate net from money transfers
        const received = moneyTransfers
          .filter((t) => t.toName === name)
          .reduce((sum, t) => sum + t.amount, 0);
        const paid = moneyTransfers
          .filter((t) => t.fromName === name)
          .reduce((sum, t) => sum + t.amount, 0);

        const netThisBet = received - paid;

        if (netThisBet > 0) {
          s.totalWon += netThisBet;
          if (netThisBet > s.biggestWin) s.biggestWin = netThisBet;
        } else if (netThisBet < 0) {
          s.totalLost += Math.abs(netThisBet);
          if (Math.abs(netThisBet) > s.biggestLoss) s.biggestLoss = Math.abs(netThisBet);
        }

        s.netProfitLoss += netThisBet;
      }
    }

    // Open exposure
    for (const bet of openBets) {
      for (const p of bet.participants) {
        const name = p.participantName;
        if (!statsMap[name]) {
          statsMap[name] = {
            name,
            totalBets: 0,
            betsWon: 0,
            betsLost: 0,
            winPct: 0,
            totalWon: 0,
            totalLost: 0,
            netProfitLoss: 0,
            biggestWin: 0,
            biggestLoss: 0,
            openExposure: 0,
          };
        }
        statsMap[name].openExposure += p.amountRisked ?? bet.stakeAmount;
      }
    }

    // Compute win pct
    const stats = Object.values(statsMap).map((s) => ({
      ...s,
      winPct:
        s.totalBets > 0
          ? Math.round((s.betsWon / s.totalBets) * 100)
          : 0,
      totalWon: Math.round(s.totalWon * 100) / 100,
      totalLost: Math.round(s.totalLost * 100) / 100,
      netProfitLoss: Math.round(s.netProfitLoss * 100) / 100,
      biggestWin: Math.round(s.biggestWin * 100) / 100,
      biggestLoss: Math.round(s.biggestLoss * 100) / 100,
      openExposure: Math.round(s.openExposure * 100) / 100,
    }));

    // Sort by net profit desc
    stats.sort((a, b) => b.netProfitLoss - a.netProfitLoss);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
