# Discover Map Single Layer Click Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move single-marker interaction off DOM click handlers so Android marker taps do not trigger DOM marker blink.

**Architecture:** Keep all marker visuals on the existing DOM-marker path for visual parity, but disable direct DOM interaction for `single` markers. Add a dedicated GeoJSON hit-test layer inside MapLibre for `single` markers and handle taps by querying rendered features on map click, then send the same `markerPress` payload back to React Native.

**Tech Stack:** React Native, `react-native-webview`, MapLibre GL JS, TypeScript

---

### Task 1: Replace single-marker DOM click path with layer-based click handling

**Files:**
- Create: `docs/plans/2026-03-03-discover-map-single-layer-click.md`
- Modify: `components/discover/DiscoverMap.native.tsx`

**Step 1: Write the failing structural check**

Run: `Select-String -Path 'components\discover\DiscoverMap.native.tsx' -Pattern 'single-markers|singleMarkers'`
Expected: no match because the current implementation does not have a dedicated single-marker MapLibre layer.

**Step 2: Implement the layer-based single marker path**

Add a MapLibre GeoJSON source plus transparent hit-test layer for single markers, route clicks through map feature queries, and keep the visible single marker rendered by the existing DOM marker renderer.

**Step 3: Run the passing structural check**

Run: `Select-String -Path 'components\discover\DiscoverMap.native.tsx' -Pattern 'single-markers|singleMarkers'`
Expected: matches showing the dedicated single-marker layer path exists.

**Step 4: Compile verification**

Run: `npx tsc --noEmit`
Expected: exit code 0.

**Step 5: Rollback strategy**

Revert `components/discover/DiscoverMap.native.tsx` to restore the old DOM-marker path if layer-based rendering introduces regressions.
