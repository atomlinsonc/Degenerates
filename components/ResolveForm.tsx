"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BetData, ResolutionOutcome } from "@/lib/types";
import { calculatePayout } from "@/lib/odds";
import { apiUrl } from "@/lib/api";

interface Props {
  bet: BetData;
}

export function ResolveForm({ bet }: Props) {
  const router = useRouter();
  const [winningSide, setWinningSide] = useState<ResolutionOutcome | "">("");
  const [verifiedBy, setVerifiedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [resolvedAt, setResolvedAt] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sideA = bet.participants.filter((p) => p.side === "A");
  const sideB = bet.participants.filter((p) => p.side === "B");

  const payout = calculatePayout(
    bet.stakeAmount,
    bet.oddsType,
    bet.oddsValueA,
    bet.oddsValueB
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!winningSide) return setError("Select an outcome");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(apiUrl(`/api/bets/${bet.id}/resolve`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winningSide, verifiedBy, notes, resolvedAt }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to resolve");
        return;
      }

      router.push("/results");
      router.refresh();
    } catch {
      setError("Network error - please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="bg-red-900/40 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white text-lg mb-1">{bet.title}</h2>
        {bet.description && <p className="text-gray-400 text-sm mb-3">{bet.description}</p>}
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-gray-500">Stake: </span>
            <span className="text-white font-medium">${bet.stakeAmount}</span>
          </div>
          <div>
            <span className="text-gray-500">Odds: </span>
            <span className="text-white font-medium">
              {bet.oddsType === "EVEN" ? "Even" : `${bet.oddsValueA} / ${bet.oddsValueB}`}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Outcome</h2>

        <div className="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setWinningSide("A")}
            className={`border rounded-xl p-4 text-left transition-all ${
              winningSide === "A"
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{bet.sideALabel}</div>
            <div className="font-semibold text-blue-300">
              {sideA.map((p) => p.participantName).join(", ")}
            </div>
            {winningSide === "A" && (
              <div className="text-xs text-emerald-400 mt-1">
                Wins ${payout.sideAWinsNet.toFixed(2)}
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setWinningSide("B")}
            className={`border rounded-xl p-4 text-left transition-all ${
              winningSide === "B"
                ? "border-rose-500 bg-rose-500/10"
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{bet.sideBLabel}</div>
            <div className="font-semibold text-rose-300">
              {sideB.map((p) => p.participantName).join(", ")}
            </div>
            {winningSide === "B" && (
              <div className="text-xs text-emerald-400 mt-1">
                Wins ${payout.sideBWinsNet.toFixed(2)}
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setWinningSide("PUSH")}
            className={`border rounded-xl p-4 text-left transition-all ${
              winningSide === "PUSH"
                ? "border-amber-500 bg-amber-500/10"
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Push</div>
            <div className="font-semibold text-amber-300">No winner, no loser</div>
            {winningSide === "PUSH" && (
              <div className="text-xs text-amber-200 mt-1">Everyone gets their stake back</div>
            )}
          </button>
        </div>

        {winningSide && (
          <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-lg p-3 text-sm">
            <div className="text-emerald-400 font-semibold mb-1">Settlement Preview</div>
            {winningSide === "A" ? (
              <>
                {sideB.map((p) => (
                  <div key={p.id} className="text-gray-300">
                    {p.participantName} pays{" "}
                    {sideA.map((w) => w.participantName).join(", ")} -{" "}
                    <span className="text-white font-medium">
                      ${(payout.sideBTransferIfAWins / sideA.length).toFixed(2)}
                    </span>
                  </div>
                ))}
              </>
            ) : winningSide === "B" ? (
              <>
                {sideA.map((p) => (
                  <div key={p.id} className="text-gray-300">
                    {p.participantName} pays{" "}
                    {sideB.map((w) => w.participantName).join(", ")} -{" "}
                    <span className="text-white font-medium">
                      ${(payout.sideATransferIfBWins / sideB.length).toFixed(2)}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-gray-300">Push recorded. No money changes hands.</div>
            )}
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Resolution Details
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Resolved Date</label>
          <input
            type="date"
            value={resolvedAt}
            onChange={(e) => setResolvedAt(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Verified By</label>
          <input
            value={verifiedBy}
            onChange={(e) => setVerifiedBy(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any final notes about this outcome..."
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !winningSide}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? "Resolving..." : "Confirm Resolution"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
