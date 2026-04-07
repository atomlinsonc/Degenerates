import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ResolveForm } from "@/components/ResolveForm";
import { BetData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ResolveBetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bet = await prisma.bet.findUnique({
    where: { id },
    include: {
      participants: true,
      resolution: { include: { moneyTransfers: true } },
    },
  });

  if (!bet) notFound();
  if (bet.status !== "OPEN") {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">This bet is already {bet.status.toLowerCase()}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Resolve Bet</h1>
        <p className="text-gray-400 mt-1">Record the outcome</p>
      </div>
      <ResolveForm bet={bet as unknown as BetData} />
    </div>
  );
}
