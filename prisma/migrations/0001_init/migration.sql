-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('OPEN', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OddsType" AS ENUM ('EVEN', 'AMERICAN', 'DECIMAL');

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "resolutionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'OPEN',
    "creatorName" TEXT NOT NULL,
    "stakeAmount" DOUBLE PRECISION NOT NULL,
    "oddsType" "OddsType" NOT NULL DEFAULT 'EVEN',
    "payoutLogic" TEXT NOT NULL DEFAULT 'LOSERS_PAY_WINNERS',
    "oddsValueA" DOUBLE PRECISION,
    "oddsValueB" DOUBLE PRECISION,
    "sideALabel" TEXT NOT NULL DEFAULT 'Side A',
    "sideBLabel" TEXT NOT NULL DEFAULT 'Side B',
    "notes" TEXT,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetParticipant" (
    "id" TEXT NOT NULL,
    "betId" TEXT NOT NULL,
    "participantName" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "amountRisked" DOUBLE PRECISION,
    "potentialPayout" DOUBLE PRECISION,
    "participantId" TEXT,

    CONSTRAINT "BetParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resolution" (
    "id" TEXT NOT NULL,
    "betId" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "winningSide" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "Resolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyTransfer" (
    "id" TEXT NOT NULL,
    "resolutionId" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "toName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MoneyTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_name_key" ON "Participant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Resolution_betId_key" ON "Resolution"("betId");

-- AddForeignKey
ALTER TABLE "BetParticipant" ADD CONSTRAINT "BetParticipant_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetParticipant" ADD CONSTRAINT "BetParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resolution" ADD CONSTRAINT "Resolution_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyTransfer" ADD CONSTRAINT "MoneyTransfer_resolutionId_fkey" FOREIGN KEY ("resolutionId") REFERENCES "Resolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

