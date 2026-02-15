// discoverUi constants: zdielane UI konstanty pre Discover obrazovky.
// Zodpovednost: drzi centralne centrum mesta, hlavne filtre a subkategorie.
// Vstup/Vystup: exportuje hodnoty pouzivane vo viacerych Discover screeoch.

import type { DiscoverCategory } from "../interfaces";

export const NITRA_CENTER: [number, number] = [18.091, 48.3069];

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
