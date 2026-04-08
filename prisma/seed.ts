import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.moneyTransfer.deleteMany();
  await prisma.resolution.deleteMany();
  await prisma.betParticipant.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.participant.deleteMany();

  const names = ["Austin", "Kevin", "Hal", "Jason", "Vamshee"];
  for (const name of names) {
    await prisma.participant.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  console.log("Created participants");
  console.log("Seed complete with participants only");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
