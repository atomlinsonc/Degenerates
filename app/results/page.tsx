"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Download, Filter, RefreshCw, Search } from "lucide-react";
import { BetData } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { formatOdds } from "@/lib/odds";
import { apiUrl } from "@/lib/api";

export default function ResultsPage() {
  const [bets, setBets] = useState<BetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("RESOLVED");
  const [participantFilter, setParticipantFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);

  const fetchBets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      if (participantFilter) params.set("participant", participantFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const response = await fetch(apiUrl(`/api/results?${params.toString()}`));
      const data = await response.json();
      setBets(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, participantFilter, fromDate, toDate]);

  useEffect(() => {
    fetch(apiUrl("/api/participants"))
      .then((response) => response.json())
      .then((data: { name: string }[]) => setParticipants(data.map((participant) => participant.name)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchBets, 300);
    return () => clearTimeout(timer);
  }, [fetchBets]);

  const exportHref = apiUrl(
    `/api/results/export?${new URLSearchParams({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
      ...(participantFilter ? { participant: participantFilter } : {}),
      ...(fromDate ? { from: fromDate } : {}),
      ...(toDate ? { to: toDate } : {}),
    }).toString()}`
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Results and History</h1>
          <p className="text-gray-400 mt-1">{bets.length} bet{bets.length !== 1 ? "s" : ""} found</p>
        </div>
        <div className="flex gap-3">
          <a
            href={exportHref}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
          <button
            onClick={fetchBets}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Results
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Filter className="w-4 h-4" />
          Filters:
        </div>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search bets..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={participantFilter}
          onChange={(event) => setParticipantFilter(event.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
        >
          <option value="">All Participants</option>
          {participants.map((participant) => (
            <option key={participant} value={participant}>
              {participant}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(event) => setFromDate(event.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
        />
        <input
          type="date"
          value={toDate}
          onChange={(event) => setToDate(event.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : bets.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No results found.</div>
      ) : (
        <div className="space-y-3">
          {bets.map((bet) => (
            <ResultRow key={bet.id} bet={bet} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResultRow({ bet }: { bet: BetData }) {
  const sideA = bet.participants.filter((participant) => participant.side === "A");
  const sideB = bet.participants.filter((participant) => participant.side === "B");
  const resolution = bet.resolution;

  let winnerLabel = "";
  let loserLabel = "";

  if (resolution) {
    const winners = resolution.winningSide === "A" ? sideA : sideB;
    const losers = resolution.winningSide === "A" ? sideB : sideA;
    winnerLabel = winners.map((participant) => participant.participantName).join(", ");
    loserLabel = losers.map((participant) => participant.participantName).join(", ");
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge status={bet.status} />
            <span className="text-xs text-gray-500">{format(new Date(bet.createdAt), "MMM d, yyyy")}</span>
          </div>
          <h3 className="font-semibold text-white">{bet.title}</h3>
          {bet.description && (
            <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{bet.description}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <div>
              <span className="text-gray-500 text-xs">Side A: </span>
              <span className="text-blue-300">{sideA.map((participant) => participant.participantName).join(", ")}</span>
              <span className="text-gray-500 text-xs"> ({bet.sideALabel})</span>
            </div>
            <span className="text-gray-700">vs</span>
            <div>
              <span className="text-gray-500 text-xs">Side B: </span>
              <span className="text-rose-300">{sideB.map((participant) => participant.participantName).join(", ")}</span>
              <span className="text-gray-500 text-xs"> ({bet.sideBLabel})</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xl font-bold text-white">${bet.stakeAmount.toFixed(0)}</div>
          <div className="text-xs text-gray-500">{formatOdds(bet.oddsType, bet.oddsValueA, bet.oddsValueB)}</div>
          {bet.resolution?.resolvedAt && (
            <div className="text-xs text-gray-600 mt-1">
              Resolved {format(new Date(bet.resolution.resolvedAt), "MMM d")}
            </div>
          )}
        </div>
      </div>

      {resolution && (
        <div className="mt-3 pt-3 border-t border-gray-800 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <div>
            <span className="text-gray-500">Winner: </span>
            <span className="text-emerald-300 font-semibold">{winnerLabel}</span>
          </div>
          <div>
            <span className="text-gray-500">Loser: </span>
            <span className="text-rose-300">{loserLabel}</span>
          </div>
          {resolution.moneyTransfers.map((transfer) => (
            <div key={transfer.id} className="text-gray-400 text-xs">
              {transfer.fromName} -&gt; {transfer.toName}: <span className="text-white">${transfer.amount.toFixed(2)}</span>
            </div>
          ))}
          {resolution.verifiedBy && (
            <div className="text-xs text-gray-600 ml-auto">Verified by {resolution.verifiedBy}</div>
          )}
          {resolution.resolvedAt && (
            <div className="text-xs text-gray-600">
              {format(new Date(resolution.resolvedAt), "MMM d, yyyy")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
