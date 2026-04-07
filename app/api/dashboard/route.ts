import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors, optionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return optionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const [recentBets, openCount, resolvedCount, topEarners, totalVolume] = await Promise.all([
      prisma.bet.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { participants: true, resolution: { include: { moneyTransfers: true } } },
      }),
      prisma.bet.count({ where: { status: "OPEN" } }),
      prisma.bet.count({ where: { status: "RESOLVED" } }),
      prisma.moneyTransfer.groupBy({
        by: ["toName"],
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 1,
      }),
      prisma.bet.aggregate({
        _sum: { stakeAmount: true },
        where: { status: { in: ["OPEN", "RESOLVED"] } },
      }),
    ]);

    const topEarner = topEarners[0];
    return withCors(NextResponse.json({
      openCount,
      resolvedCount,
      totalVolume: totalVolume._sum.stakeAmount ?? 0,
      topEarner: topEarner?.toName ?? null,
      topEarnerAmount: topEarner?._sum.amount ?? 0,
      recentBets,
    }), origin);
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return withCors(NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 }), origin);
  }
}
