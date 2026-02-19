/**
 * homeSearchTypes: Definuje typové kontrakty pre Home Search index, vstupy a výsledné položky.
 *
 * Prečo: Presné typy chránia kompatibilitu medzi search enginom, hookom a overlay komponentom.
 */

import type { BranchData, DiscoverCategory } from "../interfaces";

export type HomeSearchScope = "All" | DiscoverCategory;

export type HomeSearchMatchReason =
  | "name"
  | "tag"
  | "menu"
  | "alias"
  | "category"
  | "offer";

export interface HomeSearchIndexEntry {
  branch: BranchData;
  dedupeKey: string;
  titleTokens: string[];
  titleTokenSet: Set<string>;
  tagTerms: string[];
  tagTokenSet: Set<string>;
  menuTerms: string[];
  menuTokenSet: Set<string>;
  aliasTerms: string[];
  aliasTokenSet: Set<string>;
  offerTerms: string[];
  offerTokenSet: Set<string>;
  categoryTerm: string;
  categoryTokenSet: Set<string>;
  distanceKm: number;
}

export interface HomeSearchIndex {
  entries: HomeSearchIndexEntry[];
}

export interface HomeSearchResult {
  branch: BranchData;
  score: number;
  distanceKm: number;
  reasons: HomeSearchMatchReason[];
  primaryReason: HomeSearchMatchReason;
}

export interface SearchHomeBranchesOptions {
  scope?: HomeSearchScope;
  threshold?: number;
  limit?: number;
}
