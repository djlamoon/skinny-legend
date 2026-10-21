# 💅 Skinny Legend

> Snap your plate. Know your macros. Be the Iconic.

Skinny Legend is a photo-first calorie and nutrition tracker. Take a picture of your food, get an instant estimate of calories, protein, carbs and fat, tweak it if the AI got it wrong, and watch your day add up. No endless database searching, just main-character energy.

Built with [Expo](https://expo.dev) (React Native and TypeScript), so it runs on iPhone and Android with **Expo Go**.

## ✨ Features

- **Today screen**: your calories vs. your daily goal, macro progress bars, and a feed of today's meals with photo thumbnails. Long-press a meal to delete it.
- **Snap a meal**: take a photo with the camera or pick one from your library.
- **Analyze**: `analyzeFoodPhoto(uri)` estimates the food name, calories and macros (mocked for now, see below).
- **Confirm and edit**: fix the name, calories, protein, carbs, fat, fiber and sugar before you save. You're the boss.
- **Manual entry**: no photo? Log it by hand.
- **Settings**: set your daily calorie and macro goals.
- **Local-first**: everything is saved on your device with AsyncStorage. No account needed.

## 📸 Screenshots

_Coming soon. Drop images in `docs/screenshots/` and link them here._

| Today | Snap | Confirm |
| ----- | ---- | ------- |
| _TBD_ | _TBD_ | _TBD_ |

## 🚀 Run it

Prereqs: Node 20+ and the **Expo Go** app on your phone.

```bash
npm install
npx expo start
```

Scan the QR code with your phone's camera (iOS) or the Expo Go app (Android). Press `w` to open the web version.

Other handy commands:

```bash
npm run typecheck   # npx tsc --noEmit
npx expo-doctor     # sanity-check dependencies
```

## 🧠 Photo analysis: mock vs. real

All analysis goes through [`src/services/nutrition.ts`](src/services/nutrition.ts):

- `NutritionAnalyzer`: the interface any analyzer implements.
- `MockNutritionAnalyzer`: **MOCK**. It returns example data picked from a small list. The app shows a "MOCK estimate" banner whenever it's used.
- `VisionApiNutritionAnalyzer`: **stub** for a real vision or nutrition API. It reads `EXPO_PUBLIC_NUTRITION_API_KEY` (and optionally `EXPO_PUBLIC_NUTRITION_API_URL`) and has a TODO where the request goes.

To switch, copy `.env.example` to `.env` and set `EXPO_PUBLIC_NUTRITION_PROVIDER=real`. `.env` is git-ignored, so **never commit keys**. Heads-up: `EXPO_PUBLIC_*` values get bundled into the app. In production, call your own backend or proxy that holds the secret.

## 🗂️ Project structure

```
src/
  app/                 # Expo Router screens
    _layout.tsx        # stack navigator + theme
    index.tsx          # Today
    snap.tsx           # camera / library
    confirm.tsx        # analyze + edit + save
    settings.tsx       # goals
  components/          # MacroBar, MealRow
  services/nutrition.ts# analyzer interface, mock, real-API stub
  storage/storage.ts   # AsyncStorage meals + settings
  lib/                 # types, theme, date helpers
```

## 🛣️ Roadmap

- [ ] **Real AI photo analysis** (vision model behind a small backend proxy)
- [ ] **Barcode scan** for packaged foods
- [ ] **Weekly trends**: charts for calories and macros over time
- [ ] **Streaks**: keep the legend era going 🔥
- [ ] Edit past meals and browse previous days
- [ ] Custom app icon and splash in aqua and cherry

## 📄 License

[MIT](LICENSE) © Skinny Legend contributors
