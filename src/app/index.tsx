import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { MacroBar } from '../components/MacroBar';
import { MealRow } from '../components/MealRow';
import { deleteMeal, getMealsForDay, getSettings } from '../storage/storage';
import { DEFAULT_SETTINGS, type Meal, type Settings } from '../lib/types';
import { colors, macroColors, radius } from '../lib/theme';

function vibeCheck(eaten: number, goal: number): string {
  if (eaten === 0) return "Plate's empty, babe. Snap something iconic.";
  const pct = eaten / goal;
  if (pct < 0.5) return 'Warming up. The legend is loading…';
  if (pct < 0.9) return 'On track and looking snatched. ✨';
  if (pct <= 1.05) return 'Goal hit. Certified skinny legend. 👑';
  return 'Over goal — legends have cheat days too. 💅';
}

export default function TodayScreen() {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const load = useCallback(async () => {
    const [m, s] = await Promise.all([getMealsForDay(), getSettings()]);
    setMeals(m);
    setSettings(s);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const goal = settings.dailyCalorieGoal;
  const remaining = goal - totals.calories;
  const pct = goal > 0 ? Math.min(totals.calories / goal, 1) : 0;

  const confirmDelete = (meal: Meal) =>
    Alert.alert('Delete meal?', `Erase "${meal.name}" from history?`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMeal(meal.id);
          load();
        },
      },
    ]);

  return (
    <View style={styles.screen}>
      <FlatList
        data={meals}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.card}>
              <Text style={styles.kicker}>TODAY</Text>
              <Text style={styles.big}>
                {totals.calories}
                <Text style={styles.bigSub}> / {goal} kcal</Text>
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${pct * 100}%`,
                      backgroundColor: remaining < 0 ? colors.cherry : colors.aqua,
                    },
                  ]}
                />
              </View>
              <Text style={styles.remaining}>
                {remaining >= 0 ? `${remaining} kcal left` : `${-remaining} kcal over`}
              </Text>
              <Text style={styles.vibe}>{vibeCheck(totals.calories, goal)}</Text>
            </View>

            <View style={styles.card}>
              <MacroBar label="Protein" value={totals.protein} goal={settings.proteinGoal} color={macroColors.protein} />
              <MacroBar label="Carbs" value={totals.carbs} goal={settings.carbsGoal} color={macroColors.carbs} />
              <MacroBar label="Fat" value={totals.fat} goal={settings.fatGoal} color={macroColors.fat} />
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.section}>Today's meals</Text>
              <Link href="/settings" style={styles.link}>
                Settings
              </Link>
            </View>
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>Nothing logged yet. The camera is right there. 👀</Text>}
        renderItem={({ item }) => <MealRow meal={item} onLongPress={() => confirmDelete(item)} />}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/snap')}>
        <Text style={styles.fabText}>📸 Snap a meal</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 16, paddingBottom: 120 },
  card: { backgroundColor: colors.white, borderRadius: radius, padding: 16, marginBottom: 14 },
  kicker: { color: colors.aquaDark, fontWeight: '800', letterSpacing: 2, fontSize: 12 },
  big: { fontSize: 40, fontWeight: '900', color: colors.ink, marginTop: 4 },
  bigSub: { fontSize: 16, fontWeight: '600', color: colors.muted },
  track: { height: 14, borderRadius: 7, backgroundColor: colors.aquaLight, overflow: 'hidden', marginTop: 10 },
  fill: { height: '100%', borderRadius: 7 },
  remaining: { marginTop: 8, fontWeight: '700', color: colors.ink },
  vibe: { marginTop: 4, color: colors.cherry, fontStyle: 'italic' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  section: { fontSize: 18, fontWeight: '800', color: colors.ink },
  link: { color: colors.cherry, fontWeight: '700' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 20 },
  fab: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    backgroundColor: colors.cherry,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  fabText: { color: colors.white, fontWeight: '800', fontSize: 17 },
});
