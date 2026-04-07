"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Trash2, Pencil, CheckCircle, Users } from "lucide-react";
import { BetData } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { formatOdds } from "@/lib/odds";
import { apiUrl } from "@/lib/api";

interface Props {
  bet: BetData;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export function BetCard({ bet, onDelete, showActions = true }: Props) {
  const sideA = bet.participants.filter((p) => p.side === "A");
  const sideB = bet.participants.filter((p) => p.side === "B");

  const handleDelete = async () => {
    if (!confirm(`Delete "${bet.title}"? This cannot be undone.`)) return;
    const res = await fetch(apiUrl(`/api/bets/${bet.id}`), { method: "DELETE" });
    if (res.ok) {
      onDelete?.(bet.id);
    } else {
      alert("Failed to delete bet.");
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge status={bet.status} />
            <span className="text-xs text-gray-500">{format(new Date(bet.createdAt), "MMM d, yyyy")}</span>
          </div>
          <h3 className="font-semibold text-white text-lg leading-snug">{bet.title}</h3>
          {bet.description && (
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{bet.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-emerald-400">${bet.stakeAmount.toFixed(0)}</div>
          <div className="text-xs text-gray-500">{formatOdds(bet.oddsType, bet.oddsValueA, bet.oddsValueB)}</div>
        </div>
      </div>

      {/* Sides */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
            {bet.sideALabel}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            {sideA.map((p) => (
              <span key={p.id} className="text-sm font-medium text-blue-300">{p.participantName}</span>
            ))}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
            {bet.sideBLabel}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Users className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            {sideB.map((p) => (
              <span key={p.id} className="text-sm font-medium text-rose-300">{p.participantName}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Dates */}
      {(bet.eventDate || bet.resolutionDate) && (
        <div className="flex gap-4 text-xs text-gray-500">
          {bet.eventDate && (
            <span>Event: {format(new Date(bet.eventDate), "MMM d, yyyy")}</span>
          )}
          {bet.resolutionDate && (
            <span>Resolves: {format(new Date(bet.resolutionDate), "MMM d, yyyy")}</span>
          )}
        </div>
      )}

      {/* Resolution result */}
      {bet.status === "RESOLVED" && bet.resolution && (
        <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-lg p-3">
          <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wide mb-1">Result</div>
          <div className="text-sm text-gray-300">
            <span className="font-medium text-white">
              {bet.resolution.winningSide === "A"
                ? sideA.map((p) => p.participantName).join(", ")
                : sideB.map((p) => p.participantName).join(", ")}
            </span>{" "}
            won
            {bet.resolution.moneyTransfers.length > 0 && (
              <span className="text-gray-400">
                {" "}— {bet.resolution.moneyTransfers.map((t) => `${t.fromName} → ${t.toName} $${t.amount.toFixed(2)}`).join(", ")}
              </span>
            )}
          </div>
          {bet.resolution.verifiedBy && (
            <div className="text-xs text-gray-500 mt-1">Verified by {bet.resolution.verifiedBy}</div>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 pt-1">
          {bet.status === "OPEN" && (
            <>
              <Link
                href={`/bets/${bet.id}/resolve`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Resolve
              </Link>
              <Link
                href={`/bets/${bet.id}/edit`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-lg transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Link>
            </>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-300 text-sm font-medium rounded-lg transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
