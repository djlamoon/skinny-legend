export type MacroKey =
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "fiber"
  | "sugar"
  | "sodium"
  | "saturatedFat"
  | "cholesterol";

export type Totals = Record<MacroKey, number>;

export type MicroKey = "vitaminA" | "vitaminC" | "vitaminD" | "calcium" | "iron" | "potassium";

export interface Micro {
  amount: number;
  unit: string;
  /** Percent of the FDA Daily Value, 0-100+. */
  dv: number;
}

export type Micros = Record<MicroKey, Micro>;

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AnalysisResult {
  mode: "live" | "mock";
  provider: "xai" | "openai" | "mock";
  model?: string;
  foods: FoodItem[];
  totals: Totals;
  micros: Micros;
  /** 0..1 */
  confidence: number;
  verdict: string;
  /** Set when a live call failed and we fell back to mock data. */
  warning?: string;
}

export interface LoggedMeal {
  id: string;
  loggedAt: string;
  name: string;
  thumb?: string;
  totals: Totals;
  micros: Micros;
}

export const MACRO_META: { key: MacroKey; label: string; unit: string; indent?: boolean }[] = [
  { key: "fat", label: "Total Fat", unit: "g" },
  { key: "saturatedFat", label: "Saturated Fat", unit: "g", indent: true },
  { key: "cholesterol", label: "Cholesterol", unit: "mg" },
  { key: "sodium", label: "Sodium", unit: "mg" },
  { key: "carbs", label: "Total Carbs", unit: "g" },
  { key: "fiber", label: "Dietary Fiber", unit: "g", indent: true },
  { key: "sugar", label: "Total Sugars", unit: "g", indent: true },
  { key: "protein", label: "Protein", unit: "g" },
];

export const MICRO_META: { key: MicroKey; label: string; unit: string; dvAmount: number }[] = [
  { key: "vitaminA", label: "Vitamin A", unit: "mcg", dvAmount: 900 },
  { key: "vitaminC", label: "Vitamin C", unit: "mg", dvAmount: 90 },
  { key: "vitaminD", label: "Vitamin D", unit: "mcg", dvAmount: 20 },
  { key: "calcium", label: "Calcium", unit: "mg", dvAmount: 1300 },
  { key: "iron", label: "Iron", unit: "mg", dvAmount: 18 },
  { key: "potassium", label: "Potassium", unit: "mg", dvAmount: 4700 },
];

/** FDA daily values for the macro rows (used for %DV on the label). */
export const MACRO_DV: Partial<Record<MacroKey, number>> = {
  fat: 78,
  saturatedFat: 20,
  cholesterol: 300,
  sodium: 2300,
  carbs: 275,
  fiber: 28,
  protein: 50,
};

export const EMPTY_TOTALS: Totals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  saturatedFat: 0,
  cholesterol: 0,
};
