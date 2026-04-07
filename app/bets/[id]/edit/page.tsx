"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BetForm } from "@/components/BetForm";
import { BetData } from "@/lib/types";
import { apiUrl } from "@/lib/api";

export default function EditBetPage() {
  const { id } = useParams<{ id: string }>();
  const [bet, setBet] = useState<BetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(apiUrl(`/api/bets/${id}`))
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setBet(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-900 rounded animate-pulse w-48" />
        <div className="h-64 bg-gray-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (notFound || !bet) {
    return <div className="text-center py-20 text-gray-400">Bet not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Edit Bet</h1>
        <p className="text-gray-400 mt-1">{bet.title}</p>
      </div>
      <BetForm existing={bet} />
    </div>
  );
}
