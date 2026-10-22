import "server-only";
import { getProvider, type Provider } from "./analyze-server";
import { MOCK_SMALLTALK, heuristicArgs, mockPicks, mockReply, mockRestaurants, wantsFood } from "./chat-mock";
import { remaining, type ChatMode, type ChatRequest, type ChatResponse, type OrderPick, type Restaurant, type RestaurantPick } from "./chat-types";
import { extractJson } from "./normalize";
import { cleanArgs, yelpSearch, type SearchArgs } from "./yelp-server";

type LiveProvider = Extract<Provider, { kind: "xai" | "openai" }>;

export function chatStatus() {
  return { yelp: process.env.YELP_API_KEY ? "live" : "mock", ai: getProvider().kind === "mock" ? "mock" : "live" } as const;
}

const PERSONA = `You are "the Legend", the sassy, warm, hype-bestie food guide inside the Skinny Legend app (Y2K, hot pink, chrome).
Voice: playful, confident, supportive, body-positive. Short sentences. One emoji max per message. Never shame food or bodies, never moralize, never give medical advice, never suggest skipping meals or eating below ~1200 kcal/day.`;

const TOOL = {
  type: "function",
  function: {
    name: "search_restaurants",
    description:
      "Search Yelp for restaurants near the user. Call this whenever the user wants food/restaurant/takeout ideas nearby. Pick a term that fits their craving and budget.",
    parameters: {
      type: "object",
      properties: {
        term: { type: "string", description: "Yelp search term, e.g. 'healthy lunch', 'sushi', 'salad', 'high protein bowl', 'tacos'" },
        categories: { type: "string", description: "Optional comma-separated Yelp category aliases, e.g. 'salad,mediterranean,poke'" },
        sort_by: { type: "string", enum: ["best_match", "rating", "review_count", "distance"] },
        radius_meters: { type: "integer", minimum: 500, maximum: 40000, description: "Default ~4000" },
        open_now: { type: "boolean" },
        price: { type: "string", description: "Comma-separated price levels 1-4, e.g. '1,2'" },
      },
      required: ["term"],
    },
  },
} as const;

function budgetLine(req: ChatRequest) {
  const b = req.budget;
  const r = remaining(b);
  return `Daily goal ${b.goal} kcal (protein ${b.goals.protein}g, carbs ${b.goals.carbs}g, fat ${b.goals.fat}g). Eaten today: ${Math.round(b.eaten.calories)} kcal, P ${Math.round(b.eaten.protein)}g, C ${Math.round(b.eaten.carbs)}g, F ${Math.round(b.eaten.fat)}g. Remaining today: ${r.calories} kcal, protein ${r.protein}g, carbs ${r.carbs}g, fat ${r.fat}g.`;
}

function locationLine(req: ChatRequest) {
  const l = req.location;
  if (!l) return "User location: UNKNOWN (they have not shared it).";
  return l.kind === "text" ? `User location: ${l.text}` : `User location: GPS coordinates shared${l.label ? ` (${l.label})` : ""}.`;
}

