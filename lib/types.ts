export type BetStatus = "OPEN" | "RESOLVED" | "CANCELLED";
export type OddsType = "EVEN" | "AMERICAN" | "DECIMAL";
export type ResolutionOutcome = "A" | "B" | "PUSH";

export interface BetParticipantData {
  id: string;
  betId: string;
  participantName: string;
  side: string;
  amountRisked: number | null;
  potentialPayout: number | null;
}

export interface ResolutionData {
  id: string;
  betId: string;
  resolvedAt: string;
  winningSide: ResolutionOutcome;
  verifiedBy: string | null;
  notes: string | null;
  moneyTransfers: MoneyTransferData[];
}

export interface MoneyTransferData {
  id: string;
  resolutionId: string;
  fromName: string;
  toName: string;
  amount: number;
}

export interface BetData {
  id: string;
  title: string;
  description: string;
  eventDate: string | null;
  resolutionDate: string | null;
  createdAt: string;
  updatedAt: string;
  status: BetStatus;
  creatorName: string;
  stakeAmount: number;
  oddsType: OddsType;
  payoutLogic: string;
  oddsValueA: number | null;
  oddsValueB: number | null;
  sideALabel: string;
  sideBLabel: string;
  notes: string | null;
  participants: BetParticipantData[];
  resolution: ResolutionData | null;
}

export interface ParticipantStats {
  name: string;
  totalBets: number;
  betsWon: number;
  betsLost: number;
  betsPushed: number;
  winPct: number;
  totalWon: number;
  totalLost: number;
  netProfitLoss: number;
  biggestWin: number;
  biggestLoss: number;
  openExposure: number;
}

export interface MoneyFlowEdge {
  from: string;
  to: string;
  amount: number;
}
