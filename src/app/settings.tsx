import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getSettings, saveSettings } from '../storage/storage';
import { DEFAULT_SETTINGS, type Settings } from '../lib/types';
import { colors, radius } from '../lib/theme';

type Key = keyof Settings;
const FIELDS: { key: Key; label: string }[] = [
  { key: 'dailyCalorieGoal', label: 'Daily calorie goal (kcal)' },
  { key: 'proteinGoal', label: 'Protein goal (g)' },
  { key: 'carbsGoal', label: 'Carbs goal (g)' },
  { key: 'fatGoal', label: 'Fat goal (g)' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const [values, setValues] = useState<Record<Key, string>>(() => toStrings(DEFAULT_SETTINGS));

  useEffect(() => {
    getSettings().then((s) => setValues(toStrings(s)));
  }, []);

  const save = async () => {
    const parsed = {} as Settings;
    for (const { key, label } of FIELDS) {
      const n = Math.round(Number(values[key]));
      if (!Number.isFinite(n) || n <= 0) {
        Alert.alert('Hmm', `${label} needs to be a positive number.`);
        return;
      }
      parsed[key] = n;
    }
    await saveSettings(parsed);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Set the bar, legend.</Text>
      <Text style={styles.sub}>Pick goals that make you feel unstoppable, not miserable.</Text>
      <View style={styles.card}>
        {FIELDS.map(({ key, label }) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={values[key]}
              onChangeText={(v) => setValues((s) => ({ ...s, [key]: v }))}
            />
          </View>
        ))}
      </View>
      <Pressable style={styles.save} onPress={save}>
        <Text style={styles.saveText}>Save goals</Text>
      </Pressable>
    </ScrollView>
  );
}

function toStrings(s: Settings): Record<Key, string> {
  return {
    dailyCalorieGoal: String(s.dailyCalorieGoal),
    proteinGoal: String(s.proteinGoal),
    carbsGoal: String(s.carbsGoal),
    fatGoal: String(s.fatGoal),
  };
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: colors.white, borderRadius: radius, padding: 16, marginBottom: 16 },
  field: { marginBottom: 12 },
  label: { fontWeight: '700', color: colors.ink, marginBottom: 4 },
  input: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.ink,
  },
  save: { backgroundColor: colors.cherry, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  saveText: { color: colors.white, fontWeight: '800', fontSize: 17 },
});
