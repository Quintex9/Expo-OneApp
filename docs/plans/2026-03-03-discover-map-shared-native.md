# Discover Map Shared Native Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Collapse the Discover map mobile implementation into one shared native file and remove unused platform-specific files.

**Architecture:** Move the current shared mobile renderer into `DiscoverMap.native.tsx` so Metro resolves the same implementation on both iOS and Android. Keep `DiscoverMap.tsx` as the web-only fallback and delete obsolete wrappers and dead legacy code.

**Tech Stack:** React Native platform-specific resolution, TypeScript, Expo 54, `react-native-webview`

---

### Task 1: Remove redundant DiscoverMap wrappers

**Files:**
- Create: `docs/plans/2026-03-03-discover-map-shared-native-design.md`
- Modify: `components/discover/DiscoverMap.native.tsx`
- Delete: `components/discover/DiscoverMap.android.tsx`
- Delete: `components/discover/DiscoverMap.ios.tsx`
- Delete: `components/discover/DiscoverMapLegacy.native.tsx`

**Step 1: Write the failing structural check**

Run: `Get-ChildItem -Path 'components\discover' -File | Where-Object { $_.Name -like 'DiscoverMap*' } | Select-Object Name`
Expected: wrapper files (`DiscoverMap.android.tsx`, `DiscoverMap.ios.tsx`) and the unused legacy renderer still exist.

**Step 2: Apply the refactor**

Move the shared renderer from `DiscoverMap.ios.tsx` to `DiscoverMap.native.tsx`, rename the component to reflect its shared role, and delete the wrapper files plus the unused legacy renderer.

**Step 3: Run the passing structural check**

Run: `Get-ChildItem -Path 'components\discover' -File | Where-Object { $_.Name -like 'DiscoverMap*' } | Select-Object Name`
Expected: only `DiscoverMap.native.tsx` and `DiscoverMap.tsx` remain for the active map entrypoints.

**Step 4: Compile verification**

Run: `npx tsc --noEmit`
Expected: exit code 0.

**Step 5: Rollback strategy**

Restore the deleted wrapper and legacy files from git history, then reintroduce platform-specific exports if needed.