async function callModel(p: LiveProvider, body: Record<string, unknown>) {
  const model = process.env.CHAT_MODEL || p.model;
  const send = (withEffort: boolean) => {
    const b: Record<string, unknown> = { model, ...body };
    if (p.kind === "xai" && withEffort) b.reasoning_effort = process.env.CHAT_REASONING_EFFORT || process.env.NUTRITION_REASONING_EFFORT || "low";
    return fetch(p.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.apiKey}` },
      body: JSON.stringify(b),
      signal: AbortSignal.timeout(25_000),
    });
  };
  let res = await send(true);
  // Some models reject reasoning_effort; retry once without it.
  if (res.status === 400 && p.kind === "xai") res = await send(false);
  if (!res.ok) throw new Error(`${p.kind} API error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as {
    choices?: { message?: { content?: string | null; tool_calls?: { function?: { name?: string; arguments?: string } }[] } }[];
  };
  return json.choices?.[0]?.message ?? {};
}

const num = (v: unknown, max = 5000) => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.min(Math.round(n), max) : 0;
};
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Merge the model's JSON picks onto the real restaurant data. Restaurant facts always come from Yelp/mock, never the model. */
function mergePicks(raw: unknown, restaurants: Restaurant[]): { reply: string; picks: RestaurantPick[] } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const list = Array.isArray(r.picks) ? r.picks : [];
  const byId = new Map(restaurants.map((x) => [x.id, x]));
  const picks: RestaurantPick[] = [];
  for (const p of list) {
    const o = (p ?? {}) as Record<string, unknown>;
    const rest = byId.get(String(o.id));
    if (!rest || picks.some((x) => x.id === rest.id)) continue;
    const order: OrderPick = {
      item: str(o.item, 140) || "Chef's lightest protein-forward plate",
      calories: num(o.calories),
      protein: num(o.protein, 500),
      carbs: num(o.carbs, 500),
      fat: num(o.fat, 500),
      why: str(o.why, 160),
      hacks: (Array.isArray(o.hacks) ? o.hacks : []).map((h) => str(h, 70)).filter(Boolean).slice(0, 3),
    };
    picks.push({ ...rest, order });
  }
  return { reply: str(r.reply, 600), picks };
}

async function recommend(p: LiveProvider, req: ChatRequest, restaurants: Restaurant[], mock: boolean) {
  const compact = restaurants.map((x) => ({
    id: x.id,
    name: x.name,
    categories: x.categories,
    price: x.price,
    rating: x.rating,
    distance_miles: x.distanceMeters != null ? +(x.distanceMeters / 1609).toFixed(1) : undefined,
  }));
  const convo = req.messages
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Legend"}: ${m.content}`)
    .join("\n");
  const system = `${PERSONA}
You recommend ONE specific, realistic order at each restaurant that fits the user's remaining budget for today.
Base the dish on what that type of restaurant (or that chain's real menu, if it is a well-known chain) typically serves. Do not invent facts about the restaurant itself.
Nutrition is an ESTIMATE for a typical restaurant portion; be realistic, not optimistic. Favor protein and volume. If the remaining budget is low or negative, suggest lighter portions.
Reply with ONLY one JSON object, no markdown:
{"reply": string (max 260 chars, sassy summary that mentions their remaining calories and that numbers are estimates),
 "picks": [ {"id": string (must be an id from the list), "item": string (the exact order), "calories": number, "protein": number, "carbs": number, "fat": number, "why": string (max 90 chars), "hacks": [string, max 3, each max 60 chars, e.g. "Dressing on the side"]} ]}
Include 3-6 picks, best fit first. Skip restaurants that don't fit the request.`;
  const user = `${budgetLine(req)}
Local time: ${req.localTime || "unknown"}.
Conversation:
${convo}

Restaurants${mock ? " (DEMO/MOCK list, not real places)" : " from Yelp"}:
${JSON.stringify(compact)}`;
  const msg = await callModel(p, {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });
  if (!msg.content) throw new Error("Model returned an empty reply");
  const merged = mergePicks(extractJson(msg.content), restaurants);
  if (!merged.picks.length && restaurants.length) throw new Error("Model returned no usable picks");
  return merged;
}

/** Restaurants for this search: Yelp when YELP_API_KEY is set, otherwise MOCK. */
async function findRestaurants(req: ChatRequest, args: SearchArgs) {
  const key = process.env.YELP_API_KEY;
  if (!key) return { restaurants: mockRestaurants(args, req.location), mode: "mock" as const };
  if (!req.location) return { restaurants: [] as Restaurant[], mode: "none" as const, needLocation: true };
  try {
    return { restaurants: await yelpSearch(key, req.location, args), mode: "live" as const };
  } catch (err) {
    console.error("[chat] yelp", err);
    return { restaurants: mockRestaurants(args, req.location), mode: "mock" as const, warning: "Yelp didn't answer, so these are demo spots." };
  }
}

