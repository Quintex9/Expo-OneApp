/**
 * index: Hook index zapúzdruje stav a udalosti pre svoju časť aplikačného flowu.
 *
 * Prečo: Presun stavovej logiky do hooku index znižuje komplexitu obrazoviek a uľahčuje opakované použitie.
 */

export { useDiscoverFilters } from "./useDiscoverFilters";
export type { UseDiscoverFiltersReturn } from "./useDiscoverFilters";

// Kamera mapy v Discover.
export { useDiscoverCamera } from "./useDiscoverCamera";
export type { UseDiscoverCameraReturn } from "./useDiscoverCamera";

// Data pre Discover (branches + markery).
export { useDiscoverData, useSavedLocationMarkers } from "./useDiscoverData";
export type { UseDiscoverDataReturn } from "./useDiscoverData";

// Dynamicky QR kod.
export { useDynamicQRCode } from "./useDynamicQRCode";

// Home search v2.
export { useHomeSearch } from "./useHomeSearch";
export type { UseHomeSearchReturn } from "./useHomeSearch";
