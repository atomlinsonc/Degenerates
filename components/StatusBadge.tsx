import { BetStatus } from "@/lib/types";

const config: Record<BetStatus, { label: string; classes: string }> = {
  OPEN: {
    label: "OPEN",
    classes: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  },
  RESOLVED: {
    label: "RESOLVED",
    classes: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  },
  CANCELLED: {
    label: "CANCELLED",
    classes: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  },
};

export function StatusBadge({ status }: { status: BetStatus }) {
  const { label, classes } = config[status] ?? config.OPEN;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${classes}`}>
      {label}
    </span>
  );
}
