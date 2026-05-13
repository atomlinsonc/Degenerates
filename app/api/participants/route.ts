import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors, optionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return optionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const participants = await prisma.participant.findMany({ orderBy: { name: "asc" } });
    return withCors(NextResponse.json(participants), origin);
  } catch (error) {
    console.error("GET /api/participants error:", error);
    return withCors(NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 }), origin);
  }
}

/**
 * POST /api/participants
 *
 * Two modes (controlled by the body):
 *   - { name: "Alice" }                       → add one participant (idempotent upsert)
 *   - { replace: true, names: ["A","B",...] } → replace the entire roster.
 *     Requires the participants list to be unblocked (no bet involvement)
 *     since BetParticipant rows can hold a participantId FK. We null those
 *     FKs first so the wipe doesn't violate constraints. Open bets keep
 *     their participantName strings, so existing bet data isn't lost.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const body = await request.json();

    if (body && body.replace === true && Array.isArray(body.names)) {
      const names: string[] = body.names
        .map((n: unknown) => (typeof n === "string" ? n.trim() : ""))
        .filter((n: string) => n.length > 0);

      if (names.length === 0) {
        return withCors(
          NextResponse.json({ error: "names must contain at least one non-empty string" }, { status: 400 }),
          origin,
        );
      }

      // Detach BetParticipant rows from existing participants so the delete is safe.
      // The participantName column stays intact — only the FK link is cleared.
      await prisma.betParticipant.updateMany({
        where: { participantId: { not: null } },
        data: { participantId: null },
      });
      await prisma.participant.deleteMany();

      // De-dupe while preserving order
      const seen = new Set<string>();
      const unique = names.filter((n) => (seen.has(n) ? false : (seen.add(n), true)));

      await prisma.participant.createMany({
        data: unique.map((name) => ({ name })),
      });

      const created = await prisma.participant.findMany({ orderBy: { name: "asc" } });
      return withCors(NextResponse.json({ replaced: true, count: created.length, participants: created }), origin);
    }

    if (body && typeof body.name === "string" && body.name.trim().length > 0) {
      const name = body.name.trim();
      const participant = await prisma.participant.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      return withCors(NextResponse.json(participant, { status: 201 }), origin);
    }

    return withCors(
      NextResponse.json(
        { error: "Body must be either { name: string } or { replace: true, names: string[] }" },
        { status: 400 },
      ),
      origin,
    );
  } catch (error) {
    console.error("POST /api/participants error:", error);
    return withCors(NextResponse.json({ error: "Failed to update participants" }, { status: 500 }), origin);
  }
}
