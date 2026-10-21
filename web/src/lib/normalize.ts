import {
  EMPTY_TOTALS,
  MICRO_META,
  type AnalysisResult,
  type FoodItem,
  type MacroKey,
  type Micros,
  type Totals,
} from "./types";

const num = (v: unknown, max = 100000): number => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.round(n * 10) / 10, max);
};

const str = (v: unknown, fallback: string, maxLen = 120): string =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, maxLen) : fallback;

/** Pull the first JSON object out of a model reply (handles ```json fences and chatter). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Model reply did not contain JSON");
  return JSON.parse(body.slice(start, end + 1));
}

/** Validate + coerce untrusted model output into our schema. Throws if it's unusable. */
export function normalizeAnalysis(
  raw: unknown,
  meta: Pick<AnalysisResult, "mode" | "provider" | "model">,
): AnalysisResult {
  if (!raw || typeof raw !== "object") throw new Error("Analysis is not an object");
  const r = raw as Record<string, unknown>;

  const foodsRaw = Array.isArray(r.foods) ? r.foods : [];
  const foods: FoodItem[] = foodsRaw.slice(0, 12).map((f) => {
    const o = (f ?? {}) as Record<string, unknown>;
    return {
      name: str(o.name, "Mystery bite"),
      portion: str(o.portion ?? o.portion_estimate ?? o.portionEstimate, "1 serving"),
      calories: num(o.calories, 10000),
      protein: num(o.protein),
      carbs: num(o.carbs),
      fat: num(o.fat),
    };
  });

  const t = (r.totals ?? {}) as Record<string, unknown>;
  const alias: Record<MacroKey, string[]> = {
    calories: ["calories", "kcal"],
    protein: ["protein", "protein_g"],
    carbs: ["carbs", "carbohydrates", "carbs_g"],
    fat: ["fat", "total_fat", "fat_g"],
    fiber: ["fiber", "fiber_g"],
    sugar: ["sugar", "sugars", "sugar_g"],
    sodium: ["sodium", "sodium_mg"],
    saturatedFat: ["saturatedFat", "saturated_fat", "saturated_fat_g"],
    cholesterol: ["cholesterol", "cholesterol_mg"],
  };
  const totals: Totals = { ...EMPTY_TOTALS };
  (Object.keys(alias) as MacroKey[]).forEach((k) => {
    const hit = alias[k].find((a) => t[a] != null);
    totals[k] = hit ? num(t[hit]) : 0;
  });
  // If the model forgot totals, sum the foods.
  if (!totals.calories && foods.length) {
    for (const f of foods) {
      totals.calories += f.calories;
      totals.protein += f.protein;
      totals.carbs += f.carbs;
      totals.fat += f.fat;
    }
  }

  const m = (r.micros ?? r.vitamins_minerals ?? r.micronutrients ?? {}) as Record<string, unknown>;
  const micros = {} as Micros;
  for (const meta of MICRO_META) {
    const snake = meta.key.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
    const v = (m[meta.key] ?? m[snake] ?? {}) as Record<string, unknown> | number;
    const amount = typeof v === "number" ? num(v) : num(v.amount);
    const dvRaw = typeof v === "number" ? NaN : num(v.dv ?? v.percent_dv ?? v.dv_percent, 1000);
    const dv = dvRaw || Math.round((amount / meta.dvAmount) * 100);
    micros[meta.key] = { amount, unit: meta.unit, dv };
  }

  const confRaw = typeof r.confidence === "number" ? r.confidence : parseFloat(String(r.confidence));
  const confidence = Number.isFinite(confRaw) ? Math.max(0, Math.min(confRaw > 1 ? confRaw / 100 : confRaw, 1)) : 0.5;

  if (!foods.length && !totals.calories) throw new Error("Analysis had no foods or calories");

  return {
    ...meta,
    foods,
    totals,
    micros,
    confidence,
    verdict: str(r.verdict, "Looks delish. Log it and keep slaying.", 200),
  };
}
