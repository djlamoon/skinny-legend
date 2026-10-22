import type { Budget, ChatLocation, OrderPick, Restaurant, RestaurantPick } from "./chat-types";
import { remaining } from "./chat-types";
import type { SearchArgs } from "./yelp-server";

/**
 * MOCK mode for Legend Chat.
 * - No YELP_API_KEY  -> made-up demo restaurants, clearly labeled MOCK.
 * - No XAI_API_KEY   -> rule-based demo picks, clearly labeled MOCK.
 * Nothing here is real restaurant or menu data.
 */

type Cuisine = "bowls" | "mexican" | "sushi" | "mediterranean" | "burgers" | "thai" | "pizza" | "cafe";

const CUISINE_WORDS: Record<Cuisine, string[]> = {
  bowls: ["salad", "bowl", "healthy", "vegan", "vegetarian", "green", "light", "clean"],
  mexican: ["mexican", "taco", "burrito", "tex", "chipotle", "quesadilla"],
  sushi: ["sushi", "japanese", "poke", "ramen", "sashimi", "asian"],
  mediterranean: ["mediterranean", "greek", "shawarma", "falafel", "gyro", "middle eastern", "kebab"],
  burgers: ["burger", "american", "fries", "sandwich", "diner", "chicken"],
  thai: ["thai", "pho", "vietnamese", "noodle", "curry", "indian", "chinese"],
  pizza: ["pizza", "italian", "pasta"],
  cafe: ["coffee", "cafe", "breakfast", "brunch", "sweet", "dessert", "smoothie", "snack", "acai"],
};

const MOCK_SPOTS: (Omit<Restaurant, "url" | "mock" | "address"> & { cuisine: Cuisine; street: string })[] = [
  { id: "mock-pearl-bowl", name: "Pearl Bowl Co.", cuisine: "bowls", emoji: "🥗", categories: ["Salad", "Poke", "Healthy"], rating: 4.6, reviewCount: 812, price: "$$", distanceMeters: 450, street: "101 Glitter Ave" },
  { id: "mock-chrome-cantina", name: "Chrome Cantina", cuisine: "mexican", emoji: "🌮", categories: ["Mexican", "Tacos"], rating: 4.4, reviewCount: 1290, price: "$", distanceMeters: 900, street: "22 Disco Blvd" },
  { id: "mock-sakura-y2k", name: "Sakura Y2K Sushi", cuisine: "sushi", emoji: "🍣", categories: ["Sushi Bars", "Japanese"], rating: 4.7, reviewCount: 640, price: "$$", distanceMeters: 1300, street: "2000 Millennium St" },
  { id: "mock-olive-icon", name: "Olive & Icon", cuisine: "mediterranean", emoji: "🧆", categories: ["Mediterranean", "Greek"], rating: 4.5, reviewCount: 455, price: "$$", distanceMeters: 1700, street: "7 Butterfly Clip Ln" },
  { id: "mock-flip-phone", name: "Flip Phone Burgers", cuisine: "burgers", emoji: "🍔", categories: ["Burgers", "American"], rating: 4.2, reviewCount: 2104, price: "$", distanceMeters: 2100, street: "56 Pager Pkwy" },
  { id: "mock-lip-gloss-thai", name: "Lip Gloss Thai", cuisine: "thai", emoji: "🍜", categories: ["Thai", "Noodles"], rating: 4.5, reviewCount: 733, price: "$$", distanceMeters: 2600, street: "88 Tamagotchi Way" },
  { id: "mock-slice-icon", name: "Slice Icon Pizza", cuisine: "pizza", emoji: "🍕", categories: ["Pizza", "Italian"], rating: 4.3, reviewCount: 980, price: "$", distanceMeters: 3100, street: "404 Dial-Up Dr" },
  { id: "mock-bubble-cafe", name: "Bubble Tea & Toast", cuisine: "cafe", emoji: "🧋", categories: ["Cafes", "Breakfast & Brunch"], rating: 4.4, reviewCount: 377, price: "$", distanceMeters: 650, street: "9 Lava Lamp Ct" },
];

