import { NextResponse } from "next/server";
import { chatStatus, runLegendChat } from "@/lib/chat-server";
import type { Budget, ChatLocation, ChatRequest, ChatTurn } from "@/lib/chat-types";

export const maxDuration = 60;

/** Lets the UI know which parts are in demo mode (never reveals keys). */
export async function GET() {
  return NextResponse.json(chatStatus());
}

const n = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

function parseLocation(raw: unknown): ChatLocation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.kind === "coords" && typeof r.lat === "number" && typeof r.lng === "number" && Math.abs(r.lat) <= 90 && Math.abs(r.lng) <= 180) {
    return { kind: "coords", lat: r.lat, lng: r.lng, label: typeof r.label === "string" ? r.label.slice(0, 60) : undefined };
  }
  if (r.kind === "text" && typeof r.text === "string" && r.text.trim()) return { kind: "text", text: r.text.trim().slice(0, 120) };
  return null;
}

function parseBudget(raw: unknown): Budget {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, Record<string, unknown> | unknown>;
  const e = (r.eaten ?? {}) as Record<string, unknown>;
  const g = (r.goals ?? {}) as Record<string, unknown>;
  const goal = Math.min(Math.max(n(r.goal, 2000), 800), 10000);
  return {
    goal,
    eaten: { calories: n(e.calories), protein: n(e.protein), carbs: n(e.carbs), fat: n(e.fat) },
    goals: { protein: n(g.protein, Math.round((goal * 0.3) / 4)), carbs: n(g.carbs, Math.round((goal * 0.4) / 4)), fat: n(g.fat, Math.round((goal * 0.3) / 9)) },
  };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Send JSON, babe." }, { status: 400 });
  }
  const messages: ChatTurn[] = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m): m is ChatTurn => !!m && typeof m === "object" && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 800) }));
  if (!messages.length || messages.at(-1)?.role !== "user" || !messages.at(-1)?.content.trim()) {
    return NextResponse.json({ error: "Say something first. I'm listening 👂" }, { status: 400 });
  }
  const req: ChatRequest = {
    messages,
    location: parseLocation(body.location),
    budget: parseBudget(body.budget),
    localTime: typeof body.localTime === "string" ? body.localTime.slice(0, 40) : undefined,
  };
  try {
    return NextResponse.json(await runLegendChat(req));
  } catch (err) {
    console.error("[chat route]", err);
    return NextResponse.json({ error: "The Legend tripped in her platforms. Try again?" }, { status: 502 });
  }
}
