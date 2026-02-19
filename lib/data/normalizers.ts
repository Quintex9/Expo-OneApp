/**
 * normalizers: Dátový modul normalizers rieši sourcing, normalizáciu alebo orchestráciu dát pre aplikáciu.
 *
 * Prečo: Oddelenie dátových pravidiel v normalizers uľahčuje výmenu datasource bez zmien v komponentoch.
 */

import { ImageSourcePropType } from "react-native";
import { DUMMY_BRANCH } from "../constants/discover";
import type { BranchData, DiscoverCategory } from "../interfaces";
import { formatTitleFromId, getRatingForId } from "./utils/marker";

// Pomocne normalizacne funkcie pre branch/marker data.
const CATEGORY_PLACEHOLDERS: Record<DiscoverCategory, ImageSourcePropType> = {
  Fitness: require("../../assets/365.jpg"),
  Gastro: require("../../assets/royal.jpg"),
  Relax: require("../../assets/klub.jpg"),
  Beauty: require("../../assets/royal.jpg"),
};

export { formatTitleFromId, getRatingForId };

export const normalizeBranch = (input: Partial<BranchData> & { id?: string }): BranchData => {
  // Kategoria z inputu, inak fallback.
  const category =
    input.category && input.category !== "Multi"
      ? (input.category as DiscoverCategory)
      : (DUMMY_BRANCH.category as DiscoverCategory) ?? "Fitness";

  // Obrazok z inputu, inak placeholder/fallback.
  const image =
    input.image ??
    (category ? CATEGORY_PLACEHOLDERS[category] : undefined) ??
    DUMMY_BRANCH.image;

  // Stabilne ID.
  const rawId = input.id ?? input.title ?? DUMMY_BRANCH.title;

  // Nazov z inputu, inak odvodeny z ID.
  const baseTitle = input.title ?? formatTitleFromId(rawId);
  const title =
    baseTitle.includes("_") || baseTitle.includes("-")
      ? formatTitleFromId(baseTitle)
      : baseTitle;

  return {
    ...DUMMY_BRANCH,
    ...input,
    id: rawId,
    title,
    category,
    image,
    rating: typeof input.rating === "number" ? input.rating : DUMMY_BRANCH.rating,
    distance: input.distance ?? DUMMY_BRANCH.distance,
    hours: input.hours ?? DUMMY_BRANCH.hours,
  };
};
