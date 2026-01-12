import { DUMMY_BRANCH } from "../constants/discover";
import type { BranchData, DiscoverCategory } from "../interfaces";

const CATEGORY_PLACEHOLDERS: Record<DiscoverCategory, any> = {
  Fitness: require("../../assets/365.jpg"),
  Gastro: require("../../assets/royal.jpg"),
  Relax: require("../../assets/klub.jpg"),
  Beauty: require("../../assets/royal.jpg"),
};

export const formatTitleFromId = (id: string) =>
  id
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const normalizeBranch = (input: Partial<BranchData> & { id?: string }): BranchData => {
  const category =
    input.category && input.category !== "Multi"
      ? (input.category as DiscoverCategory)
      : (DUMMY_BRANCH.category as DiscoverCategory) ?? "Fitness";

  const image =
    input.image ??
    (category ? CATEGORY_PLACEHOLDERS[category] : undefined) ??
    DUMMY_BRANCH.image;

  const rawId = input.id ?? input.title ?? DUMMY_BRANCH.title;
  const baseTitle = input.title ?? formatTitleFromId(rawId);
  const title =
    baseTitle.includes("_") || baseTitle.includes("-") ? formatTitleFromId(baseTitle) : baseTitle;

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
