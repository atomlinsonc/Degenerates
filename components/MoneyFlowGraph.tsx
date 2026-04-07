"use client";

import { useEffect, useRef, useState } from "react";
import { MoneyFlowEdge } from "@/lib/types";

interface Props {
  nodes: string[];
  edges: MoneyFlowEdge[];
}

interface NodePos {
  name: string;
  x: number;
  y: number;
}

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

export function MoneyFlowGraph({ nodes, edges }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodePositions, setNodePositions] = useState<NodePos[]>([]);
  const [dims, setDims] = useState({ w: 600, h: 400 });

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setDims({ w: el.clientWidth, h: Math.min(el.clientWidth * 0.66, 480) });
    });
    observer.observe(el);
    setDims({ w: el.clientWidth, h: Math.min(el.clientWidth * 0.66, 480) });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!nodes.length) return;
    const cx = dims.w / 2;
    const cy = dims.h / 2;
    const r = Math.min(cx, cy) * 0.65;

    const positions: NodePos[] = nodes.map((name, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      return {
        name,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });
    setNodePositions(positions);
  }, [nodes, dims]);

  const maxAmount = Math.max(...edges.map((e) => e.amount), 1);
  const posMap: Record<string, NodePos> = {};
  for (const p of nodePositions) posMap[p.name] = p;

  if (nodes.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
        No resolved bets yet — money flow will appear here after bets are settled.
      </div>
    );
  }

  const nodeRadius = Math.max(26, Math.min(38, 200 / nodes.length));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Money Flow Network
      </h3>
      <p className="text-xs text-gray-600 mb-4">
        Arrow direction = who owes whom (net). Thickness = amount.
      </p>
      <svg
        ref={svgRef}
        width={dims.w}
        height={dims.h}
        className="w-full"
        viewBox={`0 0 ${dims.w} ${dims.h}`}
      >
        <defs>
          {COLORS.map((c, i) => (
            <marker
              key={i}
              id={`arrow-${i}`}
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill={c} fillOpacity={0.8} />
            </marker>
          ))}
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const from = posMap[edge.from];
          const to = posMap[edge.to];
          if (!from || !to) return null;

          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / dist;
          const uy = dy / dist;

          const x1 = from.x + ux * nodeRadius;
          const y1 = from.y + uy * nodeRadius;
          const x2 = to.x - ux * (nodeRadius + 8);
          const y2 = to.y - uy * (nodeRadius + 8);

          const strokeW = 1.5 + (edge.amount / maxAmount) * 5;
          const colorIndex = nodes.indexOf(edge.from) % COLORS.length;
          const color = COLORS[colorIndex];

          // midpoint label
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;

          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={strokeW}
                strokeOpacity={0.7}
                markerEnd={`url(#arrow-${colorIndex})`}
              />
              <rect
                x={mx - 24}
                y={my - 10}
                width={48}
                height={18}
                rx={4}
                fill="#111827"
                fillOpacity={0.85}
              />
              <text
                x={mx}
                y={my + 4}
                textAnchor="middle"
                fontSize="11"
                fill={color}
                fontWeight="600"
              >
                ${edge.amount.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodePositions.map((p, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <g key={p.name}>
              <circle
                cx={p.x}
                cy={p.y}
                r={nodeRadius}
                fill={color}
                fillOpacity={0.15}
                stroke={color}
                strokeWidth={2}
              />
              <text
                x={p.x}
                y={p.y + 4}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill={color}
              >
                {p.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
