"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ParticipantStats } from "@/lib/types";

interface Props {
  stats: ParticipantStats[];
}

export function NetProfitChart({ stats }: Props) {
  const data = stats
    .filter((s) => s.totalBets > 0)
    .sort((a, b) => b.netProfitLoss - a.netProfitLoss)
    .map((s) => ({
      name: s.name,
      net: s.netProfitLoss,
    }));

  if (data.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
        Net Profit / Loss by Player
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`, "Net P/L"]}
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#f3f4f6",
            }}
          />
          <ReferenceLine y={0} stroke="#374151" />
          <Bar dataKey="net" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.net >= 0 ? "#10b981" : "#f43f5e"}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
