"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { calculatePayout, formatOdds } from "@/lib/odds";
import { BetData } from "@/lib/types";

interface Props {
  existing?: BetData;
}

export function BetForm({ existing }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [knownNames, setKnownNames] = useState<string[]>([]);

  // Form state
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [eventDate, setEventDate] = useState(
    existing?.eventDate ? existing.eventDate.split("T")[0] : ""
  );
  const [resolutionDate, setResolutionDate] = useState(
    existing?.resolutionDate ? existing.resolutionDate.split("T")[0] : ""
  );
  const [creatorName, setCreatorName] = useState(existing?.creatorName ?? "");
  const [stakeAmount, setStakeAmount] = useState(
    existing?.stakeAmount?.toString() ?? ""
  );
  const [oddsType, setOddsType] = useState<"EVEN" | "AMERICAN" | "DECIMAL">(
    existing?.oddsType ?? "EVEN"
  );
  const [oddsValueA, setOddsValueA] = useState(
    existing?.oddsValueA?.toString() ?? ""
  );
  const [oddsValueB, setOddsValueB] = useState(
    existing?.oddsValueB?.toString() ?? ""
  );
  const [sideALabel, setSideALabel] = useState(existing?.sideALabel ?? "Side A");
  const [sideBLabel, setSideBLabel] = useState(existing?.sideBLabel ?? "Side B");
  const [sideAParticipants, setSideAParticipants] = useState<string[]>(
    existing?.participants.filter((p) => p.side === "A").map((p) => p.participantName) ?? [""]
  );
  const [sideBParticipants, setSideBParticipants] = useState<string[]>(
    existing?.participants.filter((p) => p.side === "B").map((p) => p.participantName) ?? [""]
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");

  useEffect(() => {
    fetch("/api/participants")
      .then((r) => r.json())
      .then((data: { name: string }[]) => setKnownNames(data.map((d) => d.name)))
      .catch(() => {});
  }, []);

  const stake = parseFloat(stakeAmount) || 0;
  const oA = oddsValueA ? parseFloat(oddsValueA) : null;
  const oB = oddsValueB ? parseFloat(oddsValueB) : null;
  const payout = stake > 0 ? calculatePayout(stake, oddsType, oA, oB) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanA = sideAParticipants.filter((n) => n.trim());
    const cleanB = sideBParticipants.filter((n) => n.trim());

    if (!title.trim()) return setError("Title is required");
    if (!creatorName.trim()) return setError("Creator name is required");
    if (!stakeAmount || parseFloat(stakeAmount) <= 0)
      return setError("Stake must be a positive number");
    if (!cleanA.length || !cleanB.length)
      return setError("Each side needs at least one participant");

    const body = {
      title,
      description,
      eventDate: eventDate || null,
      resolutionDate: resolutionDate || null,
      creatorName,
      stakeAmount: parseFloat(stakeAmount),
      oddsType,
      oddsValueA: oA,
      oddsValueB: oB,
      sideALabel,
      sideBLabel,
      sideAParticipants: cleanA,
      sideBParticipants: cleanB,
      notes: notes || null,
    };

    setLoading(true);
    try {
      const res = await fetch(
        existing ? `/api/bets/${existing.id}` : "/api/bets",
        {
          method: existing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.push("/bets");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-900/40 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Bet Details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Austin vs Kevin — Basketball game"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Condition / Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed condition of the bet..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Event Date</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Resolution Date</label>
            <input
              type="date"
              value={resolutionDate}
              onChange={(e) => setResolutionDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Created By *</label>
          <input
            list="known-names"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
          />
          <datalist id="known-names">
            {knownNames.map((n) => <option key={n} value={n} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm resize-none"
          />
        </div>
      </section>

      {/* Stakes & Odds */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Stakes &amp; Odds</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Stake Amount ($) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="20.00"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Odds Type</label>
            <select
              value={oddsType}
              onChange={(e) => setOddsType(e.target.value as "EVEN" | "AMERICAN" | "DECIMAL")}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
            >
              <option value="EVEN">Even (1:1)</option>
              <option value="AMERICAN">American (-110 / +150)</option>
              <option value="DECIMAL">Decimal (1.91 / 2.10)</option>
            </select>
          </div>
        </div>

        {oddsType !== "EVEN" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {oddsType === "AMERICAN" ? "Side A odds (e.g. -110)" : "Side A decimal (e.g. 1.91)"}
              </label>
              <input
                type="number"
                step={oddsType === "AMERICAN" ? "1" : "0.01"}
                value={oddsValueA}
                onChange={(e) => setOddsValueA(e.target.value)}
                placeholder={oddsType === "AMERICAN" ? "-110" : "1.91"}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {oddsType === "AMERICAN" ? "Side B odds (e.g. +130)" : "Side B decimal (e.g. 2.10)"}
              </label>
              <input
                type="number"
                step={oddsType === "AMERICAN" ? "1" : "0.01"}
                value={oddsValueB}
                onChange={(e) => setOddsValueB(e.target.value)}
                placeholder={oddsType === "AMERICAN" ? "+130" : "2.10"}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* Payout preview */}
        {payout && (
          <div className="bg-gray-800/60 rounded-lg p-3 text-xs text-gray-400 space-y-1">
            <div className="font-semibold text-gray-300 mb-1">Payout Preview</div>
            <div>
              Odds: <span className="text-white">{formatOdds(oddsType, oA, oB)}</span>
            </div>
            <div>
              Side A risks <span className="text-white">${payout.sideAAmountRisked.toFixed(2)}</span> → wins{" "}
              <span className="text-emerald-400">${payout.sideAWinsNet.toFixed(2)}</span>
            </div>
            <div>
              Side B risks <span className="text-white">${payout.sideBAmountRisked.toFixed(2)}</span> → wins{" "}
              <span className="text-emerald-400">${payout.sideBWinsNet.toFixed(2)}</span>
            </div>
          </div>
        )}
      </section>

      {/* Participants */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Participants</h2>

        {/* Side A */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              value={sideALabel}
              onChange={(e) => setSideALabel(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-blue-300 font-semibold text-sm focus:outline-none focus:border-blue-500 w-32"
              placeholder="Side A label"
            />
            <span className="text-gray-500 text-xs">(label is optional)</span>
          </div>
          {sideAParticipants.map((name, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                list="known-names"
                value={name}
                onChange={(e) => {
                  const arr = [...sideAParticipants];
                  arr[i] = e.target.value;
                  setSideAParticipants(arr);
                }}
                placeholder="Participant name"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              />
              {sideAParticipants.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSideAParticipants(sideAParticipants.filter((_, j) => j !== i))}
                  className="px-3 py-2 text-gray-500 hover:text-red-400 text-sm"
                >
                  ×
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

        {/* Side B */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              value={sideBLabel}
              onChange={(e) => setSideBLabel(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-rose-300 font-semibold text-sm focus:outline-none focus:border-rose-500 w-32"
              placeholder="Side B label"
            />
          </div>
          {sideBParticipants.map((name, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                list="known-names"
                value={name}
                onChange={(e) => {
                  const arr = [...sideBParticipants];
                  arr[i] = e.target.value;
                  setSideBParticipants(arr);
                }}
                placeholder="Participant name"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 text-sm"
              />
              {sideBParticipants.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSideBParticipants(sideBParticipants.filter((_, j) => j !== i))}
                  className="px-3 py-2 text-gray-500 hover:text-red-400 text-sm"
                >
                  ×
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
