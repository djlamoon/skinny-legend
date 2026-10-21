import type { NutritionEstimate } from '../lib/types';

/**
 * Anything that can look at a food photo and guess what's on the plate.
 * Swap implementations without touching the UI.
 */
export interface NutritionAnalyzer {
  readonly name: string;
  analyze(photoUri: string): Promise<NutritionEstimate>;
}

// ---------------------------------------------------------------------------
// MOCK IMPLEMENTATION — returns canned example data. NOT real analysis.
// ---------------------------------------------------------------------------

const MOCK_FOODS: Omit<NutritionEstimate, 'confidence' | 'source'>[] = [
  { name: 'Avocado toast with egg', calories: 390, protein: 15, carbs: 32, fat: 23, fiber: 9, sugar: 3 },
  { name: 'Grilled chicken salad', calories: 420, protein: 38, carbs: 14, fat: 22, fiber: 5, sugar: 6 },
  { name: 'Salmon poke bowl', calories: 610, protein: 34, carbs: 68, fat: 20, fiber: 6, sugar: 9 },
  { name: 'Greek yogurt parfait', calories: 280, protein: 18, carbs: 36, fat: 7, fiber: 3, sugar: 22 },
  { name: 'Margherita pizza (2 slices)', calories: 540, protein: 22, carbs: 64, fat: 21, fiber: 4, sugar: 7 },
  { name: 'Iced oat milk latte', calories: 160, protein: 3, carbs: 24, fat: 6, fiber: 2, sugar: 14 },
];

export class MockNutritionAnalyzer implements NutritionAnalyzer {
  readonly name = 'mock';

  async analyze(photoUri: string): Promise<NutritionEstimate> {
    // Pretend we're thinking very hard.
    await new Promise((resolve) => setTimeout(resolve, 900));
    // Deterministic-ish pick so the same photo gives the same answer.
    let hash = 0;
    for (let i = 0; i < photoUri.length; i++) hash = (hash * 31 + photoUri.charCodeAt(i)) | 0;
    const food = MOCK_FOODS[Math.abs(hash) % MOCK_FOODS.length];
    return { ...food, confidence: 0.42, source: 'mock' };
  }
}

// ---------------------------------------------------------------------------
// REAL VISION API — stub. Wire up your provider of choice here.
// ---------------------------------------------------------------------------

export class VisionApiNutritionAnalyzer implements NutritionAnalyzer {
  readonly name = 'vision-api';

  constructor(
    private readonly apiKey: string,
    private readonly apiUrl?: string,
  ) {}

  async analyze(_photoUri: string): Promise<NutritionEstimate> {
    if (!this.apiKey) {
      throw new Error('Missing EXPO_PUBLIC_NUTRITION_API_KEY. Add it to your .env (never commit it).');
    }
    // TODO: Implement real photo analysis.
    //  1. Read the image (e.g. expo-file-system / fetch(uri).blob()) and resize/compress it.
    //  2. POST it to a vision model or nutrition API at `this.apiUrl` with `this.apiKey`.
    //  3. Map the response into a NutritionEstimate { name, calories, protein, carbs, fat, ... }.
    //  NOTE: EXPO_PUBLIC_* vars are bundled into the app. For production, call your own
    //  backend/proxy that holds the secret instead of shipping a raw provider key.
    void this.apiUrl;
    throw new Error('VisionApiNutritionAnalyzer is not implemented yet (TODO).');
  }
}

// ---------------------------------------------------------------------------
// Factory + public entry point
// ---------------------------------------------------------------------------

export function getNutritionAnalyzer(): NutritionAnalyzer {
  const provider = process.env.EXPO_PUBLIC_NUTRITION_PROVIDER ?? 'mock';
  if (provider === 'real') {
    return new VisionApiNutritionAnalyzer(
      process.env.EXPO_PUBLIC_NUTRITION_API_KEY ?? '',
      process.env.EXPO_PUBLIC_NUTRITION_API_URL,
    );
  }
  return new MockNutritionAnalyzer();
}

/** Analyze a food photo and return an editable nutrition estimate. */
export async function analyzeFoodPhoto(uri: string): Promise<NutritionEstimate> {
  return getNutritionAnalyzer().analyze(uri);
}
