# Discover Address Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add local address suggestions to Discover search and support map-jump plus save-to-favorites actions directly from the search overlay.

**Architecture:** Shared filtering and suggestion derivation lives in `lib/discover/discoverSearchUtils.ts`. `DiscoverScreen` owns orchestration and state transitions. `DiscoverSearchSheet` renders the new UI section and delegates actions upward.

**Tech Stack:** React Native, TypeScript, Expo, existing Discover UI components

---

### Task 1: Add verification for shared address suggestion helpers

**Files:**
- Create: `scripts/check-discover-address-suggestions.ts`
- Modify: `lib/discover/discoverSearchUtils.ts`

**Step 1: Write the failing verification script**
- Import the new helper exports from `lib/discover/discoverSearchUtils.ts`.
- Assert that duplicate addresses are deduped, queries filter by normalized text, and saved-state matching works.

**Step 2: Run the script to verify it fails**
- Run: `npx tsx scripts/check-discover-address-suggestions.ts`
- Expected: compile or runtime failure because the new helper exports do not exist yet.

**Step 3: Implement the minimal shared helper code**
- Add the address suggestion type, builder, and filter helpers.

**Step 4: Run the script to verify it passes**
- Run: `npx tsx scripts/check-discover-address-suggestions.ts`
- Expected: script exits successfully.

### Task 2: Wire address suggestions into Discover search orchestration

**Files:**
- Modify: `screens/DiscoverScreen.tsx`
- Modify: `lib/interfaces.tsx`

**Step 1: Extend props/types for address suggestions**
- Add a dedicated suggestion type and new `DiscoverSearchSheet` props for suggestions + actions.

**Step 2: Compute and handle suggestion actions in `DiscoverScreen`**
- Build suggestions from branch search candidates and saved locations.
- Add handlers for “go to map” and “save to favorites”.

**Step 3: Verify data flow**
- Run: `npx tsc --noEmit`
- Expected: no type errors after the prop changes.

### Task 3: Render the new address suggestion UI in the search sheet

**Files:**
- Modify: `components/discover/DiscoverSearchSheet.tsx`

**Step 1: Add a new address suggestions section**
- Render the section above branch results when there is query text and matching address suggestions.

**Step 2: Add card actions**
- Row tap should center the map via the passed handler.
- Secondary action should save the location and reflect already-saved state.

**Step 3: Keep visual consistency**
- Reuse the existing rounded card language, subtle shadows, and neutral palette.

### Task 4: Verify and review

**Files:**
- No new files required

**Step 1: Run verification**
- Run: `npx tsx scripts/check-discover-address-suggestions.ts`
- Run: `npx tsc --noEmit`

**Step 2: Run a short regression review**
- Confirm branch search, favorites chips, and empty state still render correctly.
