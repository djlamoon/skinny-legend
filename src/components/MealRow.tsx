import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Meal } from '../lib/types';
import { colors, radius } from '../lib/theme';
import { formatTime } from '../lib/date';

interface Props {
  meal: Meal;
  onLongPress?: () => void;
}

export function MealRow({ meal, onLongPress }: Props) {
  return (
    <Pressable onLongPress={onLongPress} style={styles.row}>
      {meal.photoUri ? (
        <Image source={{ uri: meal.photoUri }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.placeholder]}>
          <Text style={styles.placeholderText}>🍽️</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {meal.name}
        </Text>
        <Text style={styles.meta}>
          {formatTime(meal.loggedAt)} · P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
        </Text>
      </View>
      <Text style={styles.kcal}>{meal.calories}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius,
    padding: 10,
    marginBottom: 10,
  },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  placeholder: { backgroundColor: colors.aquaLight, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 24 },
  info: { flex: 1, marginHorizontal: 12 },
  name: { fontWeight: '700', fontSize: 16, color: colors.ink },
  meta: { color: colors.muted, marginTop: 2, fontSize: 12 },
  kcal: { fontWeight: '800', fontSize: 16, color: colors.cherry },
});
