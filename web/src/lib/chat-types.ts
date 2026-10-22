/** Shared types for Legend Chat (client + server). */

export type ChatLocation =
  | { kind: "coords"; lat: number; lng: number; label?: string }
  | { kind: "text"; text: string };

export interface Restaurant {
  id: string;
  name: string;
  rating?: number;
  reviewCount?: number;
  price?: string;
  distanceMeters?: number;
  address: string;
  /** Yelp business page (or a Yelp search link for MOCK spots). */
  url: string;
  imageUrl?: string;
  categories: string[];
  /** True for made-up demo restaurants (no YELP_API_KEY). */
  mock: boolean;
  /** Placeholder art when there is no photo. */
  emoji?: string;
}

/** A recommended order. All nutrition numbers are ESTIMATES (Yelp has no menu nutrition). */
export interface OrderPick {
  item: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  why: string;
  hacks: string[];
}

export interface RestaurantPick extends Restaurant {
  order?: OrderPick;
}

export interface ChatMode {
  /** Where restaurants came from: Yelp, MOCK demo list, or no search this turn. */
  restaurants: "live" | "mock" | "none";
  /** Who wrote the reply + picks: the AI model or the MOCK rules engine. */
  recs: "live" | "mock";
}

/** What the client knows about today (from the localStorage log). */
export interface Budget {
  goal: number;
  eaten: { calories: number; protein: number; carbs: number; fat: number };
  goals: { protein: number; carbs: number; fat: number };
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatTurn[];
  location?: ChatLocation | null;
  budget: Budget;
  /** e.g. "Thursday 2:05 PM" so the Legend knows if it's lunch or a 1am snack. */
  localTime?: string;
}

export interface ChatResponse {
  reply: string;
  picks: RestaurantPick[];
  mode: ChatMode;
  /** Set when a live call failed and we fell back to demo data. */
  warning?: string;
}

export interface ChatStatus {
  yelp: "live" | "mock";
  ai: "live" | "mock";
}

export function remaining(b: Budget) {
  return {
    calories: Math.round(b.goal - b.eaten.calories),
    protein: Math.round(b.goals.protein - b.eaten.protein),
    carbs: Math.round(b.goals.carbs - b.eaten.carbs),
    fat: Math.round(b.goals.fat - b.eaten.fat),
  };
}
