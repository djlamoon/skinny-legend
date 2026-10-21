import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius } from '../lib/theme';

export default function SnapScreen() {
  const router = useRouter();
  const [uri, setUri] = useState<string | null>(null);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera blocked', 'Let Skinny Legend use the camera in Settings so we can see the plate.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled && result.assets[0]) setUri(result.assets[0].uri);
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos blocked', 'Allow photo access in Settings to pick a meal pic.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled && result.assets[0]) setUri(result.assets[0].uri);
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Show us the plate.</Text>
      <Text style={styles.sub}>Snap it or pick it — we'll do the math, you do the slaying.</Text>

      <View style={styles.preview}>
        {uri ? <Image source={{ uri }} style={styles.image} /> : <Text style={styles.emoji}>🥗</Text>}
      </View>

      <View style={styles.row}>
        <Pressable style={[styles.btn, styles.primary]} onPress={takePhoto}>
          <Text style={styles.btnTextLight}>📸 Camera</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.secondary]} onPress={pickPhoto}>
          <Text style={styles.btnTextDark}>🖼️ Library</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.analyze, !uri && styles.disabled]}
        disabled={!uri}
        onPress={() => uri && router.push({ pathname: '/confirm', params: { uri } })}
      >
        <Text style={styles.btnTextLight}>Analyze ✨</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/confirm')}>
        <Text style={styles.manual}>No photo? Log it manually</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: colors.cream },
  title: { fontSize: 28, fontWeight: '900', color: colors.ink },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 16 },
  preview: {
    flex: 1,
    borderRadius: radius,
    backgroundColor: colors.aquaLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: { width: '100%', height: '100%' },
  emoji: { fontSize: 72 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  btn: { flex: 1, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  primary: { backgroundColor: colors.aquaDark },
  secondary: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.aquaDark },
  analyze: { backgroundColor: colors.cherry, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  disabled: { opacity: 0.4 },
  btnTextLight: { color: colors.white, fontWeight: '800', fontSize: 16 },
  btnTextDark: { color: colors.aquaDark, fontWeight: '800', fontSize: 16 },
  manual: { textAlign: 'center', color: colors.cherry, fontWeight: '700', marginTop: 14 },
});
