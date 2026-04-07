import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BetForm } from "@/components/BetForm";
import { BetData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditBetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bet = await prisma.bet.findUnique({
    where: { id },
    include: {
      participants: true,
      resolution: { include: { moneyTransfers: true } },
    },
  });

  if (!bet) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Edit Bet</h1>
        <p className="text-gray-400 mt-1">{bet.title}</p>
      </div>
      <BetForm existing={bet as unknown as BetData} />
    </div>
  );
}
