export interface Macros {
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
}

export interface NutritionEstimate extends Macros {
  name: string;
  calories: number; // kcal
  /** 0..1 — how sure the analyzer is. */
  confidence: number;
  /** Where the estimate came from, e.g. "mock" or "vision-api". */
  source: string;
}

export interface Meal extends Macros {
  id: string;
  name: string;
  calories: number;
  photoUri?: string;
  /** ISO timestamp of when the meal was logged. */
  loggedAt: string;
}

export interface Settings {
  dailyCalorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

export const DEFAULT_SETTINGS: Settings = {
  dailyCalorieGoal: 2000,
  proteinGoal: 120,
  carbsGoal: 200,
  fatGoal: 65,
};
