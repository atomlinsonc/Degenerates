"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dices } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/bets", label: "Open Bets" },
  { href: "/bets/new", label: "+ New Bet" },
  { href: "/results", label: "Results" },
  { href: "/stats", label: "Stats" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto max-w-7xl px-4 flex items-center gap-6 h-14">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white shrink-0">
          <Dices className="w-6 h-6 text-emerald-400" />
          <span className="hidden sm:inline">Degenerates</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
