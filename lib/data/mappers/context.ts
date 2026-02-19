/**
 * context: Mapper context prevádza zdrojové DTO dáta na view model pripravený pre UI.
 *
 * Prečo: Jasne oddelený mapping v context drží fallback pravidlá a normalizáciu mimo komponentov.
 */

import type { ImageSourcePropType } from "react-native";
import { DUMMY_BRANCH, translateBranchOffers } from "../../constants/discover";
import type { DiscoverCategory, BranchData } from "../../interfaces";
import { getMarkerBranchOverrides, type MarkerBranchOverride } from "../config/markerOverrides";
import type { BranchViewModel } from "../models";
import { normalizeId } from "../utils/id";
import {
  getCategoryGalleryImages,
  getCategoryMarkerIcon,
  getCategoryPlaceholderImage,
  getMultiMarkerIcon,
} from "../assets/categoryAssets";

// Kontext pre mapovanie DTO -> ViewModel.
const CATEGORY_KEYS = new Set<DiscoverCategory>(["Fitness", "Gastro", "Relax", "Beauty"]);

const toTrimmedString = (value?: string | null) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const normalizeCategoryValue = (
  value?: string | null,
  fallback: DiscoverCategory = "Fitness"
): DiscoverCategory => {
  const raw = toTrimmedString(value);
  if (!raw) {
    return fallback;
  }

  const normalized = raw.toLowerCase();
  if (normalized === "fitness" || normalized === "fitnes") {
    return "Fitness";
  }
  if (normalized === "gastro" || normalized === "food" || normalized === "jedlo") {
    return "Gastro";
  }
  if (normalized === "relax" || normalized === "wellness") {
    return "Relax";
  }
  if (normalized === "beauty" || normalized === "krasa" || normalized === "kozmetika") {
    return "Beauty";
  }

  return CATEGORY_KEYS.has(raw as DiscoverCategory)
    ? (raw as DiscoverCategory)
    : fallback;
};

export interface MapperContext {
  t: (key: string) => string;
  defaultBranch: BranchViewModel;
  resolveOverride: (id: string) => MarkerBranchOverride | undefined;
  resolveCategory: (value?: string | null, fallback?: DiscoverCategory) => DiscoverCategory;
  resolveBranchPlaceholderImage: (category: DiscoverCategory) => ImageSourcePropType;
  resolveBranchGalleryImages: (category: DiscoverCategory) => ImageSourcePropType[];
  resolveMarkerIcon: (category: DiscoverCategory | "Multi", iconUrl?: string | null) => ImageSourcePropType;
  translateKey: (value?: string | null) => string | undefined;
}

interface MapperContextOptions {
  t: (key: string) => string;
  markerBranchOverrides?: Record<string, MarkerBranchOverride>;
}

const normalizeOverrideRecord = (
  overrides?: Record<string, MarkerBranchOverride>
): Record<string, MarkerBranchOverride> => {
  if (!overrides) {
    return {};
  }

  const normalized: Record<string, MarkerBranchOverride> = {};
  Object.entries(overrides).forEach(([key, value]) => {
    const canonical = normalizeId(key);
    if (!canonical) {
      return;
    }
    normalized[canonical] = value;
  });

  return normalized;
};

const maybeUriImage = (value?: string | null): ImageSourcePropType | undefined => {
  const uri = toTrimmedString(value);
  if (!uri) {
    return undefined;
  }

  if (!uri.startsWith("http://") && !uri.startsWith("https://")) {
    return undefined;
  }

  return { uri };
};

export const createMapperContext = ({
  t,
  markerBranchOverrides,
}: MapperContextOptions): MapperContext => {
  const defaultBranch = translateBranchOffers(DUMMY_BRANCH, t);
  const builtInOverrides = getMarkerBranchOverrides(t);
  const customOverrides = normalizeOverrideRecord(markerBranchOverrides);

  const overrideLookup: Record<string, MarkerBranchOverride> = {
    ...builtInOverrides,
    ...customOverrides,
  };

  return {
    t,
    defaultBranch,
    resolveOverride: (id: string) => overrideLookup[normalizeId(id)],
    resolveCategory: (value?: string | null, fallback = "Fitness") =>
      normalizeCategoryValue(value, fallback),
    resolveBranchPlaceholderImage: (category: DiscoverCategory) =>
      getCategoryPlaceholderImage(category) ?? defaultBranch.image,
    resolveBranchGalleryImages: (category: DiscoverCategory) =>
      getCategoryGalleryImages(category) ?? [],
    resolveMarkerIcon: (category: DiscoverCategory | "Multi", iconUrl?: string | null) => {
      const uriImage = maybeUriImage(iconUrl);
      if (uriImage) {
        return uriImage;
      }

      if (category === "Multi") {
        return getMultiMarkerIcon();
      }

      return getCategoryMarkerIcon(category);
    },
    translateKey: (value?: string | null) => {
      const normalized = toTrimmedString(value);
      if (!normalized) {
        return undefined;
      }
      return t(normalized);
    },
  };
};

export const mergeBranchImages = (
  primaryImage: ImageSourcePropType,
  galleryImages: ImageSourcePropType[]
): ImageSourcePropType[] => {
  return [primaryImage, ...galleryImages];
};

export const toBranchOverride = (override?: MarkerBranchOverride): MarkerBranchOverride => {
  if (!override) {
    return {};
  }

  return {
    ...override,
    title: toTrimmedString(override.title),
  };
};

export const toNonEmptyString = toTrimmedString;
export const toUriImage = maybeUriImage;
