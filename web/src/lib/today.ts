"use client";
import { isToday, type StoredState } from "./storage";
import { EMPTY_TOTALS, type Totals } from "./types";

/** Today's meals, totals and macro goals (30/40/30 split of the calorie goal). */
export function todaySummary(state: StoredState) {
  const meals = state.meals.filter((m) => isToday(m.loggedAt)).sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  const totals: Totals = meals.reduce(
    (acc, m) => {
      (Object.keys(acc) as (keyof Totals)[]).forEach((k) => (acc[k] += m.totals[k] || 0));
      return acc;
    },
    { ...EMPTY_TOTALS },
  );
  const goal = state.goal;
  return {
    meals,
    totals,
    goal,
    left: Math.round(goal - totals.calories),
    proteinGoal: Math.round((goal * 0.3) / 4),
    carbsGoal: Math.round((goal * 0.4) / 4),
    fatGoal: Math.round((goal * 0.3) / 9),
  };
}
