/**
 * markerOverrides: Konfiguračný modul marker Overrides drží lokálne pravidlá pre úpravy dátového správania.
 *
 * Prečo: Konfigurácia v markerOverrides je oddelená od business logiky, takže zmeny sú bezpečnejšie a čitateľnejšie.
 */

import type { BranchData, DiscoverCategory } from "../../interfaces";
import { normalizeId } from "../utils/id";

// Centralna konfiguracia override hodnot pre vybrane prevadzky.
export type MarkerBranchOverride = Partial<BranchData> & {
  title?: string;
  image?: BranchData["image"];
  category?: DiscoverCategory;
};

type MarkerBranchOverrideConfig = MarkerBranchOverride & {
  aliases?: string[];
};

const BASE_MARKER_BRANCH_OVERRIDES: MarkerBranchOverrideConfig[] = [
  {
    title: "365 GYM Nitra",
    image: require("../../../assets/365.jpg"),
    category: "Fitness",
    aliases: ["gym_365", "365 gym nitra"],
  },
  {
    title: "GYM KLUB",
    image: require("../../../assets/klub.jpg"),
    category: "Fitness",
    aliases: ["gym_klub", "gym klub"],
  },
  {
    title: "Diamond Gym",
    image: require("../../../assets/klub.jpg"),
    category: "Fitness",
    aliases: ["diamond_gym", "diamond gym"],
  },
  {
    title: "Diamond Barber",
    image: require("../../../assets/royal.jpg"),
    category: "Beauty",
    aliases: ["diamond_barber", "diamond barber", "diamond_barbershop"],
  },
];

const addOverrideKey = (
  target: Record<string, MarkerBranchOverride>,
  key: string,
  value: MarkerBranchOverride
) => {
  const normalizedKey = normalizeId(key);
  if (!normalizedKey) {
    return;
  }
  target[normalizedKey] = value;
};

const translateOverrideValue = (
  override: MarkerBranchOverride,
  t: (key: string) => string
): MarkerBranchOverride => ({
  ...override,
  title: override.title ? t(override.title) : override.title,
  distance: override.distance ? t(override.distance) : override.distance,
  hours: override.hours ? t(override.hours) : override.hours,
  discount: override.discount ? t(override.discount) : override.discount,
  offers: override.offers?.map((offer) => t(offer)),
});

export const getMarkerBranchOverrides = (t: (key: string) => string) => {
  const overrides: Record<string, MarkerBranchOverride> = {};

  BASE_MARKER_BRANCH_OVERRIDES.forEach((entry) => {
    const translated = translateOverrideValue(entry, t);
    const aliasKeys = entry.aliases ?? [];

    aliasKeys.forEach((alias) => addOverrideKey(overrides, alias, translated));

    if (translated.title) {
      addOverrideKey(overrides, translated.title, translated);
    }
  });

  return overrides;
};
