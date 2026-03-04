# Android Native Map Parity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Switch Android Discover map rendering from WebView to native react-native-maps while keeping iOS on the current WebView renderer and preserving current marker visuals as closely as possible.

**Architecture:** Introduce a platform-specific Android entrypoint that reuses the existing marker grouping and clustering logic, but renders markers via native `MapView` and `Marker` components. Leave the current `DiscoverMap.native.tsx` untouched so iOS continues using the existing WebView renderer.

**Tech Stack:** React Native, Expo, react-native-maps, existing discover clustering hooks and marker asset providers

---

### Task 1: Add Android-specific DiscoverMap renderer

**Files:**
- Create: `components/discover/DiscoverMap.android.tsx`
- Modify: `components/discover/DiscoverMap.native.tsx` (no behavior change expected)

**Step 1: Implement a native Android map renderer**
- Reuse the current overlay marker derivation logic:
  - grouped markers by coordinate
  - `useClusteredFeatures`
  - current compact pin/cluster asset resolvers
- Render markers with `react-native-maps` `Marker` custom children so labels can sit under single markers.

**Step 2: Preserve DiscoverMap camera API**
- Keep `cameraRef`, `onCameraChanged`, `mapCenter`, `mapZoom`, and `initialCamera` behavior compatible with current callers.
- Use native `MapView` region callbacks and `setMapCamera` semantics for cluster zoom-in.

### Task 2: Keep platform split explicit and safe

**Files:**
- Create: `components/discover/DiscoverMap.android.tsx`

**Step 1: Let Android resolve to the new file automatically**
- Do not change iOS or web files.
- Rely on React Native platform resolution so Android uses `DiscoverMap.android.tsx`, iOS uses `DiscoverMap.native.tsx`, and web uses `DiscoverMap.tsx`.

### Task 3: Verify

**Files:**
- Verify only

**Step 1: Run typecheck**
- Run: `npx tsc --noEmit`

**Step 2: Sanity-check platform resolution inputs**
- Confirm the Android file exists and compiles against current imports.

**Step 3: Note runtime gaps**
- Basemap labels can only be approximate on Android native Google maps.
- Final visual parity still needs on-device verification.
