"use client";
import type { LoggedMeal } from "./types";

const KEY = "skinny-legend:web:v1";

export interface StoredState {
  goal: number;
  meals: LoggedMeal[];
}

export const DEFAULT_STATE: StoredState = { goal: 2000, meals: [] };

export function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      goal: typeof parsed.goal === "number" && parsed.goal > 0 ? parsed.goal : DEFAULT_STATE.goal,
      meals: Array.isArray(parsed.meals) ? parsed.meals : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: StoredState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded: drop thumbnails from the oldest meals and retry once.
    const slim = { ...state, meals: state.meals.map((m, i) => (i < state.meals.length - 10 ? { ...m, thumb: undefined } : m)) };
    try {
      localStorage.setItem(KEY, JSON.stringify(slim));
    } catch {
      /* give up silently */
    }
  }
}

export const isToday = (iso: string) => {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};
