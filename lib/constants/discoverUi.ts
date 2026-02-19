/**
 * discoverUi: Súbor discover Ui drží zdieľané konštanty používané vo viacerých moduloch.
 *
 * Prečo: Centralizované hodnoty v discoverUi bránia rozchodu čísel a názvov medzi obrazovkami.
 */

import type { DiscoverCategory } from "../interfaces";

export const NITRA_CENTER: [number, number] = [18.091, 48.3069];

export const DISCOVER_TOP_HORIZONTAL_PADDING = 16;
export const DISCOVER_TOP_CONTROL_HEIGHT = 42;
export const DISCOVER_TOP_CONTROL_GAP = 14;
export const DISCOVER_TOP_OFFSET = 16;

export const DISCOVER_FILTER_OPTIONS: DiscoverCategory[] = [
  "Fitness",
  "Gastro",
  "Relax",
  "Beauty",
];

export const DISCOVER_SUBCATEGORIES = [
  "Vegan",
  "Coffee",
  "Asian",
  "Pizza",
  "Sushi",
  "Fast Food",
  "Seafood",
  "Beer",
];
