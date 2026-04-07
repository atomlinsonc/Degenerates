export type OddsType = "EVEN" | "AMERICAN" | "DECIMAL";

export interface PayoutResult {
  sideAAmountRisked: number;
  sideBAmountRisked: number;
  sideAWinsNet: number; // net gain for side A if they win
  sideBWinsNet: number; // net gain for side B if they win
  sideAPayoutTotal: number; // total returned to side A if they win (stake + profit)
  sideBPayoutTotal: number; // total returned to side B if they win (stake + profit)
  sideATransferIfBWins: number; // A pays B this amount if B wins
  sideBTransferIfAWins: number; // B pays A this amount if A wins
}

/**
 * Calculate payouts for a bet.
 *
 * stakeAmount: the "main" stake reference (typically Side A's wager)
 * oddsType: EVEN | AMERICAN | DECIMAL
 * oddsValueA: Side A's odds line (e.g. -110 for American)
 * oddsValueB: Side B's odds line (e.g. +130 for American)
 */
export function calculatePayout(
  stakeAmount: number,
  oddsType: OddsType,
  oddsValueA?: number | null,
  oddsValueB?: number | null
): PayoutResult {
  if (oddsType === "EVEN") {
    return {
      sideAAmountRisked: stakeAmount,
      sideBAmountRisked: stakeAmount,
      sideAWinsNet: stakeAmount,
      sideBWinsNet: stakeAmount,
      sideAPayoutTotal: stakeAmount * 2,
      sideBPayoutTotal: stakeAmount * 2,
      sideATransferIfBWins: stakeAmount,
      sideBTransferIfAWins: stakeAmount,
    };
  }

  if (oddsType === "AMERICAN") {
    const aOdds = oddsValueA ?? -110;
    const bOdds = oddsValueB ?? 110;

    // For American odds:
    // Negative odds (e.g. -110): risk $110 to win $100
    // Positive odds (e.g. +150): risk $100 to win $150

    let sideAAmountRisked: number;
    let sideAWinsNet: number;

    if (aOdds < 0) {
      // Favourite: stake IS the amount risked
      sideAAmountRisked = stakeAmount;
      sideAWinsNet = (stakeAmount * 100) / Math.abs(aOdds);
    } else {
      // Underdog
      sideAAmountRisked = stakeAmount;
      sideAWinsNet = (stakeAmount * aOdds) / 100;
    }

    let sideBAmountRisked: number;
    let sideBWinsNet: number;

    if (bOdds < 0) {
      sideBAmountRisked = stakeAmount;
      sideBWinsNet = (stakeAmount * 100) / Math.abs(bOdds);
    } else {
      sideBAmountRisked = stakeAmount;
      sideBWinsNet = (stakeAmount * bOdds) / 100;
    }

    return {
      sideAAmountRisked: round2(sideAAmountRisked),
      sideBAmountRisked: round2(sideBAmountRisked),
      sideAWinsNet: round2(sideAWinsNet),
      sideBWinsNet: round2(sideBWinsNet),
      sideAPayoutTotal: round2(sideAAmountRisked + sideAWinsNet),
      sideBPayoutTotal: round2(sideBAmountRisked + sideBWinsNet),
      sideATransferIfBWins: round2(sideAAmountRisked),
      sideBTransferIfAWins: round2(sideBAmountRisked),
    };
  }

  if (oddsType === "DECIMAL") {
    // Decimal odds: stake * decimal = total returned (includes original stake)
    const aDecimal = oddsValueA ?? 2.0;
    const bDecimal = oddsValueB ?? 2.0;

    const sideAWinsNet = stakeAmount * aDecimal - stakeAmount;
    const sideBWinsNet = stakeAmount * bDecimal - stakeAmount;

    return {
      sideAAmountRisked: stakeAmount,
      sideBAmountRisked: stakeAmount,
      sideAWinsNet: round2(sideAWinsNet),
      sideBWinsNet: round2(sideBWinsNet),
      sideAPayoutTotal: round2(stakeAmount * aDecimal),
      sideBPayoutTotal: round2(stakeAmount * bDecimal),
      sideATransferIfBWins: stakeAmount,
      sideBTransferIfAWins: stakeAmount,
    };
  }

  // Fallback: even
  return {
    sideAAmountRisked: stakeAmount,
    sideBAmountRisked: stakeAmount,
    sideAWinsNet: stakeAmount,
    sideBWinsNet: stakeAmount,
    sideAPayoutTotal: stakeAmount * 2,
    sideBPayoutTotal: stakeAmount * 2,
    sideATransferIfBWins: stakeAmount,
    sideBTransferIfAWins: stakeAmount,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function formatOdds(
  oddsType: OddsType,
  oddsValueA?: number | null,
  oddsValueB?: number | null
): string {
  if (oddsType === "EVEN") return "Even";
  if (oddsType === "AMERICAN") {
    const a = oddsValueA != null ? formatAmericanLine(oddsValueA) : "pk";
    const b = oddsValueB != null ? formatAmericanLine(oddsValueB) : "pk";
    return `${a} / ${b}`;
  }
  if (oddsType === "DECIMAL") {
    const a = oddsValueA != null ? oddsValueA.toFixed(2) : "-";
    const b = oddsValueB != null ? oddsValueB.toFixed(2) : "-";
    return `${a} / ${b}`;
  }
  return "Even";
}

function formatAmericanLine(v: number): string {
  if (v > 0) return `+${v}`;
  return `${v}`;
}
