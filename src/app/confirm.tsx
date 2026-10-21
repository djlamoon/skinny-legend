import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { analyzeFoodPhoto } from '../services/nutrition';
import { addMeal } from '../storage/storage';
import { colors, radius } from '../lib/theme';

interface FormState {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
}

const EMPTY: FormState = { name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '', sugar: '' };

const toNum = (s: string) => {
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
};

export default function ConfirmScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState<boolean>(!!uri);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uri) return;
    let cancelled = false;
    analyzeFoodPhoto(uri)
      .then((est) => {
        if (cancelled) return;
        setSource(est.source);
        setForm({
          name: est.name,
          calories: String(est.calories),
          protein: String(est.protein),
          carbs: String(est.carbs),
          fat: String(est.fat),
          fiber: est.fiber != null ? String(est.fiber) : '',
          sugar: est.sugar != null ? String(est.sugar) : '',
        });
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [uri]);

  const set = (key: keyof FormState) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.name.trim()) {
      Alert.alert('Name it, babe', 'Give this meal a name before saving.');
      return;
    }
    await addMeal({
      name: form.name.trim(),
      calories: toNum(form.calories),
      protein: toNum(form.protein),
      carbs: toNum(form.carbs),
      fat: toNum(form.fat),
      fiber: form.fiber ? toNum(form.fiber) : undefined,
      sugar: form.sugar ? toNum(form.sugar) : undefined,
      photoUri: uri,
    });
    router.dismissTo('/');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.cherry} />
        <Text style={styles.loading}>Reading the plate… judging lovingly. 🔍</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {uri ? <Image source={{ uri }} style={styles.photo} /> : null}

        {source === 'mock' && (
          <Text style={styles.banner}>🧪 MOCK estimate — example data, not real analysis. Edit before saving.</Text>
        )}
        {error && <Text style={[styles.banner, styles.errorBanner]}>Analysis failed: {error} Fill it in yourself, legend.</Text>}

        <Field label="What is it?" value={form.name} onChangeText={set('name')} placeholder="e.g. Iconic salad" />
        <Field label="Calories (kcal)" value={form.calories} onChangeText={set('calories')} numeric />
        <View style={styles.grid}>
          <Field label="Protein (g)" value={form.protein} onChangeText={set('protein')} numeric half />
          <Field label="Carbs (g)" value={form.carbs} onChangeText={set('carbs')} numeric half />
          <Field label="Fat (g)" value={form.fat} onChangeText={set('fat')} numeric half />
          <Field label="Fiber (g)" value={form.fiber} onChangeText={set('fiber')} numeric half />
          <Field label="Sugar (g)" value={form.sugar} onChangeText={set('sugar')} numeric half />
        </View>

        <Pressable style={styles.save} onPress={save}>
          <Text style={styles.saveText}>Log it 💅</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
  half?: boolean;
}) {
  return (
    <View style={[styles.field, props.half && styles.half]}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder ?? '0'}
        placeholderTextColor={colors.muted}
        keyboardType={props.numeric ? 'decimal-pad' : 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  loading: { marginTop: 12, color: colors.muted },
  content: { padding: 20, paddingBottom: 60 },
  photo: { width: '100%', height: 220, borderRadius: radius, marginBottom: 12 },
  banner: {
    backgroundColor: colors.aquaLight,
    color: colors.aquaDark,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    fontWeight: '600',
  },
  errorBanner: { backgroundColor: colors.cherryLight, color: colors.cherry },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  field: { marginBottom: 12 },
  half: { width: '48%' },
  label: { fontWeight: '700', color: colors.ink, marginBottom: 4 },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.aquaLight,
  },
  save: { backgroundColor: colors.cherry, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveText: { color: colors.white, fontWeight: '800', fontSize: 17 },
});