const NEED_LOCATION = "Where are we eating, babe? 📍 Tap “Use my location” or drop a city or zip so I can scope the block.";

async function mockFlow(req: ChatRequest, warning?: string): Promise<ChatResponse> {
  const last = [...req.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!wantsFood(last)) {
    return { reply: MOCK_SMALLTALK[last.length % MOCK_SMALLTALK.length], picks: [], mode: { restaurants: "none", recs: "mock" }, warning };
  }
  const found = await findRestaurants(req, heuristicArgs(last));
  if (found.needLocation) return { reply: NEED_LOCATION, picks: [], mode: { restaurants: "none", recs: "mock" }, warning };
  const picks = mockPicks(found.restaurants, req.budget);
  return {
    reply: mockReply(req.budget, picks.length, found.mode === "mock"),
    picks,
    mode: { restaurants: found.mode, recs: "mock" },
    warning: warning ?? found.warning,
  };
}

export async function runLegendChat(req: ChatRequest): Promise<ChatResponse> {
  const provider = getProvider();
  if (provider.kind === "mock") {
    // MOCK MODE: no AI key configured. Short pause so it feels like a chat, then labeled demo picks.
    await new Promise((r) => setTimeout(r, 900));
    return mockFlow(req);
  }

  try {
    // Step 1: the model decides whether to search, and with which Yelp params (tool calling).
    const system = `${PERSONA}
${budgetLine(req)}
${locationLine(req)}
Local time: ${req.localTime || "unknown"}.
If the user wants food ideas, restaurants or what to order nearby, call search_restaurants once with a well-chosen term (match their craving, time of day and remaining budget).
Otherwise answer in at most 3 short sentences, plain text, no markdown.`;
    const first = await callModel(provider, {
      messages: [{ role: "system", content: system }, ...req.messages.slice(-10)],
      tools: [TOOL],
      tool_choice: "auto",
    });
    const call = first.tool_calls?.find((t) => t.function?.name === "search_restaurants");
    if (!call) {
      return { reply: str(first.content, 800) || MOCK_SMALLTALK[0], picks: [], mode: { restaurants: "none", recs: "live" } };
    }
    let args: SearchArgs = {};
    try {
      args = cleanArgs(JSON.parse(call.function?.arguments || "{}"));
    } catch {
      args = heuristicArgs(req.messages.at(-1)?.content ?? "");
    }

    // Step 2: run Yelp server-side, then ask the model for specific orders at those spots.
    const found = await findRestaurants(req, args);
    if (found.needLocation) return { reply: NEED_LOCATION, picks: [], mode: { restaurants: "none", recs: "live" } };
    if (!found.restaurants.length) {
      return {
        reply: "Yelp came back empty for that one, babe. Try a different craving or a bigger radius ✨",
        picks: [],
        mode: { restaurants: found.mode, recs: "live" },
        warning: found.warning,
      };
    }
    const mode: ChatMode = { restaurants: found.mode, recs: "live" };
    try {
      const { reply, picks } = await recommend(provider, req, found.restaurants, found.mode === "mock");
      return { reply: reply || mockReply(req.budget, picks.length, found.mode === "mock"), picks, mode, warning: found.warning };
    } catch (err) {
      console.error("[chat] recommend", err);
      const picks = mockPicks(found.restaurants, req.budget);
      return {
        reply: mockReply(req.budget, picks.length, found.mode === "mock"),
        picks,
        mode: { ...mode, recs: "mock" },
        warning: "The AI had a moment, so these orders are demo picks.",
      };
    }
  } catch (err) {
    console.error("[chat]", err);
    return mockFlow(req, "The AI had a moment, so you're getting demo picks.");
  }
}
