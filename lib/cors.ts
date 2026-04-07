import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://atomlinsonc.github.io",
  "http://localhost:3000",
  ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
];

export function corsHeaders(origin: string | null) {
  const allowed = !origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app");
  return {
    "Access-Control-Allow-Origin": allowed ? (origin ?? "*") : "null",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function withCors(response: NextResponse, origin: string | null): NextResponse {
  const headers = corsHeaders(origin);
  Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

export function optionsResponse(origin: string | null) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
