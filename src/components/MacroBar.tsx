import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

interface Props {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, value, goal, color, unit = 'g' }: Props) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {Math.round(value)}
          {unit} / {goal}
          {unit}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontWeight: '700', color: colors.ink },
  value: { color: colors.muted, fontVariant: ['tabular-nums'] },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.aquaLight, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
});