/** [regular, light] option per cuisine. Generic menu items, nutrition = rough estimates. */
const DISHES: Record<Cuisine, [OrderPick, OrderPick]> = {
  bowls: [
    { item: "Grilled chicken power bowl, half rice + half greens", calories: 540, protein: 44, carbs: 48, fat: 18, why: "Big protein, big volume, zero regrets.", hacks: ["Dressing on the side", "Half rice, half greens", "Skip crispy toppings"] },
    { item: "Chicken Caesar salad, light dressing", calories: 380, protein: 36, carbs: 14, fat: 20, why: "Crunchy, filling and featherlight.", hacks: ["Dressing on the side", "Hold the croutons"] },
  ],
  mexican: [
    { item: "Chicken burrito bowl with fajita veggies, black beans & pico", calories: 560, protein: 45, carbs: 55, fat: 16, why: "All the burrito, none of the tortilla.", hacks: ["Skip sour cream & queso", "Salsa instead of dressing", "Light rice"] },
    { item: "2 grilled chicken tacos on corn tortillas", calories: 360, protein: 28, carbs: 34, fat: 12, why: "Tacos that respect the budget.", hacks: ["Corn over flour", "Extra pico, no crema"] },
  ],
  sushi: [
    { item: "Sashimi plate + salmon avocado roll + miso soup", calories: 520, protein: 42, carbs: 52, fat: 14, why: "Lean fish, steady carbs, very main character.", hacks: ["Low-sodium soy", "Skip spicy mayo & tempura"] },
    { item: "Tuna poke bowl, half rice + seaweed salad", calories: 420, protein: 34, carbs: 44, fat: 11, why: "Fresh and filling for fewer calories.", hacks: ["Sauce on the side", "Half rice, extra cucumber"] },
  ],
  mediterranean: [
    { item: "Chicken shawarma plate, extra salad, hummus on the side", calories: 610, protein: 48, carbs: 50, fat: 22, why: "Protein-packed with fiber for days.", hacks: ["Garlic sauce on the side", "Salad instead of fries", "Half pita"] },
    { item: "Chicken souvlaki skewer + Greek salad", calories: 420, protein: 38, carbs: 16, fat: 22, why: "Grilled, fresh, effortlessly snatched.", hacks: ["Feta light", "Lemon over dressing"] },
  ],
  burgers: [
    { item: "Grilled chicken sandwich + side salad", calories: 580, protein: 42, carbs: 48, fat: 22, why: "Burger-joint energy, legend-approved macros.", hacks: ["Mustard over mayo", "Side salad instead of fries"] },
    { item: "Single burger, lettuce-wrapped, no cheese", calories: 390, protein: 28, carbs: 10, fat: 26, why: "The craving, minus the bun drama.", hacks: ["Lettuce wrap", "Pickles & onions are free"] },
  ],
  thai: [
    { item: "Chicken satay + tom yum soup", calories: 480, protein: 38, carbs: 28, fat: 22, why: "Spicy, cozy and protein-forward.", hacks: ["Peanut sauce on the side", "Clear soup over coconut"] },
    { item: "Fresh summer rolls with shrimp + side of steamed veg", calories: 340, protein: 22, carbs: 46, fat: 6, why: "Light, bright and still satisfying.", hacks: ["Dip, don't drench", "Skip fried rolls"] },
  ],
  pizza: [
    { item: "2 slices thin-crust margherita + side salad", calories: 560, protein: 24, carbs: 66, fat: 20, why: "Yes, pizza fits. Thin crust is the cheat code.", hacks: ["Thin crust", "Blot the oil", "Salad first"] },
    { item: "1 slice veggie thin-crust + grilled chicken Caesar", calories: 450, protein: 34, carbs: 36, fat: 18, why: "A slice of joy with a protein side.", hacks: ["Dressing on the side", "Skip garlic knots"] },
  ],
  cafe: [
    { item: "Egg white & turkey sandwich + iced latte with oat milk", calories: 470, protein: 32, carbs: 52, fat: 13, why: "Cute cafe moment that actually fuels you.", hacks: ["Small latte", "Ask for no butter on the bread"] },
    { item: "Greek yogurt parfait + cold brew", calories: 300, protein: 18, carbs: 40, fat: 7, why: "Sweet tooth handled, protein included.", hacks: ["Granola on the side", "Skip the syrup"] },
  ],
};

