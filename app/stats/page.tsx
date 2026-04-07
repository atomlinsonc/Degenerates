"use client";

import { useEffect, useState, useCallback } from "react";
import { ParticipantStats, MoneyFlowEdge } from "@/lib/types";
import { Leaderboard } from "@/components/Leaderboard";
import { NetProfitChart } from "@/components/NetProfitChart";
import { MoneyFlowGraph } from "@/components/MoneyFlowGraph";
import { RefreshCw } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function StatsPage() {
  const [stats, setStats] = useState<ParticipantStats[]>([]);
  const [moneyFlow, setMoneyFlow] = useState<{ nodes: string[]; edges: MoneyFlowEdge[] }>({
    nodes: [],
    edges: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, flowRes] = await Promise.all([
        fetch(apiUrl("/api/stats")),
        fetch(apiUrl("/api/stats/money-flow")),
      ]);
      const [statsData, flowData] = await Promise.all([statsRes.json(), flowRes.json()]);
      setStats(statsData);
      setMoneyFlow(flowData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const totalResolved = stats.reduce((s, p) => s + p.betsWon + p.betsLost, 0) / 2;
  const totalMoved = stats.reduce((s, p) => s + p.totalWon, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Stats</h1>
          <p className="text-gray-400 mt-1">Lifetime stats for all participants</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Stats
        </button>
      </div>

      {/* Summary numbers */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Participants</div>
          <div className="text-3xl font-bold text-white">{stats.filter((s) => s.totalBets > 0).length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Resolved Bets</div>
          <div className="text-3xl font-bold text-white">{totalResolved}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total $ Moved</div>
          <div className="text-3xl font-bold text-emerald-400">${totalMoved.toFixed(0)}</div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-48" />
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-64" />
        </div>
      ) : (
        <>
          {/* Leaderboard */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Leaderboard</h2>
            <Leaderboard stats={stats} />
          </div>

          {/* Per-player detail cards */}
          {stats.filter((s) => s.totalBets > 0).length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Player Details</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stats
                  .filter((s) => s.totalBets > 0)
                  .map((s) => (
                    <PlayerCard key={s.name} stats={s} />
                  ))}
              </div>
            </div>
          )}

          {/* Net profit chart */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Net Profit / Loss</h2>
            <NetProfitChart stats={stats} />
          </div>

          {/* Money flow */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Money Flow</h2>
            <MoneyFlowGraph nodes={moneyFlow.nodes} edges={moneyFlow.edges} />
          </div>
        </>
      )}
    </div>
  );
}

function PlayerCard({ stats: s }: { stats: ParticipantStats }) {
  const net = s.netProfitLoss;
  const isUp = net > 0;
  const isDown = net < 0;

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 space-y-3 ${isUp ? "border-emerald-500/20" : isDown ? "border-rose-500/20" : "border-gray-800"}`}>
      <div className="flex items-start justify-between">
        <span className="font-bold text-white text-lg">{s.name}</span>
        <span className={`text-lg font-bold ${isUp ? "text-emerald-400" : isDown ? "text-rose-400" : "text-gray-400"}`}>
          {isUp ? "+" : ""}${net.toFixed(2)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Bets" value={s.totalBets.toString()} />
        <Stat label="W-L" value={`${s.betsWon}-${s.betsLost}`} />
        <Stat label="Win%" value={`${s.winPct}%`} color={s.winPct >= 50 ? "emerald" : "rose"} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <Stat label="Best Win" value={`$${s.biggestWin.toFixed(0)}`} color="emerald" />
        <Stat label="Worst Loss" value={`$${s.biggestLoss.toFixed(0)}`} color="rose" />
      </div>
      {s.openExposure > 0 && (
        <div className="text-xs text-gray-500 text-right">
          ${s.openExposure.toFixed(2)} at risk (open)
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "emerald" | "rose";
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg py-2 px-1">
      <div className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</div>
      <div
        className={`font-semibold text-sm mt-0.5 ${
          color === "emerald"
            ? "text-emerald-400"
            : color === "rose"
            ? "text-rose-400"
            : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
