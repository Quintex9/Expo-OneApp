# Android Native Map Parity Design

## Goal
- Replace the Android `WebView` map renderer with a native `react-native-maps` renderer.
- Keep iOS on the current `WebView` renderer.
- Preserve the current marker visuals as closely as possible by reusing the same compact pin assets, labels, and cluster/grouped marker images.

## Recommended Approach
- Add an Android-only `DiscoverMap.android.tsx`.
- Keep `DiscoverMap.native.tsx` as the current shared mobile `WebView` implementation, which iOS will continue using.
- Recreate the existing marker pipeline on Android with native `MapView` markers:
  - cluster markers at low zoom
  - grouped stacked markers for co-located businesses
  - single markers with the same pin image and title label under the marker

## Why This Approach
- Lowest regression risk for iOS because it stays untouched.
- Fastest path to “looks like the current WebView” on Android without rewriting the iOS renderer.
- Avoids Android `WebView` touch/repaint quirks while preserving the existing visual asset set.

## Constraints
- `react-native-maps` must remain Expo Go compatible.
- The renderer must keep the current `DiscoverMapProps` contract and camera callbacks.
- Full 1:1 basemap parity with Carto raster tiles is not possible in native `react-native-maps`, so the Google custom map style must approximate the clean light map look.

## Risks
- Native Google basemap labels will never be pixel-identical to the current Carto label raster.
- Large numbers of custom view markers can be heavier than image-only markers, so marker content should keep `tracksViewChanges={false}`.
