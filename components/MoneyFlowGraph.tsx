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
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export function MoneyFlowGraph({ nodes, edges }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 400 });

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;

    const updateSize = () => {
      setDims((current) => {
        const next = {
          w: el.clientWidth,
          h: Math.min(el.clientWidth * 0.66, 480),
        };

        return current.w === next.w && current.h === next.h ? current : next;
      });
    };

    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    updateSize();

    return () => observer.disconnect();
  }, []);

  const nodePositions: NodePos[] = nodes.map((name, index) => {
    const centerX = dims.w / 2;
    const centerY = dims.h / 2;
    const radius = Math.min(centerX, centerY) * 0.65;
    const angle = (2 * Math.PI * index) / Math.max(nodes.length, 1) - Math.PI / 2;

    return {
      name,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  const maxAmount = Math.max(...edges.map((edge) => edge.amount), 1);
  const posMap: Record<string, NodePos> = {};
  for (const position of nodePositions) {
    posMap[position.name] = position;
  }

  if (nodes.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
        No resolved bets yet - money flow will appear here after bets are settled.
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
        Arrow direction = who has paid whom net of opposite transfers. Thickness = amount.
      </p>
      <svg
        ref={svgRef}
        width={dims.w}
        height={dims.h}
        className="w-full"
        viewBox={`0 0 ${dims.w} ${dims.h}`}
      >
        <defs>
          {COLORS.map((color, index) => (
            <marker
              key={index}
              id={`arrow-${index}`}
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill={color} fillOpacity={0.8} />
            </marker>
          ))}
        </defs>

        {edges.map((edge, index) => {
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

          const strokeWidth = 1.5 + (edge.amount / maxAmount) * 5;
          const colorIndex = nodes.indexOf(edge.from) % COLORS.length;
          const color = COLORS[colorIndex];
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          return (
            <g key={`${edge.from}-${edge.to}-${index}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeOpacity={0.7}
                markerEnd={`url(#arrow-${colorIndex})`}
              />
              <rect
                x={midX - 24}
                y={midY - 10}
                width={48}
                height={18}
                rx={4}
                fill="#111827"
                fillOpacity={0.85}
              />
              <text
                x={midX}
                y={midY + 4}
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

        {nodePositions.map((position, index) => {
          const color = COLORS[index % COLORS.length];
          return (
            <g key={position.name}>
              <circle
                cx={position.x}
                cy={position.y}
                r={nodeRadius}
                fill={color}
                fillOpacity={0.15}
                stroke={color}
                strokeWidth={2}
              />
              <text
                x={position.x}
                y={position.y + 4}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill={color}
              >
                {position.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
