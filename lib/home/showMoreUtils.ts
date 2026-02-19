/**
 * showMoreUtils: Home modul show More Utils obsahuje shared pravidlá pre Home sekciu a súvisiace flowy.
 *
 * Prečo: Pravidlá centralizované v showMoreUtils držia rovnaké správanie Home a ShowMore obrazoviek.
 */

import type { BranchData } from "../interfaces";
import type { HomeCategoryFilter } from "./homeCategoryConfig";
import { normalizeHomeCategory } from "./homeCategoryConfig";

export type ShowMoreSection = "openNearYou" | "trending" | "topRated";

const compareTitle = (a: BranchData, b: BranchData) =>
  a.title.localeCompare(b.title, undefined, { sensitivity: "base" });

export const getShowMoreSectionBranches = (
  branches: BranchData[],
  section: ShowMoreSection
): BranchData[] => {
  if (section === "topRated") {
    return [...branches].sort((a, b) => {
      if (a.rating !== b.rating) {
        return b.rating - a.rating;
      }

      return compareTitle(a, b);
    });
  }

  return branches;
};

export const filterShowMoreByCategory = (
  branches: BranchData[],
  category: HomeCategoryFilter
): BranchData[] => {
  if (category === "All") {
    return branches;
  }

  return branches.filter((branch) => normalizeHomeCategory(branch.category) === category);
};

export const resolveInitialShowMoreCategory = (
  value?: string | null,
  fallback: HomeCategoryFilter = "All"
): HomeCategoryFilter => {
  const normalized = normalizeHomeCategory(value);
  return normalized ?? fallback;
};

