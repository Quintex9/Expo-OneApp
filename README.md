# Expo-OneApp

Mobilna Expo aplikacia (React Native) s mapovym Discover flow, detailom prevadzky, feedom,
kartami a profilovou sekciou.

## Aktualny stack

- Expo SDK `54`
- React Native `0.81.5`
- React `19`
- TypeScript
- `react-native-maps`
- `@supabase/supabase-js`
- `i18next` / `react-i18next`

## Poziadavky

- Node.js `>=20.19.4` (podla `package.json`)
- npm
- EAS CLI (`>=16.28.0`) pre cloud buildy
- Android Studio (ak testujes Android emulator)
- Xcode (ak testujes iOS lokalne)

## Instalacia

```bash
git clone https://github.com/Quintex9/Expo-OneApp
cd Expo-OneApp
npm install
```

## Env konfiguracia

1. Vytvor `.env` zo sablony:

```bash
cp .env.example .env
```

2. Dopl� hodnoty:

```env
DATA_SOURCE=mock
API_BASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### Vysvetlenie premennych

- `DATA_SOURCE`: `mock | api | supabase`
- `API_BASE_URL`: endpoint pre API rezim (`DATA_SOURCE=api`)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`: pre Supabase rezim (`DATA_SOURCE=supabase`)
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps key (Android mapa)

Poznamka: Vyber datasource ide cez `lib/config/AppConfig.ts` a `lib/data/index.ts`.

## Spustenie projektu

### Dev server (odporucane pre dev client)

```bash
npx expo start --dev-client -c
```

### Lokalne platform commandy

```bash
npm run android
npm run ios
npm run web
```

## Skripty

### Mapove assety

```bash
npm run generate:badged-icons
npm run generate:full-marker-sprites
```

- `generate:badged-icons`: category + rating piny
- `generate:full-marker-sprites`: full marker sprity (pin + badge + nazov)

### Data kontrakt check

```bash
npm run test:contracts
```

Overi, ze `mock`, `api` a `supabase` datasource vracaju kompatibilny DTO shape.

### Type check

```bash
npx tsc --noEmit
```

## Buildy (EAS)

```bash
npm run build:apk:development
npm run build:apk:preview
npm run build:production
```

Profily su definovane v `eas.json`:

- `development`: dev client APK (internal)
- `preview`: APK (internal)
- `production`: Android App Bundle (AAB)

## Data vrstva (struce)

- DTO modely: `lib/data/models/dto.ts`
- UI modely: `lib/data/models/viewModels.ts`
- Mapper vrstva: `lib/data/mappers/*`
- Selektory: `lib/data/selectors/*`
- Zdroj dat: `lib/data/source.ts` + implementacie `mock/api/supabase`

Tymto je backend integracia oddelena od UI vrstvy a zmena datasource je len konfiguracna.

## Troubleshooting

- Mapa na Androide je prazdna:
  - skontroluj `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` v `.env`
- Zmeny sa neprejavia:
  - restartni bundler: `npx expo start --dev-client -c`
- Chyba datasource:
  - skontroluj `DATA_SOURCE` a suvisiace env premenne
  - spusti `npm run test:contracts`

---

Posledna aktualizacia: 2026-02-15
