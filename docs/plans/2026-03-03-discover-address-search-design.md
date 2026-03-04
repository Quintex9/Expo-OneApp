# Discover Address Search Design

**Goal:** Extend the Discover search overlay so typing an address shows address suggestions, lets the user jump to that address on the map, and lets the user save that address to favorites directly from search.

**Recommendation:** Reuse existing local app data instead of introducing remote geocoding. Build address suggestions from branch addresses that already have coordinates, then render those suggestions in the existing `DiscoverSearchSheet` above branch results.

**Why this approach**
- It fits the current architecture and does not introduce a new backend dependency.
- It keeps the feature deterministic and fast in Expo/React Native.
- It reuses the existing saved-location model, so saving from search immediately plugs into current favorites behavior.

**Data flow**
- Source address suggestions from Discover branch data (`BranchData.address` + `BranchData.coordinates`).
- Normalize and filter suggestions with shared search helpers in `lib/discover/discoverSearchUtils.ts`.
- `DiscoverScreen` computes suggestion state and passes it into `DiscoverSearchSheet`.
- `DiscoverSearchSheet` renders a dedicated address section with actions:
  - primary action: center the main map on the suggestion
  - secondary action: save the suggestion into `location`

**UI direction**
- Keep the current search overlay structure.
- Add a compact “address suggestions” section that visually matches the existing favorites/results styling.
- Each address card should emphasize the address text, show a contextual subtitle, and provide clearly separated action chips.

**Failure modes**
- No coordinates on a branch: skip it from address suggestions.
- Duplicate addresses: dedupe by normalized label + coordinate.
- Save action on an already-saved address: render a saved state and no-op instead of duplicating.

**Verification**
- Add a small script-based check for the new shared address suggestion helpers.
- Run TypeScript typecheck.
- Manually verify the search overlay flow in the app.
