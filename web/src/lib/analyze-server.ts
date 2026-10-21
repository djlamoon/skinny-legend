import "server-only";
import { extractJson, normalizeAnalysis } from "./normalize";
import type { AnalysisResult } from "./types";

export const DEFAULT_XAI_MODEL = "grok-4.7";
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export type Provider = { kind: "xai" | "openai"; apiKey: string; model: string; url: string } | { kind: "mock" };

export function getProvider(): Provider {
  if (process.env.XAI_API_KEY) {
    return {
      kind: "xai",
      apiKey: process.env.XAI_API_KEY,
      model: process.env.NUTRITION_MODEL || DEFAULT_XAI_MODEL,
      url: "https://api.x.ai/v1/chat/completions",
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      kind: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_NUTRITION_MODEL || DEFAULT_OPENAI_MODEL,
      url: "https://api.openai.com/v1/chat/completions",
    };
  }
  return { kind: "mock" };
}

const SYSTEM_PROMPT = `You are a registered-dietitian-grade food recognition engine for an app called Skinny Legend.
Look at the meal photo, identify each distinct food, estimate portion sizes from visual cues (plate size, utensils, hands), and estimate nutrition.
Reply with ONLY a single JSON object, no markdown, matching exactly this schema:
{
  "foods": [ { "name": string, "portion": string (e.g. "~1 cup", "1 medium"), "calories": number, "protein": number, "carbs": number, "fat": number } ],
  "totals": { "calories": number (kcal), "protein": number (g), "carbs": number (g), "fat": number (g), "fiber": number (g), "sugar": number (g), "sodium": number (mg), "saturatedFat": number (g), "cholesterol": number (mg) },
  "micros": {
    "vitaminA": { "amount": number, "unit": "mcg", "dv": number },
    "vitaminC": { "amount": number, "unit": "mg", "dv": number },
    "vitaminD": { "amount": number, "unit": "mcg", "dv": number },
    "calcium": { "amount": number, "unit": "mg", "dv": number },
    "iron": { "amount": number, "unit": "mg", "dv": number },
    "potassium": { "amount": number, "unit": "mg", "dv": number }
  },
  "confidence": number between 0 and 1,
  "verdict": string (one short, sassy, body-positive, encouraging line, max 120 chars, may include one emoji)
}
"dv" is percent of the FDA Daily Value (e.g. 25 means 25%). Totals must equal the sum over all foods for calories/protein/carbs/fat.
If the image contains no food, return "foods": [], zeros for all numbers, confidence 0, and a playful verdict asking for a food pic.
Never shame the user. Never give medical advice.`;

async function callChat(p: Extract<Provider, { kind: "xai" | "openai" }>, dataUrl: string, withEffort: boolean) {
  const body: Record<string, unknown> = {
    model: p.model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          { type: "text", text: "Analyze this meal and return the JSON." },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  };
  if (p.kind === "xai") {
    body.temperature = undefined;
    if (withEffort) body.reasoning_effort = process.env.NUTRITION_REASONING_EFFORT || "low";
  }
  return fetch(p.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(55_000),
  });
}

export async function analyzeWithModel(
  p: Extract<Provider, { kind: "xai" | "openai" }>,
  dataUrl: string,
): Promise<AnalysisResult> {
  let res = await callChat(p, dataUrl, true);
  // Some models reject reasoning_effort; retry once without it.
  if (res.status === 400 && p.kind === "xai") res = await callChat(p, dataUrl, false);
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`${p.kind} API error ${res.status}: ${detail}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Model returned an empty reply");
  return normalizeAnalysis(extractJson(content), { mode: "live", provider: p.kind, model: p.model });
}
