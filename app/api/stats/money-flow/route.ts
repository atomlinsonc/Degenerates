import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MoneyFlowEdge } from "@/lib/types";
import { withCors, optionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return optionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const transfers = await prisma.moneyTransfer.findMany({
      include: { resolution: { include: { bet: true } } },
    });

    const flowMap: Record<string, number> = {};
    for (const t of transfers) {
      const key = `${t.fromName}→${t.toName}`;
      flowMap[key] = (flowMap[key] ?? 0) + t.amount;
    }

    const edges: MoneyFlowEdge[] = Object.entries(flowMap).map(([key, amount]) => {
      const [from, to] = key.split("→");
      return { from, to, amount: Math.round(amount * 100) / 100 };
    });

    const netMap: Record<string, number> = {};
    for (const e of edges) {
      const fwd = `${e.from}→${e.to}`;
      const rev = `${e.to}→${e.from}`;
      if (netMap[rev] !== undefined) {
        netMap[rev] -= e.amount;
        if (netMap[rev] < 0) { netMap[fwd] = Math.abs(netMap[rev]); delete netMap[rev]; }
        else if (netMap[rev] === 0) { delete netMap[rev]; }
      } else {
        netMap[fwd] = (netMap[fwd] ?? 0) + e.amount;
      }
    }

    const netEdges: MoneyFlowEdge[] = Object.entries(netMap)
      .filter(([, amount]) => amount > 0)
      .map(([key, amount]) => {
        const [from, to] = key.split("→");
        return { from, to, amount: Math.round(amount * 100) / 100 };
      });

    const nodeSet = new Set<string>();
    for (const e of netEdges) { nodeSet.add(e.from); nodeSet.add(e.to); }

    return withCors(NextResponse.json({ edges: netEdges, nodes: Array.from(nodeSet) }), origin);
  } catch (error) {
    console.error("GET /api/stats/money-flow error:", error);
    return withCors(NextResponse.json({ error: "Failed to fetch money flow" }, { status: 500 }), origin);
  }
}
