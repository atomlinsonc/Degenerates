import { OddsType } from "./types";

export interface NormalizedBetInput {
  title: string;
  description: string;
  eventDate: Date | null;
  resolutionDate: Date | null;
  creatorName: string;
  stakeAmount: number;
  oddsType: OddsType;
  oddsValueA: number | null;
  oddsValueB: number | null;
  payoutLogic: string;
  sideALabel: string;
  sideBLabel: string;
  sideAParticipants: string[];
  sideBParticipants: string[];
  notes: string | null;
  status: "OPEN" | "RESOLVED" | "CANCELLED";
}

export function normalizeParticipantNames(names: unknown): string[] {
  if (!Array.isArray(names)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of names) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export function normalizeBetInput(body: Record<string, unknown>): NormalizedBetInput {
  const stakeAmount = Number(body.stakeAmount);
  const oddsType = (body.oddsType as OddsType) ?? "EVEN";

  return {
    title: String(body.title ?? "").trim(),
    description: String(body.description ?? "").trim(),
    eventDate: body.eventDate ? new Date(String(body.eventDate)) : null,
    resolutionDate: body.resolutionDate ? new Date(String(body.resolutionDate)) : null,
    creatorName: String(body.creatorName ?? "").trim(),
    stakeAmount,
    oddsType,
    oddsValueA: body.oddsValueA == null || body.oddsValueA === "" ? null : Number(body.oddsValueA),
    oddsValueB: body.oddsValueB == null || body.oddsValueB === "" ? null : Number(body.oddsValueB),
    payoutLogic: "LOSERS_PAY_WINNERS",
    sideALabel: String(body.sideALabel ?? "").trim() || "Side A",
    sideBLabel: String(body.sideBLabel ?? "").trim() || "Side B",
    sideAParticipants: normalizeParticipantNames(body.sideAParticipants),
    sideBParticipants: normalizeParticipantNames(body.sideBParticipants),
    notes: String(body.notes ?? "").trim() || null,
    status:
      body.status === "CANCELLED" || body.status === "RESOLVED" || body.status === "OPEN"
        ? body.status
        : "OPEN",
  };
}

export function validateBetInput(input: NormalizedBetInput): string | null {
  if (!input.title) return "Title is required";
  if (!input.creatorName) return "Creator name is required";
  if (!Number.isFinite(input.stakeAmount) || input.stakeAmount <= 0) {
    return "Stake must be a positive number";
  }
  if (input.sideAParticipants.length === 0 || input.sideBParticipants.length === 0) {
    return "Each side needs at least one participant";
  }

  const sideASet = new Set(input.sideAParticipants.map((name) => name.toLowerCase()));
  for (const name of input.sideBParticipants) {
    if (sideASet.has(name.toLowerCase())) {
      return "A participant cannot be on both sides of the same bet";
    }
  }

  if (input.oddsType === "AMERICAN") {
    if (input.oddsValueA == null || input.oddsValueB == null) {
      return "American odds require values for both sides";
    }
    if (input.oddsValueA === 0 || input.oddsValueB === 0) {
      return "American odds cannot be 0";
    }
  }

  if (input.oddsType === "DECIMAL") {
    if (input.oddsValueA == null || input.oddsValueB == null) {
      return "Decimal odds require values for both sides";
    }
    if (input.oddsValueA <= 1 || input.oddsValueB <= 1) {
      return "Decimal odds must be greater than 1.00";
    }
  }

  if (input.eventDate && Number.isNaN(input.eventDate.getTime())) return "Event date is invalid";
  if (input.resolutionDate && Number.isNaN(input.resolutionDate.getTime())) {
    return "Expected resolution date is invalid";
  }

  return null;
}
