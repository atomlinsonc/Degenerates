"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { calculatePayout, formatOdds, formatPayoutLogic } from "@/lib/odds";
import { BetData } from "@/lib/types";
import { apiUrl } from "@/lib/api";

interface Props {
  existing?: BetData;
}

export function BetForm({ existing }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [knownNames, setKnownNames] = useState<string[]>([]);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [eventDate, setEventDate] = useState(existing?.eventDate ? existing.eventDate.split("T")[0] : "");
  const [resolutionDate, setResolutionDate] = useState(
    existing?.resolutionDate ? existing.resolutionDate.split("T")[0] : ""
  );
  const [creatorName, setCreatorName] = useState(existing?.creatorName ?? "");
  const [status, setStatus] = useState<"OPEN" | "CANCELLED">(
    existing?.status === "CANCELLED" ? "CANCELLED" : "OPEN"
  );
  const [stakeAmount, setStakeAmount] = useState(existing?.stakeAmount?.toString() ?? "");
  const [oddsType, setOddsType] = useState<"EVEN" | "AMERICAN" | "DECIMAL">(
    existing?.oddsType ?? "EVEN"
  );
  const [oddsValueA, setOddsValueA] = useState(existing?.oddsValueA?.toString() ?? "");
  const [oddsValueB, setOddsValueB] = useState(existing?.oddsValueB?.toString() ?? "");
  const [sideALabel, setSideALabel] = useState(existing?.sideALabel ?? "Side A");
  const [sideBLabel, setSideBLabel] = useState(existing?.sideBLabel ?? "Side B");
  const [sideAParticipants, setSideAParticipants] = useState<string[]>(
    existing?.participants.filter((participant) => participant.side === "A").map((participant) => participant.participantName) ?? [""]
  );
  const [sideBParticipants, setSideBParticipants] = useState<string[]>(
    existing?.participants.filter((participant) => participant.side === "B").map((participant) => participant.participantName) ?? [""]
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");

  useEffect(() => {
    fetch(apiUrl("/api/participants"))
      .then((response) => response.json())
      .then((data: { name: string }[]) => setKnownNames(data.map((participant) => participant.name)))
      .catch(() => {});
  }, []);

  const stake = Number.parseFloat(stakeAmount) || 0;
  const parsedOddsA = oddsValueA ? Number.parseFloat(oddsValueA) : null;
  const parsedOddsB = oddsValueB ? Number.parseFloat(oddsValueB) : null;
  const payout = stake > 0 ? calculatePayout(stake, oddsType, parsedOddsA, parsedOddsB) : null;
  const payoutLogic = "LOSERS_PAY_WINNERS";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const cleanA = sideAParticipants.map((name) => name.trim()).filter(Boolean);
    const cleanB = sideBParticipants.map((name) => name.trim()).filter(Boolean);
    const overlap = cleanA.some((name) =>
      cleanB.some((other) => other.toLowerCase() === name.toLowerCase())
    );

    if (!title.trim()) return setError("Title is required");
    if (!creatorName.trim()) return setError("Creator name is required");
    if (!stakeAmount || Number.parseFloat(stakeAmount) <= 0) {
      return setError("Stake must be a positive number");
    }
    if (!cleanA.length || !cleanB.length) {
      return setError("Each side needs at least one participant");
    }
    if (overlap) {
      return setError("A participant cannot be on both sides of the same bet");
    }

    const body = {
      title,
      description,
      eventDate: eventDate || null,
      resolutionDate: resolutionDate || null,
      creatorName,
      status,
      stakeAmount: Number.parseFloat(stakeAmount),
      oddsType,
      payoutLogic,
      oddsValueA: parsedOddsA,
      oddsValueB: parsedOddsB,
      sideALabel,
      sideBLabel,
      sideAParticipants: cleanA,
      sideBParticipants: cleanB,
      notes: notes || null,
    };

    setLoading(true);
    try {
      const response = await fetch(
        existing ? apiUrl(`/api/bets/${existing.id}`) : apiUrl("/api/bets"),
        {
          method: existing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.push("/bets");
      router.refresh();
    } catch {
      setError("Network error - please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="bg-red-900/40 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Bet Details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Bet Title *</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Austin vs Kevin - Basketball game"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Condition / Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Detailed condition of the bet..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Event Date</label>
            <input
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Expected Resolution Date</label>
            <input
              type="date"
              value={resolutionDate}
              onChange={(event) => setResolutionDate(event.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as "OPEN" | "CANCELLED")}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
            >
              <option value="OPEN">Open</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Creator Name *</label>
          <input
            list="known-names"
            value={creatorName}
            onChange={(event) => setCreatorName(event.target.value)}
            placeholder="Your name"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
          />
          <datalist id="known-names">
            {knownNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional notes..."
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm resize-none"
          />
        </div>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Stakes and Odds</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Stake Amount ($) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={stakeAmount}
              onChange={(event) => setStakeAmount(event.target.value)}
              placeholder="20.00"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Odds Type</label>
            <select
              value={oddsType}
              onChange={(event) => setOddsType(event.target.value as "EVEN" | "AMERICAN" | "DECIMAL")}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
            >
              <option value="EVEN">Even</option>
              <option value="AMERICAN">American</option>
              <option value="DECIMAL">Decimal</option>
            </select>
          </div>
        </div>

        {oddsType !== "EVEN" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {oddsType === "AMERICAN" ? "Side A odds" : "Side A decimal"}
              </label>
              <input
                type="number"
                step={oddsType === "AMERICAN" ? "1" : "0.01"}
                value={oddsValueA}
                onChange={(event) => setOddsValueA(event.target.value)}
                placeholder={oddsType === "AMERICAN" ? "-110" : "1.91"}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {oddsType === "AMERICAN" ? "Side B odds" : "Side B decimal"}
              </label>
              <input
                type="number"
                step={oddsType === "AMERICAN" ? "1" : "0.01"}
                value={oddsValueB}
                onChange={(event) => setOddsValueB(event.target.value)}
                placeholder={oddsType === "AMERICAN" ? "+130" : "2.10"}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>
        )}

        {payout && (
          <div className="bg-gray-800/60 rounded-lg p-3 text-xs text-gray-400 space-y-1">
            <div className="font-semibold text-gray-300 mb-1">Payout Preview</div>
            <div>
              Odds: <span className="text-white">{formatOdds(oddsType, parsedOddsA, parsedOddsB)}</span>
            </div>
            <div>
              Payout logic: <span className="text-white">{formatPayoutLogic(payoutLogic)}</span>
            </div>
            <div>
              Side A risks <span className="text-white">${payout.sideAAmountRisked.toFixed(2)}</span> and nets{" "}
              <span className="text-emerald-400">${payout.sideAWinsNet.toFixed(2)}</span> if it wins.
            </div>
            <div>
              Side B risks <span className="text-white">${payout.sideBAmountRisked.toFixed(2)}</span> and nets{" "}
              <span className="text-emerald-400">${payout.sideBWinsNet.toFixed(2)}</span> if it wins.
            </div>
            <div>
              Settlement transfer ranges from{" "}
              <span className="text-white">
                ${Math.min(payout.sideATransferIfBWins, payout.sideBTransferIfAWins).toFixed(2)}
              </span>{" "}
              to{" "}
              <span className="text-white">
                ${Math.max(payout.sideATransferIfBWins, payout.sideBTransferIfAWins).toFixed(2)}
              </span>
              .
            </div>
          </div>
        )}
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Participants</h2>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              value={sideALabel}
              onChange={(event) => setSideALabel(event.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-blue-300 font-semibold text-sm focus:outline-none focus:border-blue-500 w-40"
              placeholder="Side A label"
            />
            <span className="text-gray-500 text-xs">Who picked what on Side A</span>
          </div>
          {sideAParticipants.map((name, index) => (
            <div key={`side-a-${index}`} className="flex gap-2 mb-2">
              <input
                list="known-names"
                value={name}
                onChange={(event) => {
                  const next = [...sideAParticipants];
                  next[index] = event.target.value;
                  setSideAParticipants(next);
                }}
                placeholder="Participant name"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              />
              {sideAParticipants.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSideAParticipants(sideAParticipants.filter((_, itemIndex) => itemIndex !== index))}
                  className="px-3 py-2 text-gray-500 hover:text-red-400 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSideAParticipants([...sideAParticipants, ""])}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            + Add participant to Side A
          </button>
        </div>

        <div className="border-t border-gray-800" />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              value={sideBLabel}
              onChange={(event) => setSideBLabel(event.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-rose-300 font-semibold text-sm focus:outline-none focus:border-rose-500 w-40"
              placeholder="Side B label"
            />
            <span className="text-gray-500 text-xs">Who picked what on Side B</span>
          </div>
          {sideBParticipants.map((name, index) => (
            <div key={`side-b-${index}`} className="flex gap-2 mb-2">
              <input
                list="known-names"
                value={name}
                onChange={(event) => {
                  const next = [...sideBParticipants];
                  next[index] = event.target.value;
                  setSideBParticipants(next);
                }}
                placeholder="Participant name"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 text-sm"
              />
              {sideBParticipants.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSideBParticipants(sideBParticipants.filter((_, itemIndex) => itemIndex !== index))}
                  className="px-3 py-2 text-gray-500 hover:text-red-400 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSideBParticipants([...sideBParticipants, ""])}
            className="text-xs text-rose-400 hover:text-rose-300"
          >
            + Add participant to Side B
          </button>
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? "Saving..." : existing ? "Update Bet" : "Create Bet"}
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
