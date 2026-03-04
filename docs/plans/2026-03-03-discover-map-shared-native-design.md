# Discover Map Shared Native Design

**Goal:** Keep one Discover map implementation for both iOS and Android and remove redundant platform wrappers.

**Context:** The project now uses the same map renderer on both mobile platforms. The previous file chain (`DiscoverMap.native.tsx` -> `DiscoverMap.android.tsx` -> `DiscoverMap.ios.tsx`) adds indirection without any platform-specific behavior.

**Decision:** Promote the shared mobile renderer to `components/discover/DiscoverMap.native.tsx`, keep `components/discover/DiscoverMap.tsx` as the web fallback, and remove obsolete wrapper files plus the unused legacy native renderer.

**Why this is better:**
- Metro resolves `.native.tsx` for both iOS and Android, which matches the current behavior.
- The import surface stays unchanged (`import DiscoverMap from "../components/discover/DiscoverMap";`).
- Dead code and unnecessary wrapper hops are removed, making the structure easier to understand and maintain.

**Rollback:** Restore `DiscoverMap.android.tsx` and `DiscoverMapLegacy.native.tsx`, then point `DiscoverMap.native.tsx` back to the Android wrapper if a platform-specific path is needed again.
