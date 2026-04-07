"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { BetCard } from "@/components/BetCard";
import { BetData } from "@/lib/types";
import { RefreshCw, Plus } from "lucide-react";

export default function BetsPage() {
  const [bets, setBets] = useState<BetData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bets?status=OPEN");
      const data = await res.json();
      setBets(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  const handleDelete = (id: string) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Open Bets</h1>
          <p className="text-gray-400 mt-1">{bets.length} active bet{bets.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchBets}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/bets/new"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Bet
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-52" />
          ))}
        </div>
      ) : bets.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">No open bets right now.</p>
          <Link
            href="/bets/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create one
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bets.map((bet) => (
            <BetCard key={bet.id} bet={bet} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
