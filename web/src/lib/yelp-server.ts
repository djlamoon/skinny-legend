import "server-only";
import type { ChatLocation, Restaurant } from "./chat-types";

/** Yelp Places (Fusion) API: GET https://api.yelp.com/v3/businesses/search */
export const YELP_SEARCH_URL = "https://api.yelp.com/v3/businesses/search";

export type YelpSort = "best_match" | "rating" | "review_count" | "distance";

export interface SearchArgs {
  term?: string;
  categories?: string;
  sort_by?: YelpSort;
  radius_meters?: number;
  open_now?: boolean;
  /** "1,2" = $ or $$ */
  price?: string;
}

const SORTS: YelpSort[] = ["best_match", "rating", "review_count", "distance"];

/** Coerce untrusted tool-call arguments from the model into safe Yelp params. */
export function cleanArgs(raw: unknown): SearchArgs {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const s = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
  const radius = typeof r.radius_meters === "number" ? r.radius_meters : typeof r.radius === "number" ? r.radius : undefined;
  const cats = s(r.categories, 120)?.toLowerCase().replace(/[^a-z0-9_,]/g, "");
  const price = s(r.price, 10)?.replace(/[^1-4,]/g, "");
  return {
    term: s(r.term, 80),
    categories: cats || undefined,
    sort_by: SORTS.includes(r.sort_by as YelpSort) ? (r.sort_by as YelpSort) : undefined,
    radius_meters: radius ? Math.round(Math.min(Math.max(radius, 500), 40000)) : undefined,
    open_now: typeof r.open_now === "boolean" ? r.open_now : undefined,
    price: price || undefined,
  };
}

interface YelpBusiness {
  id: string;
  name: string;
  url?: string;
  image_url?: string;
  rating?: number;
  review_count?: number;
  price?: string;
  distance?: number;
  categories?: { alias: string; title: string }[];
  location?: { display_address?: string[]; address1?: string; city?: string };
}

export async function yelpSearch(apiKey: string, loc: ChatLocation, args: SearchArgs, limit = 6): Promise<Restaurant[]> {
  const q = new URLSearchParams();
  if (loc.kind === "coords") {
    q.set("latitude", loc.lat.toFixed(5));
    q.set("longitude", loc.lng.toFixed(5));
  } else {
    q.set("location", loc.text.slice(0, 250));
  }
  q.set("term", args.term || "healthy food");
  q.set("categories", args.categories || "restaurants");
  q.set("sort_by", args.sort_by || "best_match");
  q.set("radius", String(args.radius_meters || 4000));
  q.set("limit", String(limit));
  if (args.open_now) q.set("open_now", "true");
  if (args.price) q.set("price", args.price);

  const res = await fetch(`${YELP_SEARCH_URL}?${q}`, {
    headers: { Authorization: `Bearer ${apiKey}`, accept: "application/json" },
    signal: AbortSignal.timeout(9_000),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`Yelp API error ${res.status}: ${detail}`);
  }
  const json = (await res.json()) as { businesses?: YelpBusiness[] };
  return (json.businesses ?? []).slice(0, limit).map((b) => ({
    id: b.id,
    name: b.name,
    rating: b.rating,
    reviewCount: b.review_count,
    price: b.price,
    distanceMeters: typeof b.distance === "number" ? Math.round(b.distance) : undefined,
    address: b.location?.display_address?.join(", ") || [b.location?.address1, b.location?.city].filter(Boolean).join(", "),
    url: b.url || `https://www.yelp.com/biz/${b.id}`,
    imageUrl: b.image_url || undefined,
    categories: (b.categories ?? []).map((c) => c.title).slice(0, 3),
    mock: false,
  }));
}
