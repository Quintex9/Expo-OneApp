// discoverListSelectors: selektory pre Discover list obrazovku.
// Zodpovednost: build, filter a sort list itemov z marker dat.
// Vstup/Vystup: vracia list modely pripravene pre BranchCard render.

import type { DiscoverCategory } from "../../interfaces";
import type { BranchViewModel, MarkerViewModel } from "../models";
import { normalizeCategoryValue } from "../mappers";
import { normalizeId } from "../utils/id";
import { getCategoryPreviewImages } from "../assets/categoryAssets";

// Shared selektory pre Discover list obrazovku.
export type DiscoverListSortOption = "trending" | "topRated" | "openNearYou";

export interface DiscoverListItem extends BranchViewModel {
  distanceKm: number;
}

interface BuildDiscoverListItemsOptions {
  markers: MarkerViewModel[];
  userLocation: [number, number];
  buildBranchFromMarker: (marker: MarkerViewModel) => BranchViewModel;
}

interface FilterDiscoverListItemsOptions {
  items: DiscoverListItem[];
  appliedCategories: Set<string>;
  ratingThreshold: number | null;
}

const DEG_TO_RAD = Math.PI / 180;

const getStableHash = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const getCategoryPreviewImage = (category: DiscoverCategory, markerId: string) => {
  const images = getCategoryPreviewImages(category);
  if (images.length === 0) {
    return getCategoryPreviewImages("Fitness")[0];
  }
  return images[getStableHash(markerId) % images.length];
};

export const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const radiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radiusKm * c;
};

export const buildDiscoverListItems = ({
  markers,
  userLocation,
  buildBranchFromMarker,
}: BuildDiscoverListItemsOptions): DiscoverListItem[] => {
  const [userLng, userLat] = userLocation;
  const seen = new Set<string>();
  const results: DiscoverListItem[] = [];

  markers.forEach((marker) => {
    if (marker.category === "Multi") {
      return;
    }

    const branch = buildBranchFromMarker(marker);
    const category = normalizeCategoryValue(branch.category, "Fitness");
    const distanceKm = getDistanceKm(userLat, userLng, marker.coord.lat, marker.coord.lng);
    const dedupeKey = normalizeId(branch.id ?? marker.id);

    if (seen.has(dedupeKey)) {
      return;
    }
    seen.add(dedupeKey);

    results.push({
      ...branch,
      id: branch.id ?? marker.id,
      category,
      image: getCategoryPreviewImage(category, marker.id),
      distance: `${distanceKm.toFixed(1)} km`,
      distanceKm,
    });
  });

  return results;
};

export const filterDiscoverListItems = ({
  items,
  appliedCategories,
  ratingThreshold,
}: FilterDiscoverListItemsOptions): DiscoverListItem[] => {
  return items.filter((item) => {
    const category = normalizeCategoryValue(item.category, "Fitness");

    if (appliedCategories.size > 0 && !appliedCategories.has(category)) {
      return false;
    }

    if (ratingThreshold !== null && item.rating < ratingThreshold) {
      return false;
    }

    return true;
  });
};

export const sortDiscoverListItems = (
  items: DiscoverListItem[],
  sortOption: DiscoverListSortOption,
  maxDistanceKm = 2
): DiscoverListItem[] => {
  switch (sortOption) {
    case "openNearYou":
      return items
        .filter((item) => item.distanceKm <= maxDistanceKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    case "topRated":
      return [...items].sort((a, b) => b.rating - a.rating);
    case "trending":
    default:
      return items;
  }
};
