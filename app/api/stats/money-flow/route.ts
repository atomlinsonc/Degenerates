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
    const transfers = await prisma.moneyTransfer.findMany();

    const flowMap: Record<string, number> = {};
    for (const transfer of transfers) {
      const key = `${transfer.fromName}|||${transfer.toName}`;
      flowMap[key] = (flowMap[key] ?? 0) + transfer.amount;
    }

    const edges: MoneyFlowEdge[] = Object.entries(flowMap).map(([key, amount]) => {
      const [from, to] = key.split("|||");
      return { from, to, amount: Math.round(amount * 100) / 100 };
    });

    const netMap: Record<string, number> = {};
    for (const edge of edges) {
      const forwardKey = `${edge.from}|||${edge.to}`;
      const reverseKey = `${edge.to}|||${edge.from}`;

      if (netMap[reverseKey] !== undefined) {
        netMap[reverseKey] -= edge.amount;

        if (netMap[reverseKey] < 0) {
          netMap[forwardKey] = Math.abs(netMap[reverseKey]);
          delete netMap[reverseKey];
        } else if (netMap[reverseKey] === 0) {
          delete netMap[reverseKey];
        }
      } else {
        netMap[forwardKey] = (netMap[forwardKey] ?? 0) + edge.amount;
      }
    }

    const netEdges: MoneyFlowEdge[] = Object.entries(netMap)
      .filter(([, amount]) => amount > 0)
      .map(([key, amount]) => {
        const [from, to] = key.split("|||");
        return { from, to, amount: Math.round(amount * 100) / 100 };
      });

    const nodeSet = new Set<string>();
    for (const edge of netEdges) {
      nodeSet.add(edge.from);
      nodeSet.add(edge.to);
    }

    return withCors(
      NextResponse.json({ edges: netEdges, nodes: Array.from(nodeSet).sort() }),
      origin
    );
  } catch (error) {
    console.error("GET /api/stats/money-flow error:", error);
    return withCors(
      NextResponse.json({ error: "Failed to fetch money flow" }, { status: 500 }),
      origin
    );
  }
}