const FOOD_WORDS = ["eat", "food", "restaurant", "near", "hungry", "lunch", "dinner", "breakfast", "brunch", "snack", "order", "spot", "place", "craving", "takeout", "delivery", "meal", "grab"];

export function wantsFood(text: string) {
  const t = text.toLowerCase();
  return FOOD_WORDS.some((w) => t.includes(w)) || detectCuisine(t) !== null;
}

function detectCuisine(text: string): Cuisine | null {
  const t = text.toLowerCase();
  for (const c of Object.keys(CUISINE_WORDS) as Cuisine[]) {
    if (c === "bowls") continue; // checked last, its words are generic
    if (CUISINE_WORDS[c].some((w) => t.includes(w))) return c;
  }
  return CUISINE_WORDS.bowls.some((w) => t.includes(w)) ? "bowls" : null;
}

function cuisineOf(r: Restaurant): Cuisine {
  const known = MOCK_SPOTS.find((s) => s.id === r.id)?.cuisine;
  if (known) return known;
  const hay = `${r.name} ${r.categories.join(" ")}`;
  return detectCuisine(hay) ?? "bowls";
}

/** Guess Yelp search params from the user's words (used when there is no AI key). */
export function heuristicArgs(text: string): SearchArgs {
  const c = detectCuisine(text);
  const t = text.toLowerCase();
  const term =
    c && c !== "bowls" ? CUISINE_WORDS[c][0] : t.includes("protein") ? "high protein" : t.includes("cheap") ? "cheap healthy food" : "healthy food";
  return { term, sort_by: t.includes("close") || t.includes("closest") ? "distance" : "best_match", open_now: t.includes("now") || undefined };
}

function locLabel(loc?: ChatLocation | null) {
  if (!loc) return "";
  return loc.kind === "text" ? loc.text : loc.label || `${loc.lat.toFixed(3)},${loc.lng.toFixed(3)}`;
}

export function mockRestaurants(args: SearchArgs, loc?: ChatLocation | null, limit = 4): Restaurant[] {
  const want = detectCuisine(`${args.term ?? ""} ${args.categories ?? ""}`);
  const sorted = [...MOCK_SPOTS].sort((a, b) => Number(b.cuisine === want) - Number(a.cuisine === want));
  const where = locLabel(loc);
  return sorted.slice(0, limit).map(({ cuisine, street, ...r }) => ({
    ...r,
    address: `${street}${where && loc?.kind === "text" ? `, ${where}` : ""} (demo)`,
    url: `https://www.yelp.com/search?find_desc=${encodeURIComponent(CUISINE_WORDS[cuisine][0])}${where ? `&find_loc=${encodeURIComponent(where)}` : ""}`,
    mock: true,
  }));
}

export function mockPicks(restaurants: Restaurant[], budget: Budget): RestaurantPick[] {
  const left = remaining(budget).calories;
  const target = left > 0 ? Math.min(Math.max(left * 0.6, 320), 750) : 350;
  return restaurants.map((r) => {
    const [regular, light] = DISHES[cuisineOf(r)];
    const order = regular.calories <= target * 1.1 ? regular : light;
    return { ...r, order: { ...order, hacks: [...order.hacks] } };
  });
}

export function mockReply(budget: Budget, count: number, restaurantsMock: boolean) {
  const left = remaining(budget).calories;
  const lead =
    left <= 0
      ? `You're at your goal today, babe, so these are the lightest legend-approved moves.`
      : left < 500
        ? `${left} kcal left, so we're going light and iconic.`
        : `You've got ${left} kcal left today. Plenty of room to eat like a legend.`;
  const spots = count ? ` Here ${count === 1 ? "is 1 spot" : `are ${count} spots`} and exactly what to order 💅` : "";
  const demo = restaurantsMock ? " (Demo spots, not real restaurants.)" : "";
  return `${lead}${spots}${demo}`;
}

export const MOCK_SMALLTALK = [
  "I'm the Legend, your food bestie 👑 Ask me what to eat nearby and I'll pick spots and the exact order for your macros.",
  "Love that for you. Tell me what you're craving and where you are, and I'll find you something iconic to eat.",
];
