import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.moneyTransfer.deleteMany();
  await prisma.resolution.deleteMany();
  await prisma.betParticipant.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.participant.deleteMany();

  // Create participants
  const names = ["Austin", "Kevin", "Hal", "Jason", "Vamshee"];
  for (const name of names) {
    await prisma.participant.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  console.log("✅ Created participants");

  // ─── Resolved Bets ──────────────────────────────────────────────────────────

  // 1. Austin vs Kevin basketball (even odds) — Austin won
  const bet1 = await prisma.bet.create({
    data: {
      title: "Austin vs Kevin — 1v1 Basketball",
      description: "First to 11 points, win by 2. Game at Barton Springs court.",
      eventDate: new Date("2025-12-14"),
      resolutionDate: new Date("2025-12-14"),
      status: "RESOLVED",
      creatorName: "Austin",
      stakeAmount: 20,
      oddsType: "EVEN",
      sideALabel: "Austin",
      sideBLabel: "Kevin",
      notes: "Austin's home court advantage counts",
      participants: {
        create: [
          { participantName: "Austin", side: "A", amountRisked: 20, potentialPayout: 40 },
          { participantName: "Kevin", side: "B", amountRisked: 20, potentialPayout: 40 },
        ],
      },
    },
  });

  const res1 = await prisma.resolution.create({
    data: {
      betId: bet1.id,
      resolvedAt: new Date("2025-12-14"),
      winningSide: "A",
      verifiedBy: "Hal",
      notes: "Austin won 11-9 in a close game",
      moneyTransfers: {
        create: [{ fromName: "Kevin", toName: "Austin", amount: 20 }],
      },
    },
  });
  console.log("✅ Bet 1 resolved:", res1.id);

  // 2. Aggies vs Longhorns — Kevin (Aggies) vs Austin (Longhorns) — American odds
  const bet2 = await prisma.bet.create({
    data: {
      title: "Aggies vs Longhorns — Big 12 Rivalry",
      description: "Texas A&M at -110 vs Texas at +110. Kevin takes Aggies, Austin takes Longhorns.",
      eventDate: new Date("2025-11-29"),
      resolutionDate: new Date("2025-11-29"),
      status: "RESOLVED",
      creatorName: "Kevin",
      stakeAmount: 50,
      oddsType: "AMERICAN",
      oddsValueA: -110,
      oddsValueB: 110,
      sideALabel: "Kevin (Aggies)",
      sideBLabel: "Austin (Longhorns)",
      notes: "Longhorns won 34-30 in double OT",
      participants: {
        create: [
          { participantName: "Kevin", side: "A", amountRisked: 50, potentialPayout: 95.45 },
          { participantName: "Austin", side: "B", amountRisked: 50, potentialPayout: 105 },
        ],
      },
    },
  });

  const res2 = await prisma.resolution.create({
    data: {
      betId: bet2.id,
      resolvedAt: new Date("2025-11-29"),
      winningSide: "B",
      verifiedBy: "Jason",
      notes: "UT pulls it off in double OT — Kevin's crying",
      moneyTransfers: {
        create: [{ fromName: "Kevin", toName: "Austin", amount: 50 }],
      },
    },
  });
  console.log("✅ Bet 2 resolved:", res2.id);

  // 3. Hal vs Jason — Fantasy Football head-to-head
  const bet3 = await prisma.bet.create({
    data: {
      title: "Fantasy Football H2H Week 14",
      description: "Hal vs Jason in fantasy matchup. Loser buys winner lunch.",
      eventDate: new Date("2025-12-09"),
      resolutionDate: new Date("2025-12-09"),
      status: "RESOLVED",
      creatorName: "Hal",
      stakeAmount: 30,
      oddsType: "EVEN",
      sideALabel: "Hal",
      sideBLabel: "Jason",
      participants: {
        create: [
          { participantName: "Hal", side: "A", amountRisked: 30, potentialPayout: 60 },
          { participantName: "Jason", side: "B", amountRisked: 30, potentialPayout: 60 },
        ],
      },
    },
  });

  const res3 = await prisma.resolution.create({
    data: {
      betId: bet3.id,
      resolvedAt: new Date("2025-12-09"),
      winningSide: "B",
      verifiedBy: "Vamshee",
      notes: "Jason squeaked by 118-114 with CMC going off",
      moneyTransfers: {
        create: [{ fromName: "Hal", toName: "Jason", amount: 30 }],
      },
    },
  });
  console.log("✅ Bet 3 resolved:", res3.id);

  // 4. Group bet: Austin + Hal vs Kevin + Jason — Chiefs vs Bills
  const bet4 = await prisma.bet.create({
    data: {
      title: "Chiefs vs Bills — AFC Playoff",
      description: "Austin & Hal on Chiefs (-150), Kevin & Jason on Bills (+130). Each team puts in $50.",
      eventDate: new Date("2026-01-19"),
      resolutionDate: new Date("2026-01-19"),
      status: "RESOLVED",
      creatorName: "Austin",
      stakeAmount: 50,
      oddsType: "AMERICAN",
      oddsValueA: -150,
      oddsValueB: 130,
      sideALabel: "Chiefs (Austin + Hal)",
      sideBLabel: "Bills (Kevin + Jason)",
      notes: "Overtime thriller. Mahomes goes off.",
      participants: {
        create: [
          { participantName: "Austin", side: "A", amountRisked: 50, potentialPayout: 83.33 },
          { participantName: "Hal", side: "A", amountRisked: 50, potentialPayout: 83.33 },
          { participantName: "Kevin", side: "B", amountRisked: 50, potentialPayout: 115 },
          { participantName: "Jason", side: "B", amountRisked: 50, potentialPayout: 115 },
        ],
      },
    },
  });

  const res4 = await prisma.resolution.create({
    data: {
      betId: bet4.id,
      resolvedAt: new Date("2026-01-19"),
      winningSide: "A",
      verifiedBy: "Vamshee",
      notes: "Chiefs 27-24 OT — Mahomes does it again",
      moneyTransfers: {
        create: [
          { fromName: "Kevin", toName: "Austin", amount: 25 },
          { fromName: "Kevin", toName: "Hal", amount: 25 },
          { fromName: "Jason", toName: "Austin", amount: 25 },
          { fromName: "Jason", toName: "Hal", amount: 25 },
        ],
      },
    },
  });
  console.log("✅ Bet 4 resolved:", res4.id);

  // 5. Vamshee vs Hal — Coding challenge (custom personal bet)
  const bet5 = await prisma.bet.create({
    data: {
      title: "Vamshee vs Hal — LeetCode Grind",
      description: "Who can solve more LeetCode Hard problems in one week. Starts Sunday midnight.",
      eventDate: new Date("2025-12-21"),
      resolutionDate: new Date("2025-12-21"),
      status: "RESOLVED",
      creatorName: "Vamshee",
      stakeAmount: 25,
      oddsType: "EVEN",
      sideALabel: "Vamshee",
      sideBLabel: "Hal",
      notes: "Vamshee: 7, Hal: 4. Not even close.",
      participants: {
        create: [
          { participantName: "Vamshee", side: "A", amountRisked: 25, potentialPayout: 50 },
          { participantName: "Hal", side: "B", amountRisked: 25, potentialPayout: 50 },
        ],
      },
    },
  });

  const res5 = await prisma.resolution.create({
    data: {
      betId: bet5.id,
      resolvedAt: new Date("2025-12-21"),
      winningSide: "A",
      verifiedBy: "Kevin",
      notes: "Vamshee dominated 7-4",
      moneyTransfers: {
        create: [{ fromName: "Hal", toName: "Vamshee", amount: 25 }],
      },
    },
  });
  console.log("✅ Bet 5 resolved:", res5.id);

  // 6. Kevin vs Jason — Golf round score
  const bet6 = await prisma.bet.create({
    data: {
      title: "Kevin vs Jason — Golf at Barton Creek",
      description: "Stroke play, 18 holes. Low gross score wins. No handicap.",
      eventDate: new Date("2026-01-05"),
      resolutionDate: new Date("2026-01-05"),
      status: "RESOLVED",
      creatorName: "Kevin",
      stakeAmount: 40,
      oddsType: "EVEN",
      sideALabel: "Kevin",
      sideBLabel: "Jason",
      participants: {
        create: [
          { participantName: "Kevin", side: "A", amountRisked: 40, potentialPayout: 80 },
          { participantName: "Jason", side: "B", amountRisked: 40, potentialPayout: 80 },
        ],
      },
    },
  });

  const res6 = await prisma.resolution.create({
    data: {
      betId: bet6.id,
      resolvedAt: new Date("2026-01-05"),
      winningSide: "A",
      verifiedBy: "Austin",
      notes: "Kevin shot 84, Jason shot 91. Not a good day for Jason.",
      moneyTransfers: {
        create: [{ fromName: "Jason", toName: "Kevin", amount: 40 }],
      },
    },
  });
  console.log("✅ Bet 6 resolved:", res6.id);

  // ─── Open Bets ──────────────────────────────────────────────────────────────

  // 7. Austin vs Vamshee — Super Bowl
  await prisma.bet.create({
    data: {
      title: "Super Bowl LX — Eagles vs Chiefs",
      description: "Austin takes Eagles (+115), Vamshee takes Chiefs (-135). Annual Super Bowl bet.",
      eventDate: new Date("2026-02-08"),
      resolutionDate: new Date("2026-02-08"),
      status: "OPEN",
      creatorName: "Austin",
      stakeAmount: 100,
      oddsType: "AMERICAN",
      oddsValueA: 115,
      oddsValueB: -135,
      sideALabel: "Austin (Eagles)",
      sideBLabel: "Vamshee (Chiefs)",
      notes: "Winner buys the watch party snacks",
      participants: {
        create: [
          { participantName: "Austin", side: "A", amountRisked: 100, potentialPayout: 215 },
          { participantName: "Vamshee", side: "B", amountRisked: 100, potentialPayout: 174.07 },
        ],
      },
    },
  });
  console.log("✅ Bet 7 (open)");

  // 8. Hal vs Kevin — March Madness bracket
  await prisma.bet.create({
    data: {
      title: "March Madness — Best Bracket",
      description: "ESPN Bracket Challenge. Highest score by end of tournament wins. $50 to the winner.",
      eventDate: new Date("2026-04-06"),
      resolutionDate: new Date("2026-04-06"),
      status: "OPEN",
      creatorName: "Hal",
      stakeAmount: 50,
      oddsType: "EVEN",
      sideALabel: "Hal",
      sideBLabel: "Kevin",
      participants: {
        create: [
          { participantName: "Hal", side: "A", amountRisked: 50, potentialPayout: 100 },
          { participantName: "Kevin", side: "B", amountRisked: 50, potentialPayout: 100 },
        ],
      },
    },
  });
  console.log("✅ Bet 8 (open)");

  // 9. All 5 friends — Weight loss challenge
  await prisma.bet.create({
    data: {
      title: "90-Day Body Recomp Challenge",
      description: "Who drops the most body fat % from Jan 1 to Apr 1? Winner takes the pot. Weigh-in with InBody at the gym.",
      eventDate: new Date("2026-04-01"),
      resolutionDate: new Date("2026-04-01"),
      status: "OPEN",
      creatorName: "Jason",
      stakeAmount: 50,
      oddsType: "EVEN",
      sideALabel: "Team Discipline",
      sideBLabel: "Team Whatever",
      notes: "InBody scan required. No dehydration tricks.",
      participants: {
        create: [
          { participantName: "Austin", side: "A", amountRisked: 50, potentialPayout: 250 },
          { participantName: "Hal", side: "A", amountRisked: 50, potentialPayout: 250 },
          { participantName: "Kevin", side: "B", amountRisked: 50, potentialPayout: 250 },
          { participantName: "Jason", side: "B", amountRisked: 50, potentialPayout: 250 },
          { participantName: "Vamshee", side: "B", amountRisked: 50, potentialPayout: 250 },
        ],
      },
    },
  });
  console.log("✅ Bet 9 (open)");

  // 10. Jason vs Austin — "Who finishes a book first" personal bet
  await prisma.bet.create({
    data: {
      title: "Book Race — Atomic Habits vs Deep Work",
      description: "Jason reads Atomic Habits, Austin reads Deep Work. Who finishes and sends a 3-sentence summary first?",
      eventDate: new Date("2026-04-30"),
      resolutionDate: new Date("2026-04-30"),
      status: "OPEN",
      creatorName: "Jason",
      stakeAmount: 15,
      oddsType: "EVEN",
      sideALabel: "Jason",
      sideBLabel: "Austin",
      notes: "Summary must be sent in the group chat as proof",
      participants: {
        create: [
          { participantName: "Jason", side: "A", amountRisked: 15, potentialPayout: 30 },
          { participantName: "Austin", side: "B", amountRisked: 15, potentialPayout: 30 },
        ],
      },
    },
  });
  console.log("✅ Bet 10 (open)");

  // 11. Vamshee vs Kevin — Decimal odds, tech stock bet
  await prisma.bet.create({
    data: {
      title: "NVDA vs AMD — Price Race to EOY",
      description: "Vamshee picks NVDA ($800+), Kevin picks AMD ($200+) by Dec 31 2026. Whoever hits target first wins.",
      eventDate: new Date("2026-12-31"),
      resolutionDate: new Date("2026-12-31"),
      status: "OPEN",
      creatorName: "Vamshee",
      stakeAmount: 75,
      oddsType: "DECIMAL",
      oddsValueA: 1.75,
      oddsValueB: 2.25,
      sideALabel: "Vamshee (NVDA)",
      sideBLabel: "Kevin (AMD)",
      notes: "Close of market price on target day counts.",
      participants: {
        create: [
          { participantName: "Vamshee", side: "A", amountRisked: 75, potentialPayout: 131.25 },
          { participantName: "Kevin", side: "B", amountRisked: 75, potentialPayout: 168.75 },
        ],
      },
    },
  });
  console.log("✅ Bet 11 (open)");

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
