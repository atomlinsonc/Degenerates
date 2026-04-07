import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MoneyFlowEdge } from "@/lib/types";

export async function GET() {
  try {
    const transfers = await prisma.moneyTransfer.findMany({
      include: { resolution: { include: { bet: true } } },
    });

    // Aggregate transfers between pairs
    const flowMap: Record<string, number> = {};

    for (const t of transfers) {
      const key = `${t.fromName}→${t.toName}`;
      flowMap[key] = (flowMap[key] ?? 0) + t.amount;
    }

    const edges: MoneyFlowEdge[] = Object.entries(flowMap).map(([key, amount]) => {
      const [from, to] = key.split("→");
      return { from, to, amount: Math.round(amount * 100) / 100 };
    });

    // Net the flows: if A→B = 50 and B→A = 30, show A→B = 20 net
    const netMap: Record<string, number> = {};

    for (const e of edges) {
      const fwd = `${e.from}→${e.to}`;
      const rev = `${e.to}→${e.from}`;

      if (netMap[rev] !== undefined) {
        netMap[rev] -= e.amount;
        if (netMap[rev] < 0) {
          // Flip direction
          netMap[fwd] = Math.abs(netMap[rev]);
          delete netMap[rev];
        } else if (netMap[rev] === 0) {
          delete netMap[rev];
        }
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

    // Get all nodes
    const nodeSet = new Set<string>();
    for (const e of netEdges) {
      nodeSet.add(e.from);
      nodeSet.add(e.to);
    }

    return NextResponse.json({ edges: netEdges, nodes: Array.from(nodeSet) });
  } catch (error) {
    console.error("GET /api/stats/money-flow error:", error);
    return NextResponse.json({ error: "Failed to fetch money flow" }, { status: 500 });
  }
}
