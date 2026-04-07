"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BetCard } from "@/components/BetCard";
import { BetData } from "@/lib/types";
import { TrendingUp, CircleDollarSign, Clock, Trophy } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface DashboardStats {
  openCount: number;
  resolvedCount: number;
  totalVolume: number;
  topEarner: string | null;
  topEarnerAmount: number;
  recentBets: BetData[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiUrl("/api/dashboard"));
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
          value={loading ? "—" : (data?.openCount ?? 0).toString()}
          href="/bets"
          color="blue"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-emerald-400" />}
          label="Resolved"
          value={loading ? "—" : (data?.resolvedCount ?? 0).toString()}
          href="/results"
          color="emerald"
        />
        <StatCard
          icon={<CircleDollarSign className="w-5 h-5 text-amber-400" />}
          label="Total Volume"
          value={loading ? "—" : `$${(data?.totalVolume ?? 0).toFixed(0)}`}
          href="/stats"
          color="amber"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-rose-400" />}
          label="Top Earner"
          value={loading ? "—" : (data?.topEarner ?? "—")}
          sub={data?.topEarner ? `+$${(data.topEarnerAmount ?? 0).toFixed(0)} received` : ""}
          href="/stats"
          color="rose"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/bets/new" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors text-sm">
          + New Bet
        </Link>
        <Link href="/bets" className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg transition-colors text-sm">
          Open Bets
        </Link>
        <Link href="/results" className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg transition-colors text-sm">
          Results
        </Link>
        <Link href="/stats" className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg transition-colors text-sm">
          Stats
        </Link>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-52" />
            ))}
          </div>
        ) : !data?.recentBets?.length ? (
          <div className="text-center py-16 text-gray-500">
            No bets yet.{" "}
            <Link href="/bets/new" className="text-emerald-400 hover:underline">
              Create the first one!
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.recentBets.map((bet) => (
              <BetCard key={bet.id} bet={bet} showActions={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, href, color,
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
    <Link href={href} className={`bg-gray-900 border ${border[color]} rounded-xl p-4 flex flex-col gap-2 hover:bg-gray-800/60 transition-all`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-emerald-400">{sub}</div>}
    </Link>
  );
}
