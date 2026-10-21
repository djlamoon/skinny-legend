import type { AnalysisResult } from "./types";

/** MOCK example data — returned when no API key is configured. NOT a real analysis. */
export const MOCK_RESULTS: Omit<AnalysisResult, "mode" | "provider">[] = [
  {
    foods: [
      { name: "Grilled salmon", portion: "~5 oz fillet", calories: 290, protein: 32, carbs: 0, fat: 17 },
      { name: "Quinoa", portion: "~3/4 cup", calories: 165, protein: 6, carbs: 29, fat: 3 },
      { name: "Roasted asparagus", portion: "~6 spears", calories: 45, protein: 3, carbs: 5, fat: 2 },
    ],
    totals: { calories: 500, protein: 41, carbs: 34, fat: 22, fiber: 6, sugar: 3, sodium: 420, saturatedFat: 4, cholesterol: 85 },
    micros: {
      vitaminA: { amount: 95, unit: "mcg", dv: 11 },
      vitaminC: { amount: 8, unit: "mg", dv: 9 },
      vitaminD: { amount: 14, unit: "mcg", dv: 70 },
      calcium: { amount: 60, unit: "mg", dv: 5 },
      iron: { amount: 3.4, unit: "mg", dv: 19 },
      potassium: { amount: 1050, unit: "mg", dv: 22 },
    },
    confidence: 0.82,
    verdict: "Omega-3s AND protein? You're not dieting, you're curating. 💅",
  },
  {
    foods: [
      { name: "Avocado toast", portion: "1 slice sourdough", calories: 290, protein: 7, carbs: 30, fat: 17 },
      { name: "Fried egg", portion: "1 large", calories: 90, protein: 6, carbs: 0, fat: 7 },
      { name: "Iced oat latte", portion: "16 oz", calories: 170, protein: 3, carbs: 26, fat: 6 },
    ],
    totals: { calories: 550, protein: 16, carbs: 56, fat: 30, fiber: 9, sugar: 16, sodium: 560, saturatedFat: 6, cholesterol: 185 },
    micros: {
      vitaminA: { amount: 120, unit: "mcg", dv: 13 },
      vitaminC: { amount: 11, unit: "mg", dv: 12 },
      vitaminD: { amount: 3, unit: "mcg", dv: 15 },
      calcium: { amount: 380, unit: "mg", dv: 29 },
      iron: { amount: 2.9, unit: "mg", dv: 16 },
      potassium: { amount: 820, unit: "mg", dv: 17 },
    },
    confidence: 0.74,
    verdict: "Brunch-core realness. Add a protein moment and it's a 10.",
  },
];

export function mockAnalysis(seed = 0): AnalysisResult {
  const pick = MOCK_RESULTS[Math.abs(seed) % MOCK_RESULTS.length];
  return { ...structuredClone(pick), mode: "mock", provider: "mock" };
}
