import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "RESOLVED";
  const participant = searchParams.get("participant");
  const search = searchParams.get("search");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateRange =
    from || to
      ? {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
        }
      : undefined;

  const bets = await prisma.bet.findMany({
    where: {
      status: status as "OPEN" | "RESOLVED" | "CANCELLED",
      ...(participant
        ? {
            participants: {
              some: {
                participantName: { equals: participant, mode: "insensitive" as const },
              },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { notes: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(dateRange ? { resolution: { is: { resolvedAt: dateRange } } } : {}),
    },
    include: { participants: true, resolution: { include: { moneyTransfers: true } } },
    orderBy: [{ resolution: { resolvedAt: "desc" } }, { createdAt: "desc" }],
  });

  const header = [
    "title",
    "description",
    "status",
    "creator",
    "participants",
    "winning_side",
    "winners",
    "losers",
    "stake_amount",
    "odds_type",
    "odds_a",
    "odds_b",
    "resolved_at",
    "verified_by",
    "money_flow",
    "notes",
  ];

  const rows = bets.map((bet) => {
    const winners =
      bet.resolution?.winningSide === "A"
        ? bet.participants.filter((participant) => participant.side === "A")
        : bet.resolution?.winningSide === "B"
          ? bet.participants.filter((participant) => participant.side === "B")
          : [];
    const losers =
      bet.resolution?.winningSide === "A"
        ? bet.participants.filter((participant) => participant.side === "B")
        : bet.resolution?.winningSide === "B"
          ? bet.participants.filter((participant) => participant.side === "A")
          : [];

    return [
      bet.title,
      bet.description,
      bet.status,
      bet.creatorName,
      bet.participants.map((participant) => participant.participantName).join(" | "),
      bet.resolution?.winningSide ?? "",
      winners.map((participant) => participant.participantName).join(" | "),
      losers.map((participant) => participant.participantName).join(" | "),
      bet.stakeAmount.toFixed(2),
      bet.oddsType,
      bet.oddsValueA ?? "",
      bet.oddsValueB ?? "",
      bet.resolution?.resolvedAt.toISOString() ?? "",
      bet.resolution?.verifiedBy ?? "",
      bet.resolution?.moneyTransfers
        .map((transfer) => `${transfer.fromName}->${transfer.toName}:$${transfer.amount.toFixed(2)}`)
        .join(" | ") ?? "",
      [bet.notes, bet.resolution?.notes].filter(Boolean).join(" | "),
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map((value) => csvEscape(value)).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bet-results.csv"',
      "Cache-Control": "no-store",
    },
  });
}
