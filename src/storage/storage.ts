import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, type Meal, type Settings } from '../lib/types';
import { isSameDay } from '../lib/date';

const MEALS_KEY = 'skinny-legend:meals:v1';
const SETTINGS_KEY = 'skinny-legend:settings:v1';

export async function getMeals(): Promise<Meal[]> {
  const raw = await AsyncStorage.getItem(MEALS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Meal[];
  } catch {
    return [];
  }
}

export async function getMealsForDay(date: Date = new Date()): Promise<Meal[]> {
  const meals = await getMeals();
  return meals
    .filter((m) => isSameDay(m.loggedAt, date))
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

export async function addMeal(meal: Omit<Meal, 'id' | 'loggedAt'>): Promise<Meal> {
  const full: Meal = {
    ...meal,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    loggedAt: new Date().toISOString(),
  };
  const meals = await getMeals();
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify([...meals, full]));
  return full;
}

export async function deleteMeal(id: string): Promise<void> {
  const meals = await getMeals();
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(meals.filter((m) => m.id !== id)));
}

export async function getSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
