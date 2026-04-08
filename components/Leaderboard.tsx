import { ParticipantStats } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  stats: ParticipantStats[];
}

export function Leaderboard({ stats }: Props) {
  const sorted = [...stats]
    .filter((s) => s.totalBets > 0)
    .sort((a, b) => b.netProfitLoss - a.netProfitLoss);

  if (sorted.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
        No resolved bets yet.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase tracking-wide w-8">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase tracking-wide">
              Player
            </th>
            <th className="px-4 py-3 text-right text-xs text-gray-500 font-semibold uppercase tracking-wide">
              W-L-P
            </th>
            <th className="px-4 py-3 text-right text-xs text-gray-500 font-semibold uppercase tracking-wide">
              Win%
            </th>
            <th className="px-4 py-3 text-right text-xs text-gray-500 font-semibold uppercase tracking-wide hidden sm:table-cell">
              Won
            </th>
            <th className="px-4 py-3 text-right text-xs text-gray-500 font-semibold uppercase tracking-wide hidden sm:table-cell">
              Lost
            </th>
            <th className="px-4 py-3 text-right text-xs text-gray-500 font-semibold uppercase tracking-wide">
              Net P/L
            </th>
            <th className="px-4 py-3 text-right text-xs text-gray-500 font-semibold uppercase tracking-wide hidden md:table-cell">
              Exposure
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => {
            const isPositive = s.netProfitLoss > 0;
            const isNegative = s.netProfitLoss < 0;
            return (
              <tr
                key={s.name}
                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-white">{s.name}</span>
                  {i === 0 && (
                    <span className="ml-2 text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium">
                      Top
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-300">
                  {s.betsWon}-{s.betsLost}-{s.betsPushed}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={s.winPct >= 50 ? "text-emerald-400" : "text-rose-400"}>
                    {s.winPct}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-emerald-400 hidden sm:table-cell">
                  ${s.totalWon.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-rose-400 hidden sm:table-cell">
                  ${s.totalLost.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-bold">
                  <div className="flex items-center justify-end gap-1">
                    {isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isNegative ? (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Minus className="w-3.5 h-3.5 text-gray-500" />
                    )}
                    <span
                      className={
                        isPositive
                          ? "text-emerald-400"
                          : isNegative
                            ? "text-rose-400"
                            : "text-gray-400"
                      }
                    >
                      {isPositive ? "+" : ""}${s.netProfitLoss.toFixed(2)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">
                  ${s.openExposure.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
