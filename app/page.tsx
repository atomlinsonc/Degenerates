import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BetCard } from "@/components/BetCard";
import { BetData } from "@/lib/types";
import { TrendingUp, CircleDollarSign, Clock, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [recentBets, openCount, resolvedCount, topEarners, totalVolume] = await Promise.all([
    prisma.bet.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        participants: true,
        resolution: { include: { moneyTransfers: true } },
      },
    }),
    prisma.bet.count({ where: { status: "OPEN" } }),
    prisma.bet.count({ where: { status: "RESOLVED" } }),
    prisma.moneyTransfer.groupBy({
      by: ["toName"],
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 1,
    }),
    prisma.bet.aggregate({
      _sum: { stakeAmount: true },
      where: { status: { in: ["OPEN", "RESOLVED"] } },
    }),
  ]);

  return { recentBets, openCount, resolvedCount, topEarners, totalVolume };
}

export default async function Dashboard() {
  const { recentBets, openCount, resolvedCount, topEarners, totalVolume } =
    await getDashboardData();

  const topEarner = topEarners[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Track your degenerate gambling activity</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="w-5 h-5 text-blue-400" />}
          label="Open Bets"
          value={openCount.toString()}
          href="/bets"
          color="blue"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-emerald-400" />}
          label="Resolved"
          value={resolvedCount.toString()}
          href="/results"
          color="emerald"
        />
        <StatCard
          icon={<CircleDollarSign className="w-5 h-5 text-amber-400" />}
          label="Total Volume"
          value={`$${(totalVolume._sum.stakeAmount ?? 0).toFixed(0)}`}
          href="/stats"
          color="amber"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-rose-400" />}
          label="Top Earner"
          value={topEarner ? topEarner.toName : "—"}
          sub={topEarner ? `+$${(topEarner._sum.amount ?? 0).toFixed(0)} received` : ""}
          href="/stats"
          color="rose"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/bets/new"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          + New Bet
        </Link>
        <Link
          href="/bets"
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg transition-colors text-sm"
        >
          Open Bets
        </Link>
        <Link
          href="/results"
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg transition-colors text-sm"
        >
          Results
        </Link>
        <Link
          href="/stats"
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg transition-colors text-sm"
        >
          Stats
        </Link>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        {recentBets.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No bets yet.{" "}
            <Link href="/bets/new" className="text-emerald-400 hover:underline">
              Create the first one!
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recentBets.map((bet) => (
              <BetCard key={bet.id} bet={bet as unknown as BetData} showActions={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  href: string;
  color: "blue" | "emerald" | "amber" | "rose";
}) {
  const border: Record<string, string> = {
    blue: "border-blue-500/20 hover:border-blue-500/40",
    emerald: "border-emerald-500/20 hover:border-emerald-500/40",
    amber: "border-amber-500/20 hover:border-amber-500/40",
    rose: "border-rose-500/20 hover:border-rose-500/40",
  };
  return (
    <Link
      href={href}
      className={`bg-gray-900 border ${border[color]} rounded-xl p-4 flex flex-col gap-2 hover:bg-gray-800/60 transition-all`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-emerald-400">{sub}</div>}
    </Link>
  );
}
