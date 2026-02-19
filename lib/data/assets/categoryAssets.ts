/**
 * categoryAssets: Asset register category Assets mapuje kategórie a stavy na obrazové zdroje.
 *
 * Prečo: Jedno miesto pre asset mapovanie v categoryAssets zjednodušuje správu ikon a fallback obrázkov.
 */

import type { ImageSourcePropType } from "react-native";
import type { DiscoverCategory } from "../../interfaces";

const CATEGORY_PLACEHOLDER_IMAGES: Record<DiscoverCategory, ImageSourcePropType> = {
  Fitness: require("../../../assets/365.jpg"),
  Gastro: require("../../../assets/royal.jpg"),
  Relax: require("../../../assets/klub.jpg"),
  Beauty: require("../../../assets/royal.jpg"),
};

const CATEGORY_GALLERY_IMAGES: Record<DiscoverCategory, ImageSourcePropType[]> = {
  Fitness: [
    require("../../../assets/gallery/fitness/fitness_1.jpg"),
    require("../../../assets/gallery/fitness/fitness_2.jpg"),
    require("../../../assets/gallery/fitness/fitness_3.jpg"),
    require("../../../assets/gallery/fitness/fitness_4.jpg"),
  ],
  Gastro: [
    require("../../../assets/gallery/gastro/gastro_1.jpg"),
    require("../../../assets/gallery/gastro/gastro_2.jpg"),
    require("../../../assets/gallery/gastro/gastro_3.jpg"),
    require("../../../assets/gallery/gastro/gastro_4.jpg"),
  ],
  Relax: [
    require("../../../assets/gallery/relax/relax_1.jpg"),
    require("../../../assets/gallery/relax/relax_2.jpg"),
    require("../../../assets/gallery/relax/relax_3.jpg"),
    require("../../../assets/gallery/relax/relax_4.jpg"),
  ],
  Beauty: [
    require("../../../assets/gallery/beauty/beauty_1.jpg"),
    require("../../../assets/gallery/beauty/beauty_2.jpg"),
    require("../../../assets/gallery/beauty/beauty_3.jpg"),
    require("../../../assets/gallery/beauty/beauty_4.jpg"),
  ],
};

const CATEGORY_MARKER_ICONS: Record<DiscoverCategory, ImageSourcePropType> = {
  Fitness: require("../../../images/icons/fitness/fitness_without_review.png"),
  Gastro: require("../../../images/icons/gastro/gastro_without_rating.png"),
  Relax: require("../../../images/icons/relax/relax_without_rating.png"),
  Beauty: require("../../../images/icons/beauty/beauty_without_rating.png"),
};

const MULTI_MARKER_ICON: ImageSourcePropType = require("../../../images/icons/multi/multi.png");

const CATEGORY_ALIASES: Record<string, DiscoverCategory> = {
  fitness: "Fitness",
  fitnes: "Fitness",
  gastro: "Gastro",
  food: "Gastro",
  jedlo: "Gastro",
  relax: "Relax",
  wellness: "Relax",
  beauty: "Beauty",
  krasa: "Beauty",
  kozmetika: "Beauty",
};

export const resolveDiscoverCategory = (
  value?: string | null,
  fallback: DiscoverCategory = "Fitness"
): DiscoverCategory => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  return CATEGORY_ALIASES[normalized] ?? fallback;
};

export const getCategoryPlaceholderImage = (category: DiscoverCategory): ImageSourcePropType =>
  CATEGORY_PLACEHOLDER_IMAGES[category] ?? CATEGORY_PLACEHOLDER_IMAGES.Fitness;

export const getCategoryGalleryImages = (category: DiscoverCategory): ImageSourcePropType[] =>
  CATEGORY_GALLERY_IMAGES[category] ?? CATEGORY_GALLERY_IMAGES.Fitness;

export const getCategoryPreviewImages = (category: DiscoverCategory): ImageSourcePropType[] =>
  CATEGORY_GALLERY_IMAGES[category] ?? CATEGORY_GALLERY_IMAGES.Fitness;

export const getCategoryMarkerIcon = (category: DiscoverCategory): ImageSourcePropType =>
  CATEGORY_MARKER_ICONS[category] ?? MULTI_MARKER_ICON;

export const getMultiMarkerIcon = (): ImageSourcePropType => MULTI_MARKER_ICON;
