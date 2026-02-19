// discoverSearchUtils: helpery pre Discover Search V2 flow.
// Zodpovednost: favorite places fallback a title-based filtrovanie.
// Vstup/Vystup: ciste funkcie bez UI side effectov.

import type { BranchData, DiscoverFavoritePlace, Location } from "../interfaces";
import { NITRA_CENTER } from "../constants/discoverUi";

interface BuildDiscoverFavoritePlacesOptions {
  locations: Location[];
  userCoord: [number, number] | null;
  t: (key: string) => string;
}

const isValidCoord = (coord?: [number, number] | null): coord is [number, number] =>
  Array.isArray(coord) &&
  coord.length === 2 &&
  Number.isFinite(coord[0]) &&
  Number.isFinite(coord[1]);

const resolveLabel = (label: string, t: (key: string) => string): string => {
  const translated = t(label);
  if (typeof translated === "string" && translated.trim().length > 0 && translated !== label) {
    return translated;
  }
  return label;
};

const dedupeFavorites = (items: DiscoverFavoritePlace[]): DiscoverFavoritePlace[] => {
  const seen = new Set<string>();
  const deduped: DiscoverFavoritePlace[] = [];

  items.forEach((item) => {
    const key = `${item.label.toLowerCase()}|${item.coord[0].toFixed(6)}|${item.coord[1].toFixed(6)}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    deduped.push(item);
  });

  return deduped;
};

export const buildDiscoverFavoritePlaces = ({
  locations,
  userCoord,
  t,
}: BuildDiscoverFavoritePlacesOptions): DiscoverFavoritePlace[] => {
  const savedPlaces = locations
    .filter((item) => item.isSaved && isValidCoord(item.coord))
    .map((item, index) => ({
      id: `saved-${index}-${item.label}`,
      label: item.label,
      coord: item.coord as [number, number],
      isSaved: true,
    }));

  if (savedPlaces.length > 0) {
    return dedupeFavorites(savedPlaces);
  }

  const fallback: DiscoverFavoritePlace[] = [];

  if (isValidCoord(userCoord)) {
    fallback.push({
      id: "favorite-your-location",
      label: resolveLabel("yourLocation", t),
      coord: userCoord,
      isSaved: false,
    });
  }

  const nitraFromLocations = locations.find((item) => item.label === "nitra");
  const nitraCoord = isValidCoord(nitraFromLocations?.coord) ? nitraFromLocations.coord : NITRA_CENTER;
  fallback.push({
    id: "favorite-nitra",
    label: resolveLabel("nitra", t),
    coord: nitraCoord,
    isSaved: false,
  });

  return dedupeFavorites(fallback);
};

export const filterDiscoverBranchesByQuery = (
  branches: BranchData[],
  query: string
): BranchData[] => {
  const normalizedQuery = query.trim().toLowerCase();
  const candidates = normalizedQuery
    ? branches.filter((branch) => branch.title.toLowerCase().includes(normalizedQuery))
    : branches;

  return [...candidates].sort((a, b) => {
    const aDistance = parseDistanceKm(a.distance);
    const bDistance = parseDistanceKm(b.distance);
    if (aDistance !== bDistance) {
      return aDistance - bDistance;
    }

    if (a.rating !== b.rating) {
      return b.rating - a.rating;
    }

    return a.title.localeCompare(b.title);
  });
};

export const sortByNearestDistance = <T extends { distanceKm: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.distanceKm - b.distanceKm);

const parseDistanceKm = (distance: string | undefined): number => {
  if (typeof distance !== "string") {
    return Number.POSITIVE_INFINITY;
  }

  const normalized = distance.replace(",", ".").trim().toLowerCase();
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
};
