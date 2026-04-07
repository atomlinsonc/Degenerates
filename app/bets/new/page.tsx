import { BetForm } from "@/components/BetForm";

export default function NewBetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">New Bet</h1>
        <p className="text-gray-400 mt-1">Set up a new wager between degens</p>
      </div>
      <BetForm />
    </div>
  );
}
